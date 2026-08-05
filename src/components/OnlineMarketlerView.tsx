import React, { useState, useEffect } from 'react';
import {
  Store,
  Plus,
  Settings,
  DollarSign,
  TrendingUp,
  Receipt,
  Search,
  CheckCircle,
  Clock,
  ArrowDownRight,
  Landmark,
  Wallet,
  Building2,
  Percent,
  Calendar,
  X,
  Printer,
  ChevronRight,
  Filter,
  Trash2,
  PieChart
} from 'lucide-react';
import { Stock, Cari, BankAccount, Transaction } from '../types';
import { PosPlatformConfig, DEFAULT_POS_PLATFORMS } from '../types/pos';
import { getActiveWorkspace, saveOnlineOrder, deleteOnlineOrder, saveOnlinePayout, deleteOnlinePayout, savePosPlatform } from '../firebase';

const getOnlineOrdersKey = () => {
  const ws = getActiveWorkspace();
  return `storm_online_market_orders_${ws}`;
};

const getOnlinePayoutsKey = () => {
  const ws = getActiveWorkspace();
  return `storm_online_market_payouts_${ws}`;
};
import {
  OnlineMarketOrder,
  OnlineMarketPayout,
  OnlineMarketPlatformSummary
} from '../types/onlineMarket';
import { reportErrorToTelegram } from '../utils/telegramLogger';
import { PosPlatformSettingsModal } from './pos/PosPlatformSettingsModal';

interface OnlineMarketlerViewProps {
  appData?: any;
  stocks: Stock[];
  cariler: Cari[];
  bankAccounts: BankAccount[];
  islemler: Transaction[];
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
  onCompleteOnlineSale: (saleData: {
    receiptNo: string;
    platformId: string;
    platformName: string;
    commissionRate: number;
    commissionAmount: number;
    netAmount: number;
    grossTotal: number;
    date: string;
    customerName: string;
    items?: any[];
    syncToMainAccounting?: boolean;
  }) => Promise<boolean>;
  onRecordPayout: (payoutData: {
    platformId: string;
    platformName: string;
    amount: number;
    destinationType: 'bank' | 'cash';
    bankAccountId?: string;
    bankAccountName: string;
    date: string;
    note: string;
    syncToMainAccounting?: boolean;
  }) => Promise<boolean>;
}

export const OnlineMarketlerView: React.FC<OnlineMarketlerViewProps> = ({
  appData,
  stocks = [],
  cariler = [],
  bankAccounts = [],
  islemler = [],
  showToast,
  onCompleteOnlineSale,
  onRecordPayout,
}) => {
  const safeBankAccounts = Array.isArray(bankAccounts) ? bankAccounts : [];
  const safeStocks = Array.isArray(stocks) ? stocks : [];
  const safeCariler = Array.isArray(cariler) ? cariler : [];
  const safeIslemler = Array.isArray(islemler) ? islemler : [];

  // PLATFORMLAR (DEFAULT_POS_PLATFORMS ile uyumlu)
  const [platforms, setPlatforms] = useState<PosPlatformConfig[]>(() => {
    try {
      const saved = localStorage.getItem('storm_pos_platform_rates');
      const loaded: PosPlatformConfig[] = saved ? JSON.parse(saved) : DEFAULT_POS_PLATFORMS;
      if (!Array.isArray(loaded) || loaded.length === 0) return DEFAULT_POS_PLATFORMS;
      // Exclude invalid/broken entries but keep all real platforms including Trendyol, Getir, Yemeksepeti, Migros, Uber
      return loaded.filter((p) => p && p.id && p.name);
    } catch (e) {
      return DEFAULT_POS_PLATFORMS;
    }
  });

  const safePlatforms = Array.isArray(platforms) && platforms.length > 0 ? platforms : DEFAULT_POS_PLATFORMS;

  // Removed localStorage useEffect

  // ONLİNE SİPARİŞLER STATE
  const orders = appData?.onlineOrders || [];

  const safeOrders = Array.isArray(orders) ? orders : [];

  // HAKEDİŞ TAHSİLATLARI STATE
  const payouts = appData?.onlinePayouts || [];

  const safePayouts = Array.isArray(payouts) ? payouts : [];

  // Removed localStorage effects for orders and payouts

  // Hızlı Satış veya harici kaynaklardan sipariş eklendiğinde state'i otomatik yenileme
  useEffect(() => {
    const handleReloadOnlineData = () => {
      try {
        // Realtime loading already handled by appData
      } catch (e) {
        console.error(e);
      }
    };

    window.addEventListener('storm_online_orders_updated', handleReloadOnlineData);
    window.addEventListener('storage', handleReloadOnlineData);
    return () => {
      window.removeEventListener('storm_online_orders_updated', handleReloadOnlineData);
      window.removeEventListener('storage', handleReloadOnlineData);
    };
  }, []);

  // MODALLAR
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isPayoutModalOpen, setIsPayoutModalOpen] = useState(false);
  const [selectedPlatformForAction, setSelectedPlatformForAction] = useState<PosPlatformConfig | null>(null);
  const [syncToMainAccounting, setSyncToMainAccounting] = useState<boolean>(false);

  // FİLTRELER
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'payouts'>('overview');
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // YENİ SİPARİŞ FORM STATE'LERİ
  const [orderPlatformId, setOrderPlatformId] = useState<string>('yemeksepeti');
  const [orderCustomerName, setOrderCustomerName] = useState<string>('');
  const [orderGrossAmount, setOrderGrossAmount] = useState<number | ''>('');
  const [orderNote, setOrderNote] = useState<string>('');
  const [orderItems, setOrderItems] = useState<{ stockId: string; stockName: string; quantity: number; unitPrice: number; totalLine: number }[]>([]);

  // TAHSİLAT FORM STATE'LERİ
  const [payoutPlatformId, setPayoutPlatformId] = useState<string>('yemeksepeti');
  const [payoutAmount, setPayoutAmount] = useState<number | ''>('');
  const [payoutDestinationType, setPayoutDestinationType] = useState<'bank' | 'cash'>('bank');
  const [payoutBankAccountId, setPayoutBankAccountId] = useState<string>('');
  const [payoutNote, setPayoutNote] = useState<string>('');

  // SEÇİLİ PLATFORM İÇİN ORAN VE HESAPLAMA
  const activeOrderPlatform = safePlatforms.find((p) => p && p.id === orderPlatformId) || safePlatforms[0] || { id: 'yemeksepeti', name: 'Yemeksepeti', commissionRate: 15 };
  const orderCommRate = activeOrderPlatform ? activeOrderPlatform.commissionRate : 15;
  const numericGross = typeof orderGrossAmount === 'number' ? orderGrossAmount : Number(orderGrossAmount) || 0;
  const orderCommAmount = (numericGross * orderCommRate) / 100;
  const orderNetAmount = numericGross - orderCommAmount;

  // HAKEDİŞ / ALACAK HESAPLAMALARI
  const platformSummaries: OnlineMarketPlatformSummary[] = safePlatforms.map((plat) => {
    const platOrders = safeOrders.filter((o) => o && o.platformId === plat.id && o.status !== 'cancelled');
    const platPayouts = safePayouts.filter((p) => p && p.platformId === plat.id);

    const totalGross = platOrders.reduce((sum, o) => sum + (o?.grossAmount || 0), 0);
    const totalCommission = platOrders.reduce((sum, o) => sum + (o?.commissionAmount || 0), 0);
    const totalNet = platOrders.reduce((sum, o) => sum + (o?.netAmount || 0), 0);
    const totalPaidOut = platPayouts.reduce((sum, p) => sum + (p?.amount || 0), 0);
    const pendingBalance = totalNet - totalPaidOut;

    return {
      platform: plat,
      totalGross,
      totalCommission,
      totalNet,
      totalPaidOut,
      pendingBalance,
      orderCount: platOrders.length,
    };
  });

  // GENEL ÖZET METRİKLERİ
  const grandTotalGross = platformSummaries.reduce((sum, p) => sum + p.totalGross, 0);
  const grandTotalCommission = platformSummaries.reduce((sum, p) => sum + p.totalCommission, 0);
  const grandTotalNet = platformSummaries.reduce((sum, p) => sum + p.totalNet, 0);
  const grandTotalPaidOut = platformSummaries.reduce((sum, p) => sum + p.totalPaidOut, 0);
  const grandPendingBalance = grandTotalNet - grandTotalPaidOut;

  // YENİ SİPARİŞ KAYDETME
  const handleSaveOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numericGross || numericGross <= 0) {
      showToast('Lütfen geçerli bir sipariş tutarı girin.', 'error');
      return;
    }

    const orderNo = `ONL-${Math.floor(100000 + Math.random() * 900000)}`;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().split(' ')[0].slice(0, 5);
    const custName = orderCustomerName.trim() || `${activeOrderPlatform.name} Müşterisi`;

    const newOrder: OnlineMarketOrder = {
      id: `ord_${Date.now()}`,
      orderNo,
      platformId: activeOrderPlatform.id,
      platformName: activeOrderPlatform.name,
      date: dateStr,
      time: timeStr,
      customerName: custName,
      grossAmount: numericGross,
      commissionRate: orderCommRate,
      commissionAmount: orderCommAmount,
      netAmount: orderNetAmount,
      items: orderItems,
      status: 'completed',
      note: orderNote.trim(),
      createdAt: now.toISOString(),
    };

    // Main App Transaction Entegrasyonu
    const success = await onCompleteOnlineSale({
      receiptNo: orderNo,
      platformId: activeOrderPlatform.id,
      platformName: activeOrderPlatform.name,
      commissionRate: orderCommRate,
      commissionAmount: orderCommAmount,
      netAmount: orderNetAmount,
      grossTotal: numericGross,
      date: dateStr,
      customerName: custName,
      items: orderItems,
      syncToMainAccounting,
    });

    if (success) {
      await saveOnlineOrder(newOrder);
      showToast(`${activeOrderPlatform.name} siparişi başarıyla kaydedildi! Net Alacak: ₺${orderNetAmount.toFixed(2)}`, 'success');
      setIsNewOrderModalOpen(false);
      setOrderGrossAmount('');
      setOrderCustomerName('');
      setOrderNote('');
      setOrderItems([]);
    }
  };

  // HAKEDİŞ TAHSİLAT KAYDI
  const handleSavePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetPlatform = safePlatforms.find((p) => p && p.id === payoutPlatformId);
    if (!targetPlatform) return;

    const numAmount = typeof payoutAmount === 'number' ? payoutAmount : Number(payoutAmount) || 0;
    if (!numAmount || numAmount <= 0) {
      showToast('Lütfen geçerli bir tahsilat tutarı girin.', 'error');
      return;
    }

    let destName = 'Kasa Hesabı';
    if (payoutDestinationType === 'bank') {
      const bAcc = safeBankAccounts.find((b) => b && b.id === payoutBankAccountId);
      if (!bAcc && safeBankAccounts.length > 0) {
        showToast('Lütfen aktarılacak banka hesabını seçin.', 'error');
        return;
      }
      destName = bAcc ? `${bAcc.bankName} (${bAcc.accountName})` : 'Banka Hesabı';
    }

    const payoutNo = `HAK-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];

    const newPayout: OnlineMarketPayout = {
      id: `pay_${Date.now()}`,
      payoutNo,
      platformId: targetPlatform.id,
      platformName: targetPlatform.name,
      date: dateStr,
      amount: numAmount,
      destinationAccountType: payoutDestinationType,
      destinationAccountId: payoutDestinationType === 'bank' ? payoutBankAccountId : undefined,
      destinationAccountName: destName,
      note: payoutNote.trim(),
      createdAt: now.toISOString(),
    };

    const success = await onRecordPayout({
      platformId: targetPlatform.id,
      platformName: targetPlatform.name,
      amount: numAmount,
      destinationType: payoutDestinationType,
      bankAccountId: payoutDestinationType === 'bank' ? payoutBankAccountId : undefined,
      bankAccountName: destName,
      date: dateStr,
      note: payoutNote.trim() || `${targetPlatform.name} hakediş tahsilatı`,
      syncToMainAccounting,
    });

    if (success) {
      await saveOnlinePayout(newPayout);
      showToast(`${targetPlatform.name} platformundan ₺${numAmount.toFixed(2)} tutarında hakediş tahsilatı alındı!`, 'success');
      setIsPayoutModalOpen(false);
      setPayoutAmount('');
      setPayoutNote('');
    }
  };

  // SİPARİŞ İPTALİ / SİLME
  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('Bu online sipariş kaydını silmek istediğinizden emin misiniz?')) {
      await deleteOnlineOrder(orderId);
      showToast('Sipariş kaydı silindi.', 'info');
    }
  };

  // FİLTRELENMİŞ SİPARİŞLER
  const filteredOrders = safeOrders.filter((o) => {
    if (!o) return false;
    const matchesPlatform = selectedPlatformFilter === 'all' || o.platformId === selectedPlatformFilter;
    const term = (searchTerm || '').toLowerCase();
    const matchesSearch =
      !term ||
      (o.orderNo || '').toLowerCase().includes(term) ||
      (o.customerName || '').toLowerCase().includes(term) ||
      (o.platformName || '').toLowerCase().includes(term);
    return matchesPlatform && matchesSearch;
  });

  // FİLTRELENMİŞ TAHSİLATLAR
  const filteredPayouts = safePayouts.filter((p) => {
    if (!p) return false;
    const matchesPlatform = selectedPlatformFilter === 'all' || p.platformId === selectedPlatformFilter;
    const term = (searchTerm || '').toLowerCase();
    const matchesSearch =
      !term ||
      (p.payoutNo || '').toLowerCase().includes(term) ||
      (p.platformName || '').toLowerCase().includes(term) ||
      (p.destinationAccountName || '').toLowerCase().includes(term);
    return matchesPlatform && matchesSearch;
  });

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto animate-fade-in">
      {/* BAŞLIK & ANA AKSİYONLAR */}
      <div className="flex flex-col md:flex-row flex-wrap md:items-center justify-between gap-4 bg-white border border-slate-200/90 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
        <div className="flex flex-wrap items-center gap-3.5">
          <div
            className="w-12 h-12 rounded-2xl text-white flex items-center justify-center font-bold shadow-md shrink-0"
            style={{
              backgroundColor: 'var(--accent-600, #0284c7)',
              boxShadow: '0 4px 12px color-mix(in srgb, var(--accent-500, #0ea5e9) 30%, transparent)'
            }}
          >
            <Store size={26} strokeWidth={2.2} />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 flex items-center gap-2 flex-wrap">
              Online Marketler & Pazaryerleri
              <span
                className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-500, #0ea5e9) 12%, transparent)',
                  color: 'var(--accent-800, #0369a1)',
                  borderColor: 'color-mix(in srgb, var(--accent-500, #0ea5e9) 30%, transparent)'
                }}
              >
                Otomatik Komisyon Düşüşü
              </span>
              <span className="text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                ✓ Bağımsız Modül (Ana Muhasebeden İzole)
              </span>
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Yemeksepeti, Getir, Migros Yemek, Uber Trendyol siparişleri, kesintileri ve net hakediş alacak bakiyeleri
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/90 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Settings size={15} className="text-slate-500" />
            <span>Platform & Komisyon Ayarları</span>
          </button>

          <button
            onClick={() => {
              if (safeBankAccounts.length === 0) {
                setPayoutDestinationType('cash');
              } else {
                setPayoutBankAccountId(safeBankAccounts[0].id);
              }
              setIsPayoutModalOpen(true);
            }}
            className="px-3.5 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-all flex items-center gap-2 cursor-pointer shadow-xs"
          >
            <Landmark size={15} className="text-emerald-700" />
            <span>Hakediş Tahsil Et (Bankaya Aktar)</span>
          </button>

          <button
            onClick={() => {
              setOrderPlatformId(platforms[0]?.id || 'yemeksepeti');
              setIsNewOrderModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl text-xs font-black text-white transition-all flex items-center gap-2 cursor-pointer shadow-md hover:opacity-90 active:scale-95"
            style={{
              backgroundColor: 'var(--accent-600, #0284c7)',
              boxShadow: '0 4px 12px color-mix(in srgb, var(--accent-500, #0ea5e9) 30%, transparent)'
            }}
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>+ Yeni Online Sipariş Gir</span>
          </button>
        </div>
      </div>

      {/* METRİK KARTLARI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Toplam Brüt Satış */}
        <div className="p-4.5 bg-white border border-slate-200/90 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold uppercase tracking-wider">
            <span>Toplam Online Satış (Brüt)</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Receipt size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            ₺{grandTotalGross.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-semibold">
            <span className="text-blue-600 font-extrabold">{orders.length}</span> sipariş kaydı
          </p>
        </div>

        {/* Toplam Kesilen Komisyon */}
        <div className="p-4.5 bg-white border border-slate-200/90 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold uppercase tracking-wider">
            <span>Kesilen Platform Komisyonu</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
              <Percent size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            -₺{grandTotalCommission.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            Pazaryeri hizmet & kurye giderleri
          </p>
        </div>

        {/* Bekleyen Net Alacak Bakiyesi (VURGULANMIŞ KART) */}
        <div
          className="p-4.5 rounded-2xl shadow-md hover:shadow-lg transition-all relative overflow-hidden border-2"
          style={{
            background: 'linear-gradient(135deg, color-mix(in srgb, var(--accent-50, #f0f9ff) 80%, #ffffff) 0%, color-mix(in srgb, var(--accent-100, #e0f2fe) 60%, #ffffff) 100%)',
            borderColor: 'color-mix(in srgb, var(--accent-400, #38bdf8) 60%, transparent)'
          }}
        >
          <div
            className="flex items-center justify-between text-xs font-extrabold uppercase tracking-wider"
            style={{ color: 'var(--accent-950, #031b2c)' }}
          >
            <span>Pazaryerlerinde Bekleyen Net Alacak</span>
            <div
              className="p-2 rounded-xl border shadow-xs"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--accent-200, #bae6fd) 70%, #ffffff)',
                color: 'var(--accent-800, #075985)',
                borderColor: 'color-mix(in srgb, var(--accent-300, #7dd3fc) 80%, transparent)'
              }}
            >
              <Clock size={18} />
            </div>
          </div>
          <div
            className="text-3xl font-black mt-2"
            style={{ color: 'var(--accent-700, #0369a1)' }}
          >
            ₺{grandPendingBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p
            className="text-xs mt-1 font-bold"
            style={{ color: 'color-mix(in srgb, var(--accent-900, #0c4a6e) 80%, transparent)' }}
          >
            Tahsil edilmeyi bekleyen net hakedişler
          </p>
        </div>

        {/* Tahsil Edilen Toplam Tutar */}
        <div className="p-4.5 bg-white border border-slate-200/90 rounded-2xl shadow-sm hover:shadow-md transition-all relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-600 text-xs font-bold uppercase tracking-wider">
            <span>Hesaba Geçen / Tahsil Edilen</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <CheckCircle size={18} />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-2">
            ₺{grandTotalPaidOut.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-xs text-slate-500 mt-1 font-semibold">
            Bankaya veya Kasaya Aktarılan Toplam
          </p>
        </div>
      </div>

      {/* PLATFORM KARTLARI (CARİ GİBİ SÜREKLİ HESAP TAKİBİ) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Building2 size={16} style={{ color: 'var(--accent-600, #0284c7)' }} />
            Aktif Online Pazaryerleri & Platform Bakiyeleri
          </h2>
          <span className="text-xs text-slate-500 font-semibold">Her platform ayrı bir cari hakediş hesabı gibi takip edilir</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {platformSummaries.map((summary) => {
            const { platform, totalGross, totalCommission, totalNet, totalPaidOut, pendingBalance, orderCount } = summary;
            return (
              <div
                key={platform.id}
                className={`p-4.5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                  pendingBalance > 0
                    ? 'bg-gradient-to-br from-white via-slate-50 to-white shadow-md'
                    : 'bg-white border-slate-200/90 hover:border-slate-300 shadow-sm'
                }`}
                style={
                  pendingBalance > 0
                    ? {
                        borderColor: 'color-mix(in srgb, var(--accent-500, #0ea5e9) 40%, transparent)',
                        boxShadow: '0 4px 14px color-mix(in srgb, var(--accent-500, #0ea5e9) 12%, transparent)'
                      }
                    : {}
                }
              >
                <div>
                  {/* Platform Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shadow-xs"
                        style={{ backgroundColor: platform.bgColor || '#f97316', color: platform.textColor || '#ffffff' }}
                      >
                        {platform.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900">{platform.name}</h3>
                        <div className="flex items-center gap-2 text-xs mt-0.5">
                          <span
                            className="font-bold px-2 py-0.5 rounded-md border text-[11px]"
                            style={{
                              backgroundColor: 'color-mix(in srgb, var(--accent-100, #e0f2fe) 80%, transparent)',
                              color: 'var(--accent-800, #075985)',
                              borderColor: 'color-mix(in srgb, var(--accent-200, #bae6fd) 60%, transparent)'
                            }}
                          >
                            %{platform.commissionRate} Komisyon
                          </span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-600 font-semibold text-[11px]">{orderCount} Sipariş</span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                        platform.active
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                    >
                      {platform.active ? 'Aktif' : 'Pasif'}
                    </span>
                  </div>

                  {/* Financial Metrics Breakdown */}
                  <div className="py-3 space-y-2 text-xs">
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="font-semibold">• Toplam Brüt Sipariş:</span>
                      <span className="font-bold text-slate-900">₺{totalGross.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="font-semibold">• Kesilen Komisyon (%{platform.commissionRate}):</span>
                      <span className="font-bold text-rose-600">-₺{totalCommission.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="font-semibold">• Hesaba Geçecek Net Toplam:</span>
                      <span className="font-bold text-emerald-700">₺{totalNet.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center text-slate-600">
                      <span className="font-semibold">• Alınan Tahsilat (Aktarılan):</span>
                      <span className="font-bold text-slate-800">₺{totalPaidOut.toFixed(2)}</span>
                    </div>

                    <div className="pt-2.5 border-t border-slate-200 flex items-center justify-between">
                      <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wider">Net Alacak Bakiyesi:</span>
                      <span
                        className="text-lg font-black"
                        style={{ color: pendingBalance > 0 ? 'var(--accent-700, #0369a1)' : '#94a3b8' }}
                      >
                        ₺{pendingBalance.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="pt-3 border-t border-slate-200 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setOrderPlatformId(platform.id);
                      setIsNewOrderModalOpen(true);
                    }}
                    className="flex-1 py-2 px-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus size={14} style={{ color: 'var(--accent-600, #0284c7)' }} />
                    <span>Sipariş Gir</span>
                  </button>

                  <button
                    onClick={() => {
                      setPayoutPlatformId(platform.id);
                      setPayoutAmount(pendingBalance > 0 ? pendingBalance : '');
                      if (safeBankAccounts.length > 0) {
                        setPayoutBankAccountId(safeBankAccounts[0].id);
                      }
                      setIsPayoutModalOpen(true);
                    }}
                    disabled={pendingBalance <= 0}
                    className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      pendingBalance > 0
                        ? 'text-white shadow-sm hover:opacity-90'
                        : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                    }`}
                    style={
                      pendingBalance > 0
                        ? {
                            backgroundColor: 'var(--accent-600, #0284c7)',
                            boxShadow: '0 2px 8px color-mix(in srgb, var(--accent-500, #0ea5e9) 25%, transparent)'
                          }
                        : {}
                    }
                  >
                    <Landmark size={14} />
                    <span>Tahsilat Al</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SİPARİŞ VE TAHSİLAT GEÇMİŞİ SEKMELERİ */}
      <div className="bg-white border border-slate-200/90 rounded-2xl p-4.5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row flex-wrap items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setActiveTab('overview')}
              className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
              style={
                activeTab === 'overview'
                  ? {
                      backgroundColor: 'var(--accent-600, #0284c7)',
                      color: '#ffffff',
                      boxShadow: '0 2px 8px color-mix(in srgb, var(--accent-500, #0ea5e9) 25%, transparent)'
                    }
                  : { color: '#475569' }
              }
            >
              Tüm Online Siparişler ({safeOrders.length})
            </button>
            <button
              onClick={() => setActiveTab('payouts')}
              className="px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer"
              style={
                activeTab === 'payouts'
                  ? {
                      backgroundColor: 'var(--accent-600, #0284c7)',
                      color: '#ffffff',
                      boxShadow: '0 2px 8px color-mix(in srgb, var(--accent-500, #0ea5e9) 25%, transparent)'
                    }
                  : { color: '#475569' }
              }
            >
              Hakediş Tahsilat Geçmişi ({safePayouts.length})
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 sm:w-60">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Sipariş / Fiş Ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[var(--accent-500)]"
              />
            </div>

            {/* Platform Filter */}
            <select
              value={selectedPlatformFilter}
              onChange={(e) => setSelectedPlatformFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[var(--accent-500)] cursor-pointer"
            >
              <option value="all">Tüm Platformlar</option>
              {platforms.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TABLO: TÜM ONLİNE SİPARİŞLER */}
        {activeTab === 'overview' && (
          <div className="overflow-x-auto custom-scrollbar">
            {filteredOrders.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs font-medium">
                {safeOrders.length === 0
                  ? 'Henüz kaydedilmiş online sipariş bulunmuyor. "+ Yeni Online Sipariş Gir" butonunu kullanarak siparişlerinizi ekleyebilirsiniz.'
                  : 'Arama kriterlerinize uygun online sipariş bulunamadı.'}
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Tarih / Saat</th>
                    <th className="py-3 px-3">Fiş / Sipariş No</th>
                    <th className="py-3 px-3">Platform</th>
                    <th className="py-3 px-3">Müşteri / Cari</th>
                    <th className="py-3 px-3 text-right">Brüt Tutar</th>
                    <th className="py-3 px-3 text-center">Komisyon</th>
                    <th className="py-3 px-3 text-right">Net Alacak</th>
                    <th className="py-3 px-3 text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {filteredOrders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap font-semibold">
                        {ord.date} {ord.time}
                      </td>
                      <td
                        className="py-3 px-3 font-extrabold font-mono whitespace-nowrap"
                        style={{ color: 'var(--accent-700, #0369a1)' }}
                      >
                        {ord.orderNo}
                      </td>
                      <td className="py-3 px-3 font-medium text-slate-800 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-bold">
                          {ord.platformName}
                        </span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{ord.customerName}</td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900 whitespace-nowrap">
                        ₺{ord.grossAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center text-rose-600 font-bold whitespace-nowrap">
                        %{ord.commissionRate} (-₺{ord.commissionAmount.toFixed(2)})
                      </td>
                      <td className="py-3 px-3 text-right font-black text-emerald-700 whitespace-nowrap">
                        ₺{ord.netAmount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteOrder(ord.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all cursor-pointer"
                          title="Siparişi Sil"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* TABLO: HAKEDİŞ TAHSİLAT GEÇMİŞİ */}
        {activeTab === 'payouts' && (
          <div className="overflow-x-auto custom-scrollbar">
            {filteredPayouts.length === 0 ? (
              <div className="py-12 text-center text-slate-500 text-xs font-medium">
                Henüz kaydedilmiş hakediş tahsilat kaydı bulunmuyor.
              </div>
            ) : (
              <table className="w-full text-left text-xs text-slate-800">
                <thead className="bg-slate-50 text-slate-700 font-extrabold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-3">Tarih</th>
                    <th className="py-3 px-3">Tahsilat Kodu</th>
                    <th className="py-3 px-3">Platform</th>
                    <th className="py-3 px-3">Aktarılan Hesap</th>
                    <th className="py-3 px-3 text-right">Tahsil Edilen Tutar</th>
                    <th className="py-3 px-3">Açıklama</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80">
                  {filteredPayouts.map((pay) => (
                    <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 font-mono text-slate-600 whitespace-nowrap font-semibold">{pay.date}</td>
                      <td className="py-3 px-3 font-bold font-mono text-emerald-700 whitespace-nowrap">{pay.payoutNo}</td>
                      <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">{pay.platformName}</td>
                      <td className="py-3 px-3 text-slate-800 font-medium whitespace-nowrap flex items-center gap-1.5 mt-1">
                        {pay.destinationAccountType === 'bank' ? <Landmark size={14} className="text-blue-600" /> : <Wallet size={14} className="text-emerald-600" />}
                        <span>{pay.destinationAccountName}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-black text-emerald-700 whitespace-nowrap">
                        ₺{pay.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-slate-600 font-medium max-w-xs truncate">{pay.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* MODAL 1: YENİ ONLİNE SİPARİŞ KAYDI MODALI */}
      {isNewOrderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-0">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex flex-wrap items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-xl border flex items-center justify-center"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--accent-500) 15%, transparent)',
                    borderColor: 'color-mix(in srgb, var(--accent-500) 30%, transparent)',
                    color: 'var(--accent-400)'
                  }}
                >
                  <Plus size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Yeni Online Sipariş / Satış Gir</h3>
                  <p className="text-[11px] text-slate-400">Komisyon düşülerek net alacak bakiyesine eklenir</p>
                </div>
              </div>
              <button
                onClick={() => setIsNewOrderModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveOrder} className="p-5 space-y-4 text-xs">
              {/* Platform Seçimi */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Platform / Pazaryeri Seçin</label>
                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {platforms
                    .filter((p) => p.active)
                    .map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => setOrderPlatformId(p.id)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                          orderPlatformId === p.id
                            ? 'font-bold shadow-md'
                            : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                        }`}
                        style={
                          orderPlatformId === p.id
                            ? {
                                backgroundColor: 'color-mix(in srgb, var(--accent-500) 18%, transparent)',
                                borderColor: 'var(--accent-500)',
                                color: 'var(--accent-300)'
                              }
                            : {}
                        }
                      >
                        <span className="truncate">{p.name}</span>
                        <span
                          className="text-[10px] mt-1 font-semibold"
                          style={{ color: orderPlatformId === p.id ? 'var(--accent-300)' : '#94a3b8' }}
                        >
                          %{p.commissionRate} Komisyon
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              {/* Sipariş Tutarı & Müşteri */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Brüt Fiş / Sipariş Tutarı (₺)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    required
                    value={orderGrossAmount}
                    onChange={(e) => setOrderGrossAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-slate-100 focus:outline-none focus:border-[var(--accent-500)]"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Müşteri / Not</label>
                  <input
                    type="text"
                    placeholder={`Örn: ${activeOrderPlatform.name} Müşterisi`}
                    value={orderCustomerName}
                    onChange={(e) => setOrderCustomerName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-[var(--accent-500)]"
                  />
                </div>
              </div>

              {/* OTOMATİK HESAPLAMA KUTUSU */}
              <div
                className="p-3 border rounded-xl space-y-1.5 text-xs"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--accent-500) 10%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--accent-500) 25%, transparent)'
                }}
              >
                <div className="flex justify-between text-slate-300">
                  <span>Brüt Sipariş Tutarı:</span>
                  <span className="font-bold text-slate-100">₺{numericGross.toFixed(2)}</span>
                </div>
                <div className="flex justify-between" style={{ color: 'var(--accent-300)' }}>
                  <span>• Kesilecek Komisyon (%{orderCommRate}):</span>
                  <span className="font-bold">-₺{orderCommAmount.toFixed(2)}</span>
                </div>
                <div
                  className="flex justify-between text-emerald-400 font-bold border-t pt-1 text-sm"
                  style={{ borderColor: 'color-mix(in srgb, var(--accent-500) 20%, transparent)' }}
                >
                  <span>• Hesaba Geçecek Net Alacak:</span>
                  <span>₺{orderNetAmount.toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Sipariş Notu (İsteğe Bağlı)</label>
                <input
                  type="text"
                  placeholder="Örn: Yemeksepeti Sipariş No #1082"
                  value={orderNote}
                  onChange={(e) => setOrderNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-[var(--accent-500)]"
                />
              </div>

              {/* İsteğe Bağlı Ana Muhasebe Senkronizasyonu */}
              <div className="pt-1 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncToMainAccounting}
                    onChange={(e) => setSyncToMainAccounting(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 cursor-pointer accent-[var(--accent-500)]"
                  />
                  <div>
                    <span className="font-medium text-slate-200 block">Ana Muhasebeye (İşlemler & Faturalar) da Ekle</span>
                    <span className="text-[10px] text-slate-400">İşaretlenmezse sipariş sadece Online Marketler panelinde bağımsız olarak kalır.</span>
                  </div>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewOrderModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-white font-bold cursor-pointer shadow-lg hover:opacity-90 transition-all"
                  style={{
                    backgroundColor: 'var(--accent-600, #0284c7)',
                    boxShadow: '0 4px 14px color-mix(in srgb, var(--accent-500, #0ea5e9) 30%, transparent)'
                  }}
                >
                  Siparişi Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: HAKEDİŞ TAHSİLAT KAYDI MODALI */}
      {isPayoutModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-0">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Landmark size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-100">Hakediş Tahsilatı Kaydet</h3>
                  <p className="text-[11px] text-slate-400">Pazaryerinden gelen ödemeyi Banka veya Kasa hesabına aktarır</p>
                </div>
              </div>
              <button
                onClick={() => setIsPayoutModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSavePayout} className="p-5 space-y-4 text-xs">
              {/* Platform Selection */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Platform</label>
                <select
                  value={payoutPlatformId}
                  onChange={(e) => {
                    setPayoutPlatformId(e.target.value);
                    const platSummary = platformSummaries.find((s) => s.platform.id === e.target.value);
                    if (platSummary && platSummary.pendingBalance > 0) {
                      setPayoutAmount(platSummary.pendingBalance);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-[var(--accent-500)] cursor-pointer font-bold"
                >
                  {platforms.map((p) => {
                    const pSummary = platformSummaries.find((s) => s.platform.id === p.id);
                    const pending = pSummary ? pSummary.pendingBalance : 0;
                    return (
                      <option key={p.id} value={p.id}>
                        {p.name} (Bekleyen Net Alacak: ₺{pending.toFixed(2)})
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Tahsil Edilen Tutar */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tahsil Edilen / Ödenen Tutar (₺)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  required
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm font-bold text-slate-100 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* Destination Account Type */}
              <div>
                <label className="block text-slate-300 font-semibold mb-1.5">Paranın Geçtiği Hesap Türü</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPayoutDestinationType('bank')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      payoutDestinationType === 'bank'
                        ? 'bg-blue-500/20 border-blue-500 text-blue-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Landmark size={16} />
                    <span>Banka Hesabı</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPayoutDestinationType('cash')}
                    className={`p-2.5 rounded-xl border text-center font-bold transition-all cursor-pointer flex items-center justify-center gap-2 ${
                      payoutDestinationType === 'cash'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <Wallet size={16} />
                    <span>Nakit / Kasa</span>
                  </button>
                </div>
              </div>

              {/* Bank Account Selection (if bank) */}
              {payoutDestinationType === 'bank' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Banka Hesabı Seçin</label>
                  {safeBankAccounts.length === 0 ? (
                    <p className="text-amber-400 text-[11px]">Sistemde henüz kayıtlı banka hesabı yok. Kasa seçeneğini kullanabilirsiniz.</p>
                  ) : (
                    <select
                      value={payoutBankAccountId}
                      onChange={(e) => setPayoutBankAccountId(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-blue-500/50 cursor-pointer"
                    >
                      {safeBankAccounts.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.bankName} - {b.accountName} (Bakiye: ₺{(b.balance || 0).toFixed(2)})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Açıklama / Dekont Notu</label>
                <input
                  type="text"
                  placeholder="Örn: Trendyol 28. Hafta Hakediş Ödemesi"
                  value={payoutNote}
                  onChange={(e) => setPayoutNote(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500/50"
                />
              </div>

              {/* İsteğe Bağlı Ana Muhasebe Senkronizasyonu */}
              <div className="pt-1 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
                <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncToMainAccounting}
                    onChange={(e) => setSyncToMainAccounting(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
                  />
                  <div>
                    <span className="font-medium text-slate-200 block">Ana Muhasebeye (Kasa / Banka Hareketleri) de İşle</span>
                    <span className="text-[10px] text-slate-400">İşaretlenmezse hakediş tahsilatı sadece Online Marketler panelinde kalır.</span>
                  </div>
                </label>
              </div>

              {/* Modal Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPayoutModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold cursor-pointer shadow-lg shadow-emerald-600/20"
                >
                  Tahsilatı Kaydet
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PLATFORM AYARLARI MODALI */}
      <PosPlatformSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        platforms={platforms}
        onSavePlatforms={(updated) => setPlatforms(updated)}
      />
    </div>
  );
};
