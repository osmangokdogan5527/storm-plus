import React, { useState, useMemo, useEffect } from 'react';
import { getBusinessDateStr } from '../utils/DateUtils';
import {
  Calendar,
  CalendarDays,
  TrendingUp,
  DollarSign,
  CreditCard,
  Wallet,
  Store,
  ArrowUpRight,
  Printer,
  Download,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  PieChart,
  ShoppingBag,
  Percent,
  CheckCircle2,
  Receipt,
  Building2,
  Users
} from 'lucide-react';
import { Transaction, Stock, Cari, BankAccount } from '../types';
import { reportErrorToTelegram } from '../utils/telegramLogger';
import { getActiveWorkspace } from '../firebase';

interface GunlukSatisRaporuViewProps {
  islemler: Transaction[];
  stoklar: Stock[];
  cariler: Cari[];
  bankAccounts: BankAccount[];
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

interface ChannelData {
  id: string;
  name: string;
  category: 'cash' | 'pos' | 'bank' | 'veresiye' | 'platform';
  icon: React.ReactNode;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  orderCount: number;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  avgCommissionRate: number;
  sharePercent: number;
}

interface OnlineOrderItem {
  id: string;
  orderNo: string;
  platformId: string;
  platformName: string;
  date: string;
  time?: string;
  customerName?: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  items?: any[];
  note?: string;
  status?: string;
}

export const GunlukSatisRaporuView: React.FC<GunlukSatisRaporuViewProps> = ({
  islemler = [],
  stoklar = [],
  cariler = [],
  bankAccounts = [],
  showToast,
}) => {
  // Bugünün YYYY-MM-DD tarihi
  const todayStr = useMemo(() => getBusinessDateStr(), []);

  // Tarih Filtresi State'leri
  const [datePreset, setDatePreset] = useState<'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom'>('today');
  const [startDate, setStartDate] = useState<string>(todayStr);
  const [endDate, setEndDate] = useState<string>(todayStr);

  // Kanal Arama / Filtreleme
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedSaleId, setExpandedSaleId] = useState<string | null>(null);

  // Online Market Siparişleri State
  const [onlineOrders, setOnlineOrders] = useState<OnlineOrderItem[]>([]);

  // Online Market Siparişlerini Yükleme
  const loadOnlineOrders = () => {
    try {
      const ws = getActiveWorkspace();
      const orderKey = `storm_online_market_orders_${ws}`;
      const raw = localStorage.getItem(orderKey) || (ws === 'storm_muhasebe' ? localStorage.getItem('storm_online_market_orders') : null);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          setOnlineOrders(parsed);
        } else {
          setOnlineOrders([]);
        }
      } else {
        setOnlineOrders([]);
      }
    } catch (err: any) {
      reportErrorToTelegram(err, 'GunlukSatisRaporuView:loadOnlineOrders');
      setOnlineOrders([]);
    }
  };

  useEffect(() => {
    loadOnlineOrders();
    window.addEventListener('storm_online_orders_updated', loadOnlineOrders);
    window.addEventListener('storage', loadOnlineOrders);
    return () => {
      window.removeEventListener('storm_online_orders_updated', loadOnlineOrders);
      window.removeEventListener('storage', loadOnlineOrders);
    };
  }, []);

  // Preset Değiştiğinde Tarihleri Güncelleme
  const handlePresetChange = (preset: 'today' | 'yesterday' | 'this_week' | 'this_month' | 'custom') => {
    setDatePreset(preset);
    const now = new Date(new Date().getTime() - 1 * 60 * 60 * 1000);

    if (preset === 'today') {
      const d = now.toISOString().split('T')[0];
      setStartDate(d);
      setEndDate(d);
    } else if (preset === 'yesterday') {
      const y = new Date(now);
      y.setDate(now.getDate() - 1);
      const d = y.toISOString().split('T')[0];
      setStartDate(d);
      setEndDate(d);
    } else if (preset === 'this_week') {
      const dayOfWeek = now.getDay() === 0 ? 7 : now.getDay();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - (dayOfWeek - 1));
      setStartDate(startOfWeek.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    } else if (preset === 'this_month') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      setStartDate(startOfMonth.toISOString().split('T')[0]);
      setEndDate(now.toISOString().split('T')[0]);
    }
  };

  // Seçili Tarih Aralığı Filtreleme Logic
  const filteredSalesData = useMemo(() => {
    try {
      const safeIslemler = Array.isArray(islemler) ? islemler : [];
      const safeOnlineOrders = Array.isArray(onlineOrders) ? onlineOrders : [];

      // Sadece 'sale' tipindeki satış işlemlerini filtrele
      const dateFilteredIslemler = safeIslemler.filter((islem) => {
        if (!islem || islem.type !== 'sale') return false;
        const islemDate = islem.date ? islem.date.split('T')[0] : '';
        if (startDate && islemDate < startDate) return false;
        if (endDate && islemDate > endDate) return false;
        return true;
      });

      // Seçili tarihteki online market siparişlerini filtrele
      const dateFilteredOnlineOrders = safeOnlineOrders.filter((ord) => {
        if (!ord) return false;
        const ordDate = ord.date ? ord.date.split('T')[0] : '';
        if (startDate && ordDate < startDate) return false;
        if (endDate && ordDate > endDate) return false;
        return true;
      });

      // Platform satış sipariş fiş numaralarını topla (çifte sayımı önlemek için)
      const platformReceiptNos = new Set<string>();
      dateFilteredOnlineOrders.forEach((ord) => {
        if (ord.orderNo) platformReceiptNos.add(ord.orderNo);
      });

      // Kanallara göre gruplama verilerini hazırla
      const channelsMap: Record<string, ChannelData> = {
        cash: {
          id: 'cash',
          name: 'Nakit Satışlar',
          category: 'cash',
          icon: <DollarSign size={18} className="text-emerald-400" />,
          badgeBg: 'bg-emerald-950/80',
          badgeText: 'text-emerald-300',
          badgeBorder: 'border-emerald-500/30',
          orderCount: 0,
          grossAmount: 0,
          commissionAmount: 0,
          netAmount: 0,
          avgCommissionRate: 0,
          sharePercent: 0,
        },
        pos: {
          id: 'pos',
          name: 'POS / Kredi Kartı (Banka)',
          category: 'pos',
          icon: <CreditCard size={18} className="text-blue-400" />,
          badgeBg: 'bg-blue-950/80',
          badgeText: 'text-blue-300',
          badgeBorder: 'border-blue-500/30',
          orderCount: 0,
          grossAmount: 0,
          commissionAmount: 0,
          netAmount: 0,
          avgCommissionRate: 0,
          sharePercent: 0,
        },
        bank: {
          id: 'bank',
          name: 'Banka Havale / EFT',
          category: 'bank',
          icon: <Building2 size={18} className="text-cyan-400" />,
          badgeBg: 'bg-cyan-950/80',
          badgeText: 'text-cyan-300',
          badgeBorder: 'border-cyan-500/30',
          orderCount: 0,
          grossAmount: 0,
          commissionAmount: 0,
          netAmount: 0,
          avgCommissionRate: 0,
          sharePercent: 0,
        },
        yemeksepeti: {
          id: 'yemeksepeti',
          name: 'Yemeksepeti',
          category: 'platform',
          icon: <Store size={18} className="text-rose-400" />,
          badgeBg: 'bg-rose-950/80',
          badgeText: 'text-rose-300',
          badgeBorder: 'border-rose-500/30',
          orderCount: 0,
          grossAmount: 0,
          commissionAmount: 0,
          netAmount: 0,
          avgCommissionRate: 38,
          sharePercent: 0,
        },
        getir: {
          id: 'getir',
          name: 'Getir',
          category: 'platform',
          icon: <ShoppingBag size={18} className="text-purple-400" />,
          badgeBg: 'bg-purple-950/80',
          badgeText: 'text-purple-300',
          badgeBorder: 'border-purple-500/30',
          orderCount: 0,
          grossAmount: 0,
          commissionAmount: 0,
          netAmount: 0,
          avgCommissionRate: 38,
          sharePercent: 0,
        },
        uber_trendyol: {
          id: 'uber_trendyol',
          name: 'Uber Trendyol',
          category: 'platform',
          icon: <TrendingUp size={18} className="text-orange-400" />,
          badgeBg: 'bg-orange-950/80',
          badgeText: 'text-orange-300',
          badgeBorder: 'border-orange-500/30',
          orderCount: 0,
          grossAmount: 0,
          commissionAmount: 0,
          netAmount: 0,
          avgCommissionRate: 38,
          sharePercent: 0,
        },
        migros: {
          id: 'migros',
          name: 'Migros Yemek',
          category: 'platform',
          icon: <Store size={18} className="text-amber-400" />,
          badgeBg: 'bg-amber-950/80',
          badgeText: 'text-amber-300',
          badgeBorder: 'border-amber-500/30',
          orderCount: 0,
          grossAmount: 0,
          commissionAmount: 0,
          netAmount: 0,
          avgCommissionRate: 38,
          sharePercent: 0,
        },
        other_platform: {
          id: 'other_platform',
          name: 'Diğer Online Platformlar',
          category: 'platform',
          icon: <Store size={18} className="text-indigo-400" />,
          badgeBg: 'bg-indigo-950/80',
          badgeText: 'text-indigo-300',
          badgeBorder: 'border-indigo-500/30',
          orderCount: 0,
          grossAmount: 0,
          commissionAmount: 0,
          netAmount: 0,
          avgCommissionRate: 38,
          sharePercent: 0,
        },
        veresiye: {
          id: 'veresiye',
          name: 'Veresiye / Açık Hesap Satış',
          category: 'veresiye',
          icon: <Users size={18} className="text-slate-400" />,
          badgeBg: 'bg-slate-900',
          badgeText: 'text-slate-300',
          badgeBorder: 'border-slate-700',
          orderCount: 0,
          grossAmount: 0,
          commissionAmount: 0,
          netAmount: 0,
          avgCommissionRate: 0,
          sharePercent: 0,
        },
      };

      // 1. İşlemler Tablosundaki Satışların İşlenmesi
      dateFilteredIslemler.forEach((islem) => {
        const invNo = islem.invoiceNo || '';
        const cariNameLower = (islem.cariName || '').toLowerCase();
        const descLower = (islem.description || '').toLowerCase();
        const cariId = islem.cariId || '';

        // Eğer bu işlem bir online market siparişiyse (platform kaydı), OnlineOrders listesinde zaten detaylı komisyonlu hali var demektir
        const isPlatform =
          cariId.startsWith('plat_cari_') ||
          platformReceiptNos.has(invNo) ||
          cariNameLower.includes('yemeksepeti') ||
          cariNameLower.includes('getir') ||
          cariNameLower.includes('trendyol') ||
          cariNameLower.includes('uber') ||
          cariNameLower.includes('migros') ||
          descLower.includes('online satış') ||
          descLower.includes('sipariş');

        if (isPlatform) {
          // Eğer OnlineOrders içinde henüz kaydı yoksa işlemin kendisini platform kanallarına ekle
          if (!platformReceiptNos.has(invNo)) {
            let chKey = 'other_platform';
            if (cariNameLower.includes('yemeksepeti') || descLower.includes('yemeksepeti')) chKey = 'yemeksepeti';
            else if (cariNameLower.includes('getir') || descLower.includes('getir')) chKey = 'getir';
            else if (cariNameLower.includes('trendyol') || cariNameLower.includes('uber') || descLower.includes('trendyol') || descLower.includes('uber')) chKey = 'uber_trendyol';
            else if (cariNameLower.includes('migros') || descLower.includes('migros')) chKey = 'migros';

            const gross = Number(islem.amount) || 0;
            // Varsayılan %38 komisyon
            const comm = (gross * 38) / 100;
            const net = gross - comm;

            channelsMap[chKey].orderCount += 1;
            channelsMap[chKey].grossAmount += gross;
            channelsMap[chKey].commissionAmount += comm;
            channelsMap[chKey].netAmount += net;
          }
        } else {
          // Standart İşletme İçi Satışlar (Nakit, POS, Banka, Veresiye)
          const gross = Number(islem.amount) || 0;
          if (islem.account === 'cash') {
            channelsMap.cash.orderCount += 1;
            channelsMap.cash.grossAmount += gross;
            channelsMap.cash.netAmount += gross;
          } else if (islem.account === 'pos' && !(islem.cariId && islem.cariId.startsWith('plat_cari_'))) {
            channelsMap.pos.orderCount += 1;
            channelsMap.pos.grossAmount += gross;
            channelsMap.pos.netAmount += gross;
          } else if (islem.account === 'bank') {
            channelsMap.bank.orderCount += 1;
            channelsMap.bank.grossAmount += gross;
            channelsMap.bank.netAmount += gross;
          } else {
            // Veresiye / Açık hesap
            channelsMap.veresiye.orderCount += 1;
            channelsMap.veresiye.grossAmount += gross;
            channelsMap.veresiye.netAmount += gross;
          }
        }
      });

      // 2. Online Market Siparişlerinin İşlenmesi (Detaylı Komisyon Hesabı)
      dateFilteredOnlineOrders.forEach((ord) => {
        let chKey = 'other_platform';
        const pId = (ord.platformId || '').toLowerCase();
        const pName = (ord.platformName || '').toLowerCase();

        if (pId.includes('yemeksepeti') || pName.includes('yemeksepeti')) chKey = 'yemeksepeti';
        else if (pId.includes('getir') || pName.includes('getir')) chKey = 'getir';
        else if (pId.includes('uber') || pId.includes('trendyol') || pName.includes('uber') || pName.includes('trendyol')) chKey = 'uber_trendyol';
        else if (pId.includes('migros') || pName.includes('migros')) chKey = 'migros';

        const gross = Number(ord.grossAmount) || 0;
        const comm = Number(ord.commissionAmount) || (gross * (ord.commissionRate || 38)) / 100;
        const net = Number(ord.netAmount) || (gross - comm);

        channelsMap[chKey].orderCount += 1;
        channelsMap[chKey].grossAmount += gross;
        channelsMap[chKey].commissionAmount += comm;
        channelsMap[chKey].netAmount += net;
      });

      // Toplamlar Hesaplaması
      let totalGross = 0;
      let totalCommission = 0;
      let totalNet = 0;
      let totalOrders = 0;

      Object.values(channelsMap).forEach((ch) => {
        totalGross += ch.grossAmount;
        totalCommission += ch.commissionAmount;
        totalNet += ch.netAmount;
        totalOrders += ch.orderCount;
      });

      // Ciro Yüzdesi Paylarını Hesapla
      const channelsList = Object.values(channelsMap).map((ch) => {
        const share = totalGross > 0 ? (ch.grossAmount / totalGross) * 100 : 0;
        const avgComm = ch.grossAmount > 0 ? (ch.commissionAmount / ch.grossAmount) * 100 : ch.avgCommissionRate;
        return {
          ...ch,
          sharePercent: Number(share.toFixed(1)),
          avgCommissionRate: Number(avgComm.toFixed(1)),
        };
      });

      // Sıralama: En çok satış yapılan kanallar üstte
      channelsList.sort((a, b) => b.grossAmount - a.grossAmount);

      // En popüler satış kanalı
      const topChannel = channelsList.find((c) => c.grossAmount > 0) || null;

      // Tüm detaylı satış listesini tek bir harekette birleştirme
      const allDetailedSales: Array<{
        id: string;
        receiptNo: string;
        date: string;
        time: string;
        customerName: string;
        channelName: string;
        channelKey: string;
        grossAmount: number;
        commissionRate: number;
        commissionAmount: number;
        netAmount: number;
        itemsCount: number;
        itemsList: any[];
      }> = [];

      // Online siparişleri ekle
      dateFilteredOnlineOrders.forEach((ord) => {
        allDetailedSales.push({
          id: ord.id,
          receiptNo: ord.orderNo || 'SİP-' + ord.id.slice(-6),
          date: ord.date,
          time: ord.time || '12:00',
          customerName: ord.customerName || `${ord.platformName} Müşterisi`,
          channelName: ord.platformName || 'Online Sipariş',
          channelKey: ord.platformId || 'platform',
          grossAmount: Number(ord.grossAmount) || 0,
          commissionRate: ord.commissionRate || 38,
          commissionAmount: Number(ord.commissionAmount) || 0,
          netAmount: Number(ord.netAmount) || 0,
          itemsCount: ord.items ? ord.items.length : 1,
          itemsList: ord.items || [],
        });
      });

      // İşlemler tablosundaki doğrudan satışları ekle (online sipariş numarası olmayanları)
      dateFilteredIslemler.forEach((islem) => {
        const invNo = islem.invoiceNo || '';
        if (!platformReceiptNos.has(invNo)) {
          let chName = 'Nakit Satış';
          let chKey = 'cash';
          if (islem.cariId?.startsWith('plat_cari_')) {
            chName = islem.cariName || 'Online Satış';
            chKey = 'platform';
          } else if (islem.account === 'pos') {
            chName = 'POS / Kredi Kartı';
            chKey = 'pos';
          } else if (islem.account === 'bank') {
            chName = 'Banka Havale';
            chKey = 'bank';
          } else if (!islem.account) {
            chName = 'Veresiye / Açık Hesap';
            chKey = 'veresiye';
          }

          const gross = Number(islem.amount) || 0;
          const comm = islem.cariId?.startsWith('plat_cari_') ? (gross * 38) / 100 : 0;
          const net = gross - comm;

          allDetailedSales.push({
            id: islem.id,
            receiptNo: islem.invoiceNo || 'FİŞ-' + islem.id.slice(-6),
            date: islem.date ? islem.date.split('T')[0] : todayStr,
            time: '12:00',
            customerName: islem.cariName || 'Perakende Müşteri',
            channelName: chName,
            channelKey: chKey,
            grossAmount: gross,
            commissionRate: comm > 0 ? 38 : 0,
            commissionAmount: comm,
            netAmount: net,
            itemsCount: islem.items ? islem.items.length : 1,
            itemsList: islem.items || [],
          });
        }
      });

      // Tarih ve Saate Göre Sırala (Son eklenenler üstte)
      allDetailedSales.sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return b.time.localeCompare(a.time);
      });

      return {
        totalGross,
        totalCommission,
        totalNet,
        totalOrders,
        overallCommissionRate: totalGross > 0 ? (totalCommission / totalGross) * 100 : 0,
        channelsList,
        topChannel,
        allDetailedSales,
      };
    } catch (err: any) {
      reportErrorToTelegram(err, 'GunlukSatisRaporuView:filteredSalesData');
      return {
        totalGross: 0,
        totalCommission: 0,
        totalNet: 0,
        totalOrders: 0,
        overallCommissionRate: 0,
        channelsList: [],
        topChannel: null,
        allDetailedSales: [],
      };
    }
  }, [islemler, onlineOrders, startDate, endDate, todayStr]);

  // Arama ve Kanal Filtresiyle Süzülmüş Detay Satış Listesi
  const filteredSalesList = useMemo(() => {
    try {
      return filteredSalesData.allDetailedSales.filter((sale) => {
        // Kanal Filtresi
        if (selectedChannelFilter !== 'all') {
          const keyLower = sale.channelKey.toLowerCase();
          const nameLower = sale.channelName.toLowerCase();

          if (selectedChannelFilter === 'cash' && sale.channelKey !== 'cash') return false;
          if (selectedChannelFilter === 'pos' && sale.channelKey !== 'pos') return false;
          if (selectedChannelFilter === 'bank' && sale.channelKey !== 'bank') return false;
          if (selectedChannelFilter === 'veresiye' && sale.channelKey !== 'veresiye') return false;
          if (selectedChannelFilter === 'yemeksepeti' && !nameLower.includes('yemeksepeti')) return false;
          if (selectedChannelFilter === 'getir' && !nameLower.includes('getir')) return false;
          if (selectedChannelFilter === 'uber_trendyol' && !nameLower.includes('trendyol') && !nameLower.includes('uber')) return false;
          if (selectedChannelFilter === 'migros' && !nameLower.includes('migros')) return false;
        }

        // Metin Araması
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchNo = sale.receiptNo.toLowerCase().includes(q);
          const matchCust = sale.customerName.toLowerCase().includes(q);
          const matchChannel = sale.channelName.toLowerCase().includes(q);
          if (!matchNo && !matchCust && !matchChannel) return false;
        }

        return true;
      });
    } catch (err: any) {
      reportErrorToTelegram(err, 'GunlukSatisRaporuView:filteredSalesList');
      return [];
    }
  }, [filteredSalesData.allDetailedSales, selectedChannelFilter, searchQuery]);

  // EXCEL / CSV İNDİRME FONKSİYONU
  const handleExportExcel = () => {
    try {
      let csvContent = '\uFEFF'; // UTF-8 BOM
      csvContent += 'GÜNLÜK SATIŞ VE KANAL RAPORU\n';
      csvContent += `Tarih Aralığı: ${startDate} - ${endDate}\n\n`;

      csvContent += 'ÖDEME VE SATIŞ KANALLARI BAZINDA KIRILIM\n';
      csvContent += 'Kanal / Kalem;İşlem Adedi;Brüt Satış (TL);Ort. Komisyon (%);Komisyon / Kesinti (TL);Net Satış (TL);Cirodaki Payı (%)\n';

      filteredSalesData.channelsList.forEach((ch) => {
        csvContent += `"${ch.name}";${ch.orderCount};"${ch.grossAmount.toFixed(2)}";"%${ch.avgCommissionRate.toFixed(1)}";"${ch.commissionAmount.toFixed(2)}";"${ch.netAmount.toFixed(2)}";"%${ch.sharePercent.toFixed(1)}"\n`;
      });

      csvContent += `\nTOPLAM;${filteredSalesData.totalOrders};"${filteredSalesData.totalGross.toFixed(2)}";"%${filteredSalesData.overallCommissionRate.toFixed(1)}";"${filteredSalesData.totalCommission.toFixed(2)}";"${filteredSalesData.totalNet.toFixed(2)}";"100%"\n\n`;

      csvContent += 'DETAYLI SATIŞ SİPARİŞ HAREKETLERİ\n';
      csvContent += 'Fiş / Sipariş No;Tarih;Saat;Müşteri / Cari;Satış Kanalı;Brüt Tutar (TL);Komisyon Rate (%);Komisyon (TL);Net Tutar (TL)\n';

      filteredSalesList.forEach((sale) => {
        csvContent += `"${sale.receiptNo}";"${sale.date}";"${sale.time}";"${sale.customerName}";"${sale.channelName}";"${sale.grossAmount.toFixed(2)}";"%${sale.commissionRate}";"${sale.commissionAmount.toFixed(2)}";"${sale.netAmount.toFixed(2)}"\n`;
      });

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `Gunluk_Satis_Raporu_${startDate}_${endDate}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Günlük satış raporu Excel/CSV olarak indirildi.', 'success');
    } catch (err: any) {
      reportErrorToTelegram(err, 'GunlukSatisRaporuView:handleExportExcel');
      showToast('Rapor dışa aktarılırken hata oluştu.', 'error');
    }
  };

  // YAZDIRMA FONKSİYONU
  const handlePrint = () => {
    try {
      window.print();
    } catch (err: any) {
      reportErrorToTelegram(err, 'GunlukSatisRaporuView:handlePrint');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* ÜST BAŞLIK & FİLTRE BAR BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/20">
              <CalendarDays size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  Günlük Satış Raporu
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 border border-amber-500/40 text-amber-300">
                  Canlı Kanal Kırılımı
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Nakit, POS, Uber Trendyol, Yemeksepeti, Getir, Migros Yemek ve tüm kanalların brüt ve net satış analizi
              </p>
            </div>
          </div>

          {/* AKSIYON BUTONLARI */}
          <div className="flex items-center gap-2 self-end md:self-auto print:hidden">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center gap-2 border border-slate-700 cursor-pointer active:scale-95 transition-all shadow-sm"
              title="Excel (CSV) Olarak İndir"
            >
              <Download size={15} className="text-emerald-400" />
              <span>Excel İndir</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs flex items-center gap-2 cursor-pointer active:scale-95 transition-all shadow-md shadow-amber-600/20"
              title="Raporu Yazdır"
            >
              <Printer size={15} />
              <span>Yazdır / PDF</span>
            </button>
          </div>
        </div>

        {/* TARİH SEÇİM PRESETLERİ VE TARİH ARALIĞI */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-center">
          {/* Hızlı Tarih Düğmeleri */}
          <div className="lg:col-span-7 flex flex-wrap items-center gap-1.5">
            {[
              { id: 'today', label: 'Bugün' },
              { id: 'yesterday', label: 'Dün' },
              { id: 'this_week', label: 'Bu Hafta' },
              { id: 'this_month', label: 'Bu Ay' },
              { id: 'custom', label: 'Özel Tarih Aralığı' },
            ].map((p) => {
              const isActive = datePreset === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handlePresetChange(p.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border active:scale-95 ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20 font-black'
                      : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              );
            })}
          </div>

          {/* Tarih Input Seçicileri */}
          <div className="lg:col-span-5 flex items-center gap-2">
            <div className="flex-1 flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
              <Calendar size={14} className="text-amber-400 shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="bg-transparent text-white font-bold text-xs focus:outline-none w-full"
              />
            </div>
            <span className="text-slate-500 font-bold text-xs">-</span>
            <div className="flex-1 flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
              <Calendar size={14} className="text-emerald-400 shrink-0" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setDatePreset('custom');
                }}
                className="bg-transparent text-white font-bold text-xs focus:outline-none w-full"
              />
            </div>
            <button
              type="button"
              onClick={loadOnlineOrders}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer active:scale-95 transition-all shrink-0"
              title="Yenile"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* ÜST ÖZET PERFORMANS KARTLARI (KPI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Toplam Brüt Satış */}
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-emerald-500/10 rounded-full blur-xl group-hover:scale-125 transition-all"></div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Toplam Brüt Satış
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <DollarSign size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            ₺{filteredSalesData.totalGross.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span>Toplam İşlem Adedi:</span>
            <strong className="text-emerald-400 font-black">{filteredSalesData.totalOrders} İşlem</strong>
          </div>
        </div>

        {/* 2. Toplam Komisyon / Kesinti */}
        <div className="bg-slate-900 border border-rose-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-rose-500/10 rounded-full blur-xl group-hover:scale-125 transition-all"></div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Platform Komisyonu / Kesinti
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-400 flex items-center justify-center border border-rose-500/20">
              <Percent size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-400 tracking-tight">
            -₺{filteredSalesData.totalCommission.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span>Ortalama Kesinti Oranı:</span>
            <strong className="text-rose-300 font-black">%{filteredSalesData.overallCommissionRate.toFixed(1)}</strong>
          </div>
        </div>

        {/* 3. Net Ciro */}
        <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/10 rounded-full blur-xl group-hover:scale-125 transition-all"></div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              İşletmeye Kalan Net Ciro
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center border border-amber-500/30">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 tracking-tight">
            ₺{filteredSalesData.totalNet.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span>Net Kazanç Oranı:</span>
            <strong className="text-amber-300 font-black">
              %{filteredSalesData.totalGross > 0 ? ((filteredSalesData.totalNet / filteredSalesData.totalGross) * 100).toFixed(1) : '100'}
            </strong>
          </div>
        </div>

        {/* 4. En Çok Satış Yapılan Kanal */}
        <div className="bg-slate-900 border border-blue-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden group">
          <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-blue-500/10 rounded-full blur-xl group-hover:scale-125 transition-all"></div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              En Popüler Satış Kanalı
            </span>
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20">
              <PieChart size={20} />
            </div>
          </div>
          <div className="text-xl font-black text-white truncate tracking-tight">
            {filteredSalesData.topChannel ? filteredSalesData.topChannel.name : 'Satış Yok'}
          </div>
          <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
            <span>Payı & Ciro:</span>
            <strong className="text-blue-300 font-black">
              %{filteredSalesData.topChannel?.sharePercent || 0} (₺{(filteredSalesData.topChannel?.grossAmount || 0).toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })})
            </strong>
          </div>
        </div>
      </div>

      {/* SADE VE AÇIK KALEMLER BAZINDA KANAL KIRILIM TABLOSU */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Receipt className="text-amber-400" size={20} />
            <h2 className="text-base sm:text-lg font-black text-white">
              Satış Kanallarına Göre Ayrı Ayrı Kalem Kırılımı
            </h2>
          </div>
          <span className="text-xs font-bold text-slate-400">
            {startDate === endDate ? `${startDate} Tarihli Rapor` : `${startDate} / ${endDate} Tarihleri Arası`}
          </span>
        </div>

        {/* MASAÜSTÜ KALEM KIRILIM TABLOSU */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60 text-slate-400 text-xs uppercase font-extrabold tracking-wider">
                <th className="p-3.5 rounded-l-xl">Satış Kanalı / Kalem</th>
                <th className="p-3.5 text-center">İşlem Adedi</th>
                <th className="p-3.5 text-right">Brüt Satış (₺)</th>
                <th className="p-3.5 text-center">Ort. Komisyon (%)</th>
                <th className="p-3.5 text-right">Kesinti Tutarı (₺)</th>
                <th className="p-3.5 text-right">Net Satış (₺)</th>
                <th className="p-3.5 rounded-r-xl text-right">Ciro Payı (%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {filteredSalesData.channelsList.map((ch) => {
                const hasSales = ch.orderCount > 0 || ch.grossAmount > 0;
                return (
                  <tr
                    key={ch.id}
                    className={`transition-colors hover:bg-slate-800/50 ${
                      hasSales ? 'bg-slate-900/80 font-bold' : 'opacity-40 bg-slate-950/20'
                    }`}
                  >
                    {/* Kanal İsmi ve İkonu */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${ch.badgeBg} ${ch.badgeBorder}`}>
                          {ch.icon}
                        </div>
                        <div>
                          <div className="font-extrabold text-white text-sm">{ch.name}</div>
                          <div className="text-[11px] text-slate-400 font-normal">
                            {ch.category === 'platform' ? 'Online Sipariş Entegrasyonu' : 'İşletme İçi Ödeme Kanalı'}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* İşlem Sayısı */}
                    <td className="p-3.5 text-center font-extrabold text-white">
                      <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs">
                        {ch.orderCount} Adet
                      </span>
                    </td>

                    {/* Brüt Tutar */}
                    <td className="p-3.5 text-right font-black text-emerald-400 text-base">
                      ₺{ch.grossAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Komisyon Oranı */}
                    <td className="p-3.5 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                        ch.avgCommissionRate > 0 ? 'bg-rose-950/80 text-rose-300 border border-rose-500/30' : 'bg-slate-800 text-slate-400'
                      }`}>
                        %{ch.avgCommissionRate.toFixed(1)}
                      </span>
                    </td>

                    {/* Kesinti Tutarı */}
                    <td className="p-3.5 text-right font-extrabold text-rose-400">
                      {ch.commissionAmount > 0 ? `-₺${ch.commissionAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '₺0,00'}
                    </td>

                    {/* Net Tutar */}
                    <td className="p-3.5 text-right font-black text-amber-300 text-base">
                      ₺{ch.netAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>

                    {/* Ciro Payı & Görsel Yüzde Barı */}
                    <td className="p-3.5 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <span className="font-extrabold text-white text-xs">%{ch.sharePercent.toFixed(1)}</span>
                        <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full"
                            style={{ width: `${Math.min(100, ch.sharePercent)}%` }}
                          ></div>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* TABLO TOPLAM SATIRI */}
            <tfoot>
              <tr className="border-t-2 border-slate-700 bg-slate-950 font-black text-white text-base">
                <td className="p-4 rounded-l-xl">GENEL TOPLAM</td>
                <td className="p-4 text-center text-amber-400">{filteredSalesData.totalOrders} Adet</td>
                <td className="p-4 text-right text-emerald-400 text-lg">
                  ₺{filteredSalesData.totalGross.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="p-4 text-center text-rose-300 text-xs">
                  %{filteredSalesData.overallCommissionRate.toFixed(1)} Ortalama
                </td>
                <td className="p-4 text-right text-rose-400">
                  -₺{filteredSalesData.totalCommission.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="p-4 text-right text-amber-300 text-lg">
                  ₺{filteredSalesData.totalNet.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="p-4 text-right rounded-r-xl text-amber-400">%100,0</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};
