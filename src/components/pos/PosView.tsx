import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Stock, Cari, BankAccount, Transaction } from '../../types';
import { PosCartItem, PosPaymentSplit, PosParkedSale, PosSaleSummary, PosPlatformConfig, DEFAULT_POS_PLATFORMS, PosTable, DEFAULT_RESTAURANT_TABLES } from '../../types/pos';
import { PosProductCatalog } from './PosProductCatalog';
import { PosCartTable } from './PosCartTable';
import { PosSplitPaymentModal } from './PosSplitPaymentModal';
import { PosReceiptModal } from './PosReceiptModal';
import { PosNumpadModal } from './PosNumpadModal';
import { PosParkedSalesModal } from './PosParkedSalesModal';
import { PosPlatformSettingsModal } from './PosPlatformSettingsModal';
import { PosDirectPlatformSaleModal } from './PosDirectPlatformSaleModal';
import { PosTableManagementModal } from './PosTableManagementModal';
import { PosTableAdisyonModal } from './PosTableAdisyonModal';
import { findStockByBarcodeOrSearch, calculateLineTotal, calculateCartSummary, generateReceiptNo } from '../../utils/posUtils';
import { ShoppingCart, Zap, DollarSign, CreditCard, User, Clock, CheckCircle2, RotateCcw, Search, Plus, Sparkles, HelpCircle, Percent, Settings, ShoppingBag, Utensils, Receipt, ArrowLeftRight } from 'lucide-react';
import { reportErrorToTelegram } from '../../utils/telegramLogger';

interface PosViewProps {
  stocks: Stock[];
  cariler: Cari[];
  bankAccounts: BankAccount[];
  onCompletePosSale: (saleData: {
    receiptNo: string;
    cariId?: string;
    cariName: string;
    items: PosCartItem[];
    paymentSplit: PosPaymentSplit;
    grandTotal: number;
    subtotal: number;
    totalTax: number;
    totalDiscount: number;
    date: string;
  }) => Promise<boolean>;
}

export const PosView: React.FC<PosViewProps> = ({
  stocks = [],
  cariler = [],
  bankAccounts = [],
  onCompletePosSale,
}) => {
  const safeStocks = Array.isArray(stocks) ? stocks : [];
  const safeCariler = Array.isArray(cariler) ? cariler : [];
  const safeBankAccounts = Array.isArray(bankAccounts) ? bankAccounts : [];
  // SEPET & MÜŞTERİ STATE'LERİ
  const [cartItems, setCartItems] = useState<PosCartItem[]>([]);
  const [selectedCari, setSelectedCari] = useState<Cari | null>(null);
  const [cariSearchTerm, setCariSearchTerm] = useState<string>('');
  const [isCariDropdownOpen, setIsCariDropdownOpen] = useState<boolean>(false);

  // ÜRÜN ARAMA & BARKOD
  const [productSearchTerm, setProductSearchTerm] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // KDV VE İSKONTO STATE'LERİ (VARSAYILAN KDV: %0)
  const [globalTaxRate, setGlobalTaxRate] = useState<number>(0);
  const [discountMode, setDiscountMode] = useState<'percent' | 'amount' | 'target'>('percent');
  const [discountVal, setDiscountVal] = useState<number | string>('');
  const [isDiscountNumpadOpen, setIsDiscountNumpadOpen] = useState(false);

  // PARA BİRİMİ SEÇİMİ (TRY, USD, EUR)
  const [selectedCurrency, setSelectedCurrency] = useState<'TRY'>('TRY');
  
  

  // RESTORAN MASA YÖNETİMİ STATE'LERİ
  const [tables, setTables] = useState<PosTable[]>(() => {
    try {
      const saved = localStorage.getItem('storm_pos_restaurant_tables');
      return saved ? JSON.parse(saved) : DEFAULT_RESTAURANT_TABLES;
    } catch (e) {
      return DEFAULT_RESTAURANT_TABLES;
    }
  });
  const [activeTableId, setActiveTableId] = useState<string | null>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(false);
  const [isAdisyonModalOpen, setIsAdisyonModalOpen] = useState<boolean>(false);
  const [isExitTableConfirmOpen, setIsExitTableConfirmOpen] = useState<boolean>(false);
  const [isClearCartConfirmOpen, setIsClearCartConfirmOpen] = useState<boolean>(false);

  // ASKIDAKİ SATIŞLAR (PARKED SALES)
  const [parkedSales, setParkedSales] = useState<PosParkedSale[]>(() => {
    try {
      const saved = localStorage.getItem('storm_pos_parked_sales');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // RESTORAN MASALARI LOCALSTORAGE KAYIT
  useEffect(() => {
    try {
      localStorage.setItem('storm_pos_restaurant_tables', JSON.stringify(tables));
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosView:saveTables');
    }
  }, [tables]);

  // SİPARİŞ İÇİN MASA SEÇ
  const handleSelectTableForOrder = (table: PosTable) => {
    setActiveTableId(table.id);
    if (table.items && table.items.length > 0) {
      setCartItems([...table.items]);
    } else {
      setCartItems([]);
    }
    if (table.discountVal !== undefined) {
      setDiscountVal(table.discountVal);
    }
    if (table.discountMode) {
      setDiscountMode(table.discountMode);
    }
  };

  // AKTF MASAYA SEPETİ KAYDET
  const handleSaveCartToActiveTable = () => {
    if (!activeTableId) return;
    const targetTable = tables.find((t) => t.id === activeTableId);
    if (!targetTable) return;

    const nowTime = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

    const updatedTables = tables.map((t) => {
      if (t.id === activeTableId) {
        const isNowOccupied = cartItems.length > 0;
        return {
          ...t,
          status: isNowOccupied ? (t.status === 'bill_printed' ? 'bill_printed' : 'occupied') : 'empty',
          items: [...cartItems],
          openedAt: isNowOccupied ? (t.openedAt || nowTime) : undefined,
          discountVal,
          discountMode,
        };
      }
      return t;
    });

    setTables(updatedTables);
    alert(`${targetTable.name} siparişleri başarıyla masaya kaydedildi.`);
  };

  const activeTable = tables.find((t) => t.id === activeTableId) || null;

  // MODAL STATE'LERİ
  const [isSplitModalOpen, setIsSplitModalOpen] = useState<boolean>(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);
  const [isParkedModalOpen, setIsParkedModalOpen] = useState<boolean>(false);
  const [completedSaleSummary, setCompletedSaleSummary] = useState<PosSaleSummary | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // OTOMATİK FİŞ EKRANI AÇMA AYARI (VARSAYILAN: KAPALI)
  const [autoShowReceipt, setAutoShowReceipt] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('storm_pos_auto_show_receipt');
      return saved === 'true'; // Default false: Otomatik fiş ekranı açılmasın
    } catch (e) {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('storm_pos_auto_show_receipt', autoShowReceipt ? 'true' : 'false');
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosView:saveAutoShowReceipt');
    }
  }, [autoShowReceipt]);

  // ONLINE PLATFORMLAR STATE
  const [platforms, setPlatforms] = useState<PosPlatformConfig[]>(() => {
    try {
      const saved = localStorage.getItem('storm_pos_platform_rates');
      const is38Set = localStorage.getItem('storm_pos_platform_38_migrated');
      const loaded: PosPlatformConfig[] = saved ? JSON.parse(saved) : DEFAULT_POS_PLATFORMS;
      let finalPlatforms = loaded
        .filter((p) => p.id !== 'trendyol' && p.key !== 'trendyol')
        .map((p) => (p.name === 'Uber Eats' ? { ...p, name: 'Uber Trendyol' } : p));

      if (!is38Set) {
        finalPlatforms = finalPlatforms.map((p) => ({
          ...p,
          commissionRate: 38,
        }));
        try {
          localStorage.setItem('storm_pos_platform_38_migrated', 'true');
          localStorage.setItem('storm_pos_platform_rates', JSON.stringify(finalPlatforms));
        } catch (e) {
          // ignore storage errors
        }
      }

      return finalPlatforms;
    } catch (e) {
      return DEFAULT_POS_PLATFORMS.map((p) => ({ ...p, commissionRate: 38 }));
    }
  });
  const [isPlatformSettingsOpen, setIsPlatformSettingsOpen] = useState<boolean>(false);
  const [selectedPlatformForSale, setSelectedPlatformForSale] = useState<PosPlatformConfig | null>(null);

  // PARKED SALES LOCALSTORAGE KAYIT
  useEffect(() => {
    try {
      localStorage.setItem('storm_pos_parked_sales', JSON.stringify(parkedSales));
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosView:saveParkedSales');
    }
  }, [parkedSales]);

  // PLATFORM RATES LOCALSTORAGE KAYIT
  useEffect(() => {
    try {
      localStorage.setItem('storm_pos_platform_rates', JSON.stringify(platforms));
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosView:savePlatformRates');
    }
  }, [platforms]);

  // SEPET HESAPLAMASI
  const summary = calculateCartSummary(
    cartItems,
    typeof discountVal === 'number' ? discountVal : Number(discountVal) || 0,
    discountMode,
    globalTaxRate
  );

  // KUR VE DÖVİZLİ TUTAR HESAPLAMASI
  // KUR VE DÖVİZLİ TUTAR HESAPLAMASI
  const currentRate = 1;
  const convertedTotal = summary.grandTotal;
  const currencySymbol = "₺";

  const handleAddToCart = useCallback((stock: Stock) => {
    try {
      setCartItems((prev) => {
        const existingIndex = prev.findIndex((item) => item.stockId === stock.id);
        if (existingIndex > -1) {
          const updated = [...prev];
          const currentItem = updated[existingIndex];
          const newQty = currentItem.quantity + 1;
          const { discountAmount, totalLine } = calculateLineTotal(
            currentItem.unitPrice,
            newQty,
            currentItem.discountRate
          );
          updated[existingIndex] = {
            ...currentItem,
            quantity: newQty,
            discountAmount,
            totalLine,
          };
          return updated;
        } else {
          const unitPrice = stock.salesPrice || 0;
          const { discountAmount, totalLine } = calculateLineTotal(unitPrice, 1, 0);
          const newItem: PosCartItem = {
            id: 'item_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            stockId: stock.id,
            stockCode: stock.code,
            stockName: stock.name,
            unit: stock.unit || 'Adet',
            unitPrice,
            taxRate: (stock.taxRate !== undefined && stock.taxRate !== null) ? stock.taxRate : 0,
            quantity: 1,
            discountRate: 0,
            discountAmount,
            totalLine,
            barcode: stock.barcode,
            imageUrl: stock.imageUrl,
          };
          return [...prev, newItem];
        }
      });
      setProductSearchTerm('');
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosView:handleAddToCart');
    }
  }, []);

  // BARKOD OKUYUCU DİNLEYİCİSİ (Arama kutusuna hızlı yazılan barkodları algılar)
  useEffect(() => {
    let barcodeBuffer = '';
    let lastKeyTime = Date.now();

    const handleKeyDown = (e: KeyboardEvent) => {
      try {
        // Eğer modal açıksa kısayolları engelle
        if (isSplitModalOpen || isReceiptModalOpen || isParkedModalOpen) return;

        // F1: Arama Kutusuna Odaklan
        if (e.key === 'F1') {
          e.preventDefault();
          searchInputRef.current?.focus();
          return;
        }

        // F2: Hızlı Nakit Satış
        if (e.key === 'F2') {
          e.preventDefault();
          handleQuickCashSale();
          return;
        }

        // F3: Hızlı POS Satış
        if (e.key === 'F3') {
          e.preventDefault();
          handleQuickPosSale();
          return;
        }

        // F4: Parçalı Ödeme Modal
        if (e.key === 'F4') {
          e.preventDefault();
          if (cartItems.length > 0) setIsSplitModalOpen(true);
          return;
        }

        // F8: Askıya Al
        if (e.key === 'F8') {
          e.preventDefault();
          handleParkSale();
          return;
        }

        // ESC: Arama / Temizle
        if (e.key === 'Escape') {
          setProductSearchTerm('');
        }
      } catch (err: any) {
        reportErrorToTelegram(err, 'PosView:handleKeyDown');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cartItems, isSplitModalOpen, isReceiptModalOpen, isParkedModalOpen]);

  // ARAMA METNİ DEĞİŞTİĞİNDE TAM EŞLEŞEN BARKOD VARSA SEPETE AT
  useEffect(() => {
    if (!productSearchTerm.trim()) return;

    const matched = findStockByBarcodeOrSearch(safeStocks, productSearchTerm);
    // Yalnızca barkod ile tam birebir eşleşme varsa otomatik sepete ekle
    if (matched && matched.barcode && matched.barcode.toLowerCase() === productSearchTerm.trim().toLowerCase()) {
      handleAddToCart(matched);
      setProductSearchTerm('');
    }
  }, [productSearchTerm, safeStocks, handleAddToCart]);

  // MİKTAR GÜNCELLEME
  const handleUpdateQuantity = (id: string, delta: number) => {
    try {
      setCartItems((prev) =>
        prev
          .map((item) => {
            if (item.id === id) {
              const newQty = Math.max(1, item.quantity + delta);
              const { discountAmount, totalLine } = calculateLineTotal(
                item.unitPrice,
                newQty,
                item.discountRate
              );
              return { ...item, quantity: newQty, discountAmount, totalLine };
            }
            return item;
          })
          .filter((item) => item.quantity > 0)
      );
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosView:handleUpdateQuantity');
    }
  };

  const handleSetQuantity = (id: string, qty: number) => {
    try {
      setCartItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const { discountAmount, totalLine } = calculateLineTotal(
              item.unitPrice,
              qty,
              item.discountRate
            );
            return { ...item, quantity: qty, discountAmount, totalLine };
          }
          return item;
        })
      );
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosView:handleSetQuantity');
    }
  };

  // BİRİM FİYAT GÜNCELLEME (Fiyat Değiştirme)
  const handleUpdateUnitPrice = (id: string, newUnitPrice: number) => {
    try {
      setCartItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const price = Math.max(0, newUnitPrice);
            const { discountAmount, totalLine } = calculateLineTotal(
              price,
              item.quantity,
              item.discountRate
            );
            return { ...item, unitPrice: price, discountAmount, totalLine };
          }
          return item;
        })
      );
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosView:handleUpdateUnitPrice');
    }
  };

  // İSKONTO YÜZDESİ GÜNCELLEME
  const handleUpdateDiscount = (id: string, discountRate: number) => {
    try {
      setCartItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const rate = Math.min(100, Math.max(0, discountRate));
            const { discountAmount, totalLine } = calculateLineTotal(
              item.unitPrice,
              item.quantity,
              rate
            );
            return { ...item, discountRate: rate, discountAmount, totalLine };
          }
          return item;
        })
      );
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosView:handleUpdateDiscount');
    }
  };

  // SATIR SİLME & SEPETİ TEMİZLE
  const handleRemoveItem = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    if (cartItems.length === 0) return;
    setIsClearCartConfirmOpen(true);
  };

  const confirmClearCart = () => {
    setCartItems([]);
    setSelectedCari(null);
    setDiscountVal('');
    setIsClearCartConfirmOpen(false);
  };

  // HIZLI NAKİT SATIŞ (F2)
  const handleQuickCashSale = async () => {
    if (cartItems.length === 0 || isProcessing) return;

    const split: PosPaymentSplit = {
      cashAmount: summary.grandTotal,
      cashReceived: summary.grandTotal,
      changeGiven: 0,
      posAmount: 0,
      openAccountAmount: 0,
    };

    await executeSale(split);
  };

  // HIZLI KREDİ KARTI / POS SATIŞ (F3)
  const handleQuickPosSale = async () => {
    if (cartItems.length === 0 || isProcessing) return;

    const posAccounts = safeBankAccounts.filter((a) => a && (a.type === 'pos' || a.type === 'banka'));

    const split: PosPaymentSplit = {
      cashAmount: 0,
      cashReceived: 0,
      changeGiven: 0,
      posAmount: summary.grandTotal,
      posAccountId: posAccounts.length > 0 ? posAccounts[0].id : '',
      openAccountAmount: 0,
    };

    await executeSale(split);
  };

  // ASKIYA AL (F8)
  const handleParkSale = () => {
    try {
      if (cartItems.length === 0) {
        alert('Askıya almak için sepete en az bir ürün eklemelisiniz.');
        return;
      }

      const newParked: PosParkedSale = {
        id: 'park_' + Date.now(),
        createdAt: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
        customerName: selectedCari ? selectedCari.name : 'Perakende Müşteri',
        cariId: selectedCari?.id,
        items: [...cartItems],
        totalAmount: summary.grandTotal,
      };

      setParkedSales((prev) => [newParked, ...prev]);
      setCartItems([]);
      setSelectedCari(null);
      alert('Satış başarıyla askıya alındı.');
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosView:handleParkSale');
    }
  };

  // ASKIDAKİ SATIŞI GERİ YÜKLE
  const handleRestoreParkedSale = (parked: PosParkedSale) => {
    try {
      setCartItems(parked.items || []);
      if (parked.cariId) {
        const foundCari = safeCariler.find((c) => c && c.id === parked.cariId);
        if (foundCari) setSelectedCari(foundCari);
      } else {
        setSelectedCari(null);
      }
      setParkedSales((prev) => prev.filter((p) => p.id !== parked.id));
      setIsParkedModalOpen(false);
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosView:handleRestoreParkedSale');
    }
  };

  // SATIŞI GERÇEKLEŞTİR
  const executeSale = async (paymentSplit: PosPaymentSplit) => {
    try {
      setIsProcessing(true);
      const receiptNo = generateReceiptNo();
      const now = new Date();
      const date = now.toISOString().slice(0, 10);
      const time = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });

      const defaultPlatCariId = paymentSplit.platformName
        ? `plat_cari_${paymentSplit.platformName.toLowerCase().replace(/[^a-z0-9]/g, '')}`
        : 'perakende_musteri';
      const defaultPlatCariName = paymentSplit.platformName || 'Perakende Müşteri';

      const cariId = selectedCari ? selectedCari.id : defaultPlatCariId;
      const cariName = selectedCari ? selectedCari.name : defaultPlatCariName;

      const success = await onCompletePosSale({
        receiptNo,
        cariId,
        cariName,
        items: cartItems,
        paymentSplit,
        grandTotal: summary.grandTotal,
        subtotal: summary.subtotalAfterLineDiscounts,
        totalTax: summary.totalTax,
        totalDiscount: summary.totalDiscount,
        date,
      });

      if (success) {
        // Fiş Özetini Hazırla ve Fiş Modalını Aç
        const saleSummary: PosSaleSummary = {
          receiptNo,
          date,
          time,
          items: cartItems,
          paymentSplit,
          cariId: selectedCari?.id,
          cariName,
          subtotal: summary.subtotalAfterLineDiscounts,
          totalDiscount: summary.totalDiscount,
          totalTax: summary.totalTax,
          grandTotal: summary.grandTotal,
        };

        setCompletedSaleSummary(saleSummary);
        if (autoShowReceipt) {
          setIsReceiptModalOpen(true);
        }

        // Eğer aktif masa varsa satışı tamamlandığında masayı boşalt
        if (activeTableId) {
          setTables((prev) =>
            prev.map((t) =>
              t.id === activeTableId
                ? {
                    ...t,
                    status: 'empty',
                    items: [],
                    openedAt: undefined,
                    waiterName: undefined,
                    note: undefined,
                    billPrintedAt: undefined,
                  }
                : t
            )
          );
          setActiveTableId(null);
        }

        // Sepeti Sıfırla
        setCartItems([]);
        setSelectedCari(null);
        setDiscountVal('');
        setIsSplitModalOpen(false);
      }
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosView:executeSale');
      alert('Satış kaydı sırasında bir hata oluştu: ' + (err.message || err));
    } finally {
      setIsProcessing(false);
    }
  };

  // ONLINE PLATFORM SATIŞINI GERÇEKLEŞTİR
  const handleConfirmPlatformSale = async (data: {
    amount: number;
    commissionRate: number;
    commissionAmount: number;
    netAmount: number;
    useCartItems: boolean;
    note: string;
    platformName: string;
  }) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];
      const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      const receiptNo = generateReceiptNo();

      let itemsToSale: PosCartItem[] = [];

      if (data.useCartItems && cartItems.length > 0) {
        itemsToSale = [...cartItems];
      } else {
        // Doğrudan tutarla özel platform hizmet satırı oluştur
        itemsToSale = [
          {
            id: `plat_item_${Date.now()}`,
            stockId: `plat_srv_${Date.now()}`,
            stockCode: 'ONLINE-SIP',
            stockName: `${data.platformName} Siparişi (${data.note || 'Online Sipariş'})`,
            unit: 'Adet',
            unitPrice: data.amount,
            taxRate: globalTaxRate,
            quantity: 1,
            discountRate: 0,
            discountAmount: 0,
            totalLine: data.amount,
          },
        ];
      }

      const paymentSplit: PosPaymentSplit = {
        cashAmount: 0,
        cashReceived: 0,
        changeGiven: 0,
        posAmount: data.amount,
        openAccountAmount: 0,
        platformName: data.platformName,
        platformCommissionRate: data.commissionRate,
        platformCommissionAmount: data.commissionAmount,
        platformNetAmount: data.netAmount,
      };

      const platKey = data.platformName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const platCariId = `plat_cari_${platKey}`;
      const platCariName = data.platformName;

      const cariId = selectedCari ? selectedCari.id : platCariId;
      const cariName = selectedCari ? selectedCari.name : platCariName;

      const success = await onCompletePosSale({
        receiptNo,
        cariId,
        cariName,
        items: itemsToSale,
        paymentSplit,
        grandTotal: data.amount,
        subtotal: data.amount,
        totalTax: 0,
        totalDiscount: 0,
        date: dateStr,
      });

      if (success) {
        const saleSummary: PosSaleSummary = {
          receiptNo,
          date: dateStr,
          time: timeStr,
          items: itemsToSale,
          paymentSplit,
          cariId: selectedCari?.id,
          cariName,
          subtotal: data.amount,
          totalDiscount: 0,
          totalTax: 0,
          grandTotal: data.amount,
          note: `${data.platformName} Online Satış (%${data.commissionRate} Komisyon: ₺${data.commissionAmount.toFixed(2)} - Net: ₺${data.netAmount.toFixed(2)}) ${data.note ? '- ' + data.note : ''}`,
        };

        setCompletedSaleSummary(saleSummary);
        if (autoShowReceipt) {
          setIsReceiptModalOpen(true);
        }

        // SEPETİ SIFIRLA
        setCartItems([]);
        setSelectedCari(null);
        setCariSearchTerm('');
        setDiscountVal('');
      }
    } catch (err: any) {
      reportErrorToTelegram(err, 'PosView:handleConfirmPlatformSale');
      alert('Platform satışı sırasında bir hata oluştu: ' + (err.message || err));
    } finally {
      setIsProcessing(false);
      setSelectedPlatformForSale(null);
    }
  };

  // CARİ SÜZGEÇ
  const filteredCariler = safeCariler.filter((c) =>
    c && (
      (c.name || '').toLowerCase().includes(cariSearchTerm.toLowerCase()) ||
      (c.code || '').toLowerCase().includes(cariSearchTerm.toLowerCase())
    )
  );

  return (
    <div className="pos-terminal-wrapper flex flex-col min-h-[calc(100vh-4rem)] h-auto overflow-y-auto gap-3.5 animate-fade-in p-1.5 bg-slate-900 rounded-2xl pb-10" style={{ backgroundColor: '#0f172a' }}>
      {/* ÜST TERMİNAL BİLGİ & KISAYOL BAR */}
      <div className="p-3.5 bg-slate-900 border-2 border-slate-700 rounded-2xl shadow-xl flex flex-wrap items-center justify-between gap-3 shrink-0" style={{ backgroundColor: '#0f172a' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400 flex items-center justify-center text-teal-300 font-bold">
            <ShoppingCart size={20} />
          </div>
          <div>
            <h2 className="text-sm font-black text-white flex items-center gap-2">
              <span>HIZLI SATIŞ TERMİNALİ</span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-teal-600 text-white border border-teal-400 font-black shadow-sm">
                v1.8.1 POS Engine
              </span>
            </h2>
            <p className="text-[11px] text-slate-300 font-medium">
              Dokunmatik & Barkod Okuyucu Destekli Perakende Kasasız Satış
            </p>
          </div>
        </div>

        {/* KISAYOL TUŞLARI - YÜKSEK KONTRAST DOKUNMATİK SATIŞ BUTONLARI */}
        <div className="flex items-center gap-2 overflow-x-auto text-xs font-mono font-bold custom-scrollbar py-0.5">
          <button
            type="button"
            onClick={() => searchInputRef.current?.focus()}
            className="px-3.5 py-2 rounded-xl font-black shadow-md flex items-center gap-2 border cursor-pointer active:scale-95 transition-all touch-manipulation hover:brightness-125"
            style={{ backgroundColor: '#1e293b', color: '#ffffff', borderColor: '#334155' }}
            title="Barkod Arama Kutusuna Odaklan [F1]"
          >
            <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-black" style={{ color: '#2dd4bf', backgroundColor: 'rgba(20,184,166,0.25)' }}>
              F1
            </span>
            <span style={{ color: '#ffffff' }}>Barkod</span>
          </button>

          <button
            type="button"
            onClick={handleQuickCashSale}
            disabled={cartItems.length === 0 || isProcessing}
            className="px-3.5 py-2 rounded-xl font-black shadow-md flex items-center gap-2 border cursor-pointer active:scale-95 transition-all touch-manipulation disabled:opacity-40 hover:brightness-125"
            style={{ backgroundColor: '#065f46', color: '#ffffff', borderColor: '#10b981' }}
            title="Hızlı Nakit Satış Yap [F2]"
          >
            <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-black" style={{ color: '#a7f3d0', backgroundColor: 'rgba(16,185,129,0.25)' }}>
              F2
            </span>
            <span style={{ color: '#ffffff' }}>Hızlı Nakit</span>
          </button>

          <button
            type="button"
            onClick={handleQuickPosSale}
            disabled={cartItems.length === 0 || isProcessing}
            className="px-3.5 py-2 rounded-xl font-black shadow-md flex items-center gap-2 border cursor-pointer active:scale-95 transition-all touch-manipulation disabled:opacity-40 hover:brightness-125"
            style={{ backgroundColor: '#1e40af', color: '#ffffff', borderColor: '#3b82f6' }}
            title="Hızlı POS Satış Yap [F3]"
          >
            <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-black" style={{ color: '#bfdbfe', backgroundColor: 'rgba(59,130,246,0.25)' }}>
              F3
            </span>
            <span style={{ color: '#ffffff' }}>Hızlı POS</span>
          </button>

          <button
            type="button"
            onClick={() => { if (cartItems.length > 0) setIsSplitModalOpen(true); }}
            disabled={cartItems.length === 0 || isProcessing}
            className="px-3.5 py-2 rounded-xl font-black shadow-md flex items-center gap-2 border cursor-pointer active:scale-95 transition-all touch-manipulation disabled:opacity-40 hover:brightness-125"
            style={{ backgroundColor: '#6b21a8', color: '#ffffff', borderColor: '#a855f7' }}
            title="Parçalı Ödeme Ekranını Aç [F4]"
          >
            <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-black" style={{ color: '#e9d5ff', backgroundColor: 'rgba(168,85,247,0.25)' }}>
              F4
            </span>
            <span style={{ color: '#ffffff' }}>Parçalı Ödeme</span>
          </button>

          <button
            type="button"
            onClick={() => setIsParkedModalOpen(true)}
            className="px-3.5 py-2 rounded-xl font-black flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95 border touch-manipulation hover:brightness-110"
            style={{ backgroundColor: '#f59e0b', color: '#020617', borderColor: '#fbbf24' }}
            title="Askıdaki Satışları Görüntüle [F8]"
          >
            <Clock size={16} style={{ color: '#020617' }} />
            <span className="px-2 py-0.5 rounded-lg text-xs font-mono font-black" style={{ color: '#020617', backgroundColor: 'rgba(2,6,23,0.25)' }}>
              F8
            </span>
            <span style={{ color: '#020617', fontWeight: 900 }}>Askıdaki Satışlar ({(parkedSales || []).length})</span>
          </button>

          {/* RESTORAN MASA PLANINI AÇ BUTONU */}
          <button
            type="button"
            onClick={() => setIsTableModalOpen(true)}
            className="px-3.5 py-2 rounded-xl font-black flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95 border touch-manipulation hover:brightness-110"
            style={{ backgroundColor: '#059669', color: '#ffffff', borderColor: '#34d399' }}
            title="Restoran Masalarını ve Adisyon Planını Aç"
          >
            <Utensils size={16} className="text-white" />
            <span style={{ color: '#ffffff', fontWeight: 900 }}>
              Masa Planı ({(tables || []).filter((t) => t.status === 'occupied' || t.status === 'bill_printed').length} Dolu)
            </span>
          </button>

          {/* SON FİŞİ GÖR / YAZDIR BUTONU */}
          {completedSaleSummary && (
            <button
              type="button"
              onClick={() => setIsReceiptModalOpen(true)}
              className="px-3.5 py-2 rounded-xl font-black flex items-center gap-2 cursor-pointer transition-all shadow-md active:scale-95 border touch-manipulation hover:brightness-110"
              style={{ backgroundColor: '#0284c7', color: '#ffffff', borderColor: '#38bdf8' }}
              title="Son Tamamlanan Satışın Fişini Yazdır / İncele"
            >
              <Receipt size={16} className="text-white" />
              <span style={{ color: '#ffffff', fontWeight: 900 }}>
                Son Fiş (#{completedSaleSummary.receiptNo})
              </span>
            </button>
          )}

          {/* OTOMATİK FİŞ AÇMA GEÇİŞ TOGGLE'I */}
          <button
            type="button"
            onClick={() => setAutoShowReceipt(!autoShowReceipt)}
            className={`px-3 py-2 rounded-xl font-extrabold flex items-center gap-1.5 cursor-pointer transition-all border text-xs active:scale-95 touch-manipulation shrink-0 ${
              autoShowReceipt
                ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                : 'bg-slate-900 text-slate-400 border-slate-700/80 hover:text-slate-200'
            }`}
            title="Satış yapıldığında otomatik fiş penceresini aç/kapat"
          >
            <Receipt size={14} className={autoShowReceipt ? 'text-emerald-400' : 'text-slate-500'} />
            <span>Oto. Fiş: <strong className={autoShowReceipt ? 'text-emerald-300' : 'text-rose-400'}>{autoShowReceipt ? 'Açık' : 'Kapalı'}</strong></span>
          </button>
        </div>
      </div>

      {/* AKTİF MASA BİLGİ ŞERİDİ */}
      {activeTable && (
        <div className="p-3 bg-gradient-to-r from-amber-500/20 via-slate-900 to-amber-500/10 border-2 border-amber-500/50 rounded-2xl flex flex-wrap items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 font-black rounded-xl shadow-lg">
              <Utensils size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-amber-300 uppercase tracking-wide">
                  AKTİF MASA: {activeTable.name} ({activeTable.category})
                </span>
                <span className={`px-2 py-0.5 text-[10px] font-black rounded uppercase ${
                  activeTable.status === 'bill_printed' ? 'bg-amber-500 text-slate-950' : 'bg-rose-500 text-white'
                }`}>
                  {activeTable.status === 'bill_printed' ? 'Adisyon Basıldı' : 'Dolu Masa'}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium">
                Açılış: <span className="font-mono font-bold text-amber-400">{activeTable.openedAt || 'Şimdi'}</span> | 
                Masadaki Ürün: <span className="font-bold text-white">{cartItems.length} Kalem</span> | 
                Tutar: <span className="font-mono font-black text-amber-400 text-sm">₺{summary.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleSaveCartToActiveTable}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <CheckCircle2 size={16} />
              <span>Masaya Kaydet</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAdisyonModalOpen(true)}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Receipt size={16} />
              <span>Adisyon Fişi Bas</span>
            </button>

            <button
              type="button"
              onClick={() => setIsTableModalOpen(true)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-white/10 transition-all cursor-pointer"
            >
              Masayı Değiştir
            </button>

            <button
              type="button"
              onClick={() => setIsExitTableConfirmOpen(true)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-rose-400 font-bold text-xs rounded-xl border border-rose-500/30 transition-all cursor-pointer"
              title="Masadan Ayrıl"
            >
              Masadan Çık
            </button>
          </div>
        </div>
      )}

      {/* İKİLİ EKRAN YAPISI */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3.5 min-h-0">
        {/* SOL PANEL: ÜRÜN KATALOĞU VE KASA GÖSTERGESİ / ÖDEME PANELİ */}
        <div className="md:col-span-7 xl:col-span-8 flex flex-col gap-3.5 min-h-0">
          <PosProductCatalog
            stocks={safeStocks}
            onAddToCart={handleAddToCart}
            searchTerm={productSearchTerm}
            setSearchTerm={setProductSearchTerm}
            searchInputRef={searchInputRef}
          />

          {/* KASA GÖSTERGESİ VE ÖDEME PANELİ (GÖSTERGE SOL PANEL ALTINA ALINDI) */}
          <div className="p-4 bg-slate-900 rounded-2xl border-2 border-slate-700 shadow-2xl space-y-3.5 shrink-0" style={{ backgroundColor: '#0f172a' }}>
            
            {/* KDV ORANI, İSKONTO VE PARA BİRİMİ PANELİ */}
            <div className="p-3.5 bg-slate-900 rounded-2xl border-2 border-slate-700 grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center" style={{ backgroundColor: '#0f172a' }}>
              {/* 1. KDV SEÇİMİ (VARSAYILAN %0) */}
              <div className="md:col-span-3 space-y-1.5">
                <span className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-1.5" style={{ color: '#cbd5e1' }}>
                  <Percent size={14} className="text-teal-400" style={{ color: '#2dd4bf' }} />
                  KDV Oranı:
                </span>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
                  {[0, 1, 10, 20].map((rate) => (
                    <button
                      key={rate}
                      type="button"
                      onClick={() => setGlobalTaxRate(rate)}
                      className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-mono font-black transition-all cursor-pointer text-center active:scale-95 touch-manipulation ${
                        globalTaxRate === rate
                          ? 'bg-teal-500 text-slate-950 shadow-md scale-105'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }`}
                      style={globalTaxRate === rate ? { backgroundColor: '#2dd4bf', color: '#020617', fontWeight: 900 } : {}}
                    >
                      %{rate}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. İSKONTO SEÇİMİ (% YÜZDE, ₺ İSKONTO, 🎯 NET ALINACAK TUTAR) */}
              <div className="md:col-span-9 space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-1">
                  <span className="text-xs font-black text-amber-300 uppercase tracking-wider flex items-center gap-1" style={{ color: '#fcd34d' }}>
                    <Sparkles size={15} />
                    İskonto:
                  </span>
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
                    <button
                      type="button"
                      onClick={() => { setDiscountMode('percent'); setDiscountVal(''); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer active:scale-95 touch-manipulation ${
                        discountMode === 'percent' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                      }`}
                      style={discountMode === 'percent' ? { backgroundColor: '#f59e0b', color: '#020617', fontWeight: 900 } : {}}
                    >
                      % Yüzde
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDiscountMode('amount'); setDiscountVal(''); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer active:scale-95 touch-manipulation ${
                        discountMode === 'amount' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                      }`}
                      style={discountMode === 'amount' ? { backgroundColor: '#f59e0b', color: '#020617', fontWeight: 900 } : {}}
                    >
                      ₺ İskonto
                    </button>
                    <button
                      type="button"
                      onClick={() => { setDiscountMode('target'); setDiscountVal(''); }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer active:scale-95 touch-manipulation ${
                        discountMode === 'target' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                      }`}
                      style={discountMode === 'target' ? { backgroundColor: '#f59e0b', color: '#020617', fontWeight: 900 } : {}}
                    >
                      🎯 Net Tutar
                    </button>
                  </div>
                </div>

                {/* İSKONTO GİRİŞ INPUT'U */}
                <PosNumpadModal
                  isOpen={isDiscountNumpadOpen}
                  onClose={() => setIsDiscountNumpadOpen(false)}
                  title={discountMode === 'percent' ? 'İskonto % Oranı' : discountMode === 'amount' ? 'İskonto Tutarı (₺)' : 'Alınacak Net Tutar (₺)'}
                  initialValue={discountVal}
                  onConfirm={(val) => setDiscountVal(val)}
                  allowDecimal={true}
                />
                <div className="relative flex items-center">
                  <button
                    onClick={() => setIsDiscountNumpadOpen(true)}
                    className="w-full text-left pl-3.5 pr-9 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white font-bold hover:border-amber-400 transition-colors flex items-center h-[42px]"
                    style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                  >
                    {discountVal === '' || discountVal === 0 ? (
                      <span className="text-slate-500">
                        {discountMode === 'percent'
                          ? 'İskonto % Oranı Giriniz...'
                          : discountMode === 'amount'
                          ? 'İskonto Tutarı ₺ Giriniz...'
                          : 'Alınacak Net Tutar ₺ Giriniz...'}
                      </span>
                    ) : (
                      <span>{discountVal}</span>
                    )}
                  </button>
                  <span className="absolute right-3 text-xs font-black font-mono text-amber-400" style={{ color: '#fbbf24' }}>
                    {discountMode === 'percent' ? '%' : '₺'}
                  </span>
                </div>
              </div>

            </div>
              {/* HESAPLAMA ÖZETİ & EKRAN GÖSTERGESİ (2 KOLONLU DÜZEN) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center border-y border-slate-800 py-3.5">
              {/* KALEM DETAYLARI */}
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-300 font-bold">
                  <span>Ara Toplam:</span>
                  <span className="text-white font-black" style={{ color: '#ffffff' }}>₺{summary.rawTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {summary.totalDiscount > 0 && (
                  <div className="flex justify-between text-amber-300 font-bold" style={{ color: '#fcd34d' }}>
                    <span>Toplam İskonto:</span>
                    <span>-₺{summary.totalDiscount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}

                <div className="flex justify-between text-slate-300 font-bold">
                  <span>KDV Matrahı (%{globalTaxRate}):</span>
                  <span className="text-white font-black" style={{ color: '#ffffff' }}>₺{summary.taxBase.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>

                {globalTaxRate > 0 && (
                  <div className="flex justify-between text-slate-400 font-bold">
                    <span>KDV Tutarı (%{globalTaxRate}):</span>
                    <span className="text-slate-200">₺{summary.totalTax.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                )}
              </div>

              {/* ANA GENEL TOPLAM GÖSTERGESİ */}
              <div className="bg-slate-900 p-3.5 rounded-2xl border-2 border-teal-500/50 flex flex-col justify-center items-end shadow-inner" style={{ backgroundColor: '#0f172a' }}>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
                  GENEL TOPLAM (TUTAR)
                </span>
                <span className="text-teal-300 font-black text-3xl sm:text-4xl font-mono tracking-tight" style={{ color: '#2dd4bf' }}>
                  ₺{summary.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>

                {selectedCurrency !== 'TRY' && (
                  <div className="text-amber-300 font-mono text-base font-black pt-1 border-t border-slate-800 w-full text-right" style={{ color: '#fcd34d' }}>
                    Ödenecek: {currencySymbol}{convertedTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {selectedCurrency}
                  </div>
                )}
              </div>
            </div>

            {/* HIZLI AKSİYON ÖDEME & ONLINE SİPARİŞ BÖLÜMÜ (AŞAĞIDA BİRLİKTE) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
              {/* HIZLI AKSİYON ÖDEME BUTONLARI */}
              <div className="lg:col-span-7 xl:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <button
                  disabled={cartItems.length === 0 || isProcessing}
                  onClick={handleQuickCashSale}
                  className="py-3.5 sm:py-4 px-2.5 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black rounded-2xl text-xs sm:text-sm shadow-xl shadow-emerald-500/30 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 touch-manipulation border-2 border-emerald-300"
                >
                  <DollarSign size={20} className="shrink-0" />
                  <span className="text-center font-black">NAKİT [F2]</span>
                </button>

                <button
                  disabled={cartItems.length === 0 || isProcessing}
                  onClick={handleQuickPosSale}
                  className="py-3.5 sm:py-4 px-2.5 bg-blue-500 hover:bg-blue-400 disabled:opacity-40 text-slate-950 font-black rounded-2xl text-xs sm:text-sm shadow-xl shadow-blue-500/30 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 touch-manipulation border-2 border-blue-300"
                >
                  <CreditCard size={20} className="shrink-0" />
                  <span className="text-center font-black">POS [F3]</span>
                </button>

                <button
                  disabled={cartItems.length === 0 || isProcessing}
                  onClick={() => setIsSplitModalOpen(true)}
                  className="py-3.5 sm:py-4 px-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-black rounded-2xl text-xs sm:text-sm shadow-xl shadow-purple-600/30 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 touch-manipulation border-2 border-purple-400"
                >
                  <Zap size={18} className="shrink-0" />
                  <span className="text-center font-black">PARÇALI [F4]</span>
                </button>

                <button
                  disabled={cartItems.length === 0 || isProcessing}
                  onClick={handleParkSale}
                  className="py-3.5 sm:py-4 px-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black rounded-2xl text-xs sm:text-sm shadow-xl shadow-amber-500/20 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer active:scale-95 touch-manipulation border-2 border-amber-300"
                >
                  <Clock size={18} className="shrink-0" />
                  <span className="text-center font-black">ASKI [F8]</span>
                </button>
              </div>

              {/* ONLINE SİPARİŞ PLATFORMLARI (AŞAĞIDA ÖDEMENİN YANINDA) */}
              <div className="lg:col-span-5 xl:col-span-4 p-2.5 bg-slate-950/80 border-2 border-slate-700/80 rounded-2xl shadow-xl flex flex-col justify-between gap-2" style={{ backgroundColor: '#020617' }}>
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base">🛵</span>
                    <span className="text-xs font-black text-white block leading-tight">ONLINE SİPARİŞ</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPlatformSettingsOpen(true)}
                    className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-black flex items-center gap-1 shrink-0 transition-all cursor-pointer active:scale-95"
                    title="Platform Oranlarını ve Komisyonları Düzenle"
                  >
                    <Settings size={12} className="text-teal-400" />
                    <span>Oranlar</span>
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  {platforms
                    .filter((p) => p.active)
                    .map((plat) => (
                      <button
                        key={plat.id}
                        type="button"
                        onClick={() => setSelectedPlatformForSale(plat)}
                        className={`px-2 py-1.5 rounded-xl text-[11px] font-black flex items-center justify-between gap-1 transition-all cursor-pointer shadow-md active:scale-95 touch-manipulation hover:scale-[1.02] border ${plat.bgColor} ${plat.borderColor} ${plat.textColor}`}
                        title={`${plat.name} Sipariş Gir (%${plat.commissionRate} Komisyon)`}
                      >
                        <div className="flex items-center gap-1 min-w-0 truncate">
                          <span className="text-xs shrink-0">{plat.icon}</span>
                          <span className="truncate font-black">{plat.name}</span>
                        </div>
                        <span className={`px-1 py-0.2 rounded text-[9px] font-mono font-black shrink-0 ${plat.badgeColor}`}>
                          %{plat.commissionRate}
                        </span>
                      </button>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SAĞ PANEL: SEPET & MÜŞTERİ SEÇİMİ (GENİŞ SEPET TABLOSU) */}
        <div className="md:col-span-5 xl:col-span-4 flex flex-col gap-3.5 min-h-0">
          {/* 1. MÜŞTERİ / CARİ SEÇİMİ */}
          <div className="p-3.5 bg-slate-900 rounded-2xl border-2 border-slate-700 relative shrink-0 shadow-xl" style={{ backgroundColor: '#0f172a' }}>
            <div className="flex items-center justify-between gap-2 mb-2">
              <label className="text-xs font-black text-white flex items-center gap-1.5 uppercase tracking-wider" style={{ color: '#ffffff' }}>
                <User size={16} className="text-teal-400" style={{ color: '#2dd4bf' }} />
                Müşteri (Cari)
              </label>
              {selectedCari ? (
                <button
                  onClick={() => setSelectedCari(null)}
                  className="text-xs font-black text-amber-300 hover:underline cursor-pointer"
                  style={{ color: '#fcd34d' }}
                >
                  Perakendeye Dön
                </button>
              ) : (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-500/20 text-teal-300 border border-teal-500/40">
                  Perakende Satış
                </span>
              )}
            </div>

            {selectedCari ? (
              <div className="p-2.5 bg-teal-500/10 border border-teal-400/40 rounded-xl flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-black text-white" style={{ color: '#ffffff' }}>{selectedCari.name}</h5>
                  <span className="text-[11px] text-slate-300 font-mono">
                    {selectedCari.code} • Bakiye:{' '}
                    <strong className={selectedCari.balance >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      ₺{selectedCari.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                    </strong>
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-teal-500/20 text-teal-200 border border-teal-400/50">
                  Seçili Cari
                </span>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={cariSearchTerm}
                  onFocus={() => setIsCariDropdownOpen(true)}
                  onChange={(e) => {
                    setCariSearchTerm(e.target.value);
                    setIsCariDropdownOpen(true);
                  }}
                  placeholder="Müşteri Ara veya 'Perakende Müşteri'..."
                  className="w-full px-3 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 font-bold focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all shadow-inner"
                  style={{ backgroundColor: '#020617', color: '#ffffff' }}
                />

                {isCariDropdownOpen && (
                  <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-slate-900 border-2 border-slate-600 rounded-xl shadow-2xl max-h-48 overflow-y-auto custom-scrollbar">
                    <button
                      onClick={() => {
                        setSelectedCari(null);
                        setIsCariDropdownOpen(false);
                      }}
                      className="w-full text-left p-2.5 hover:bg-slate-800 text-xs font-black text-teal-300 border-b border-slate-700 cursor-pointer"
                    >
                      🛒 Perakende Müşteri (Kasasız Anında Satış)
                    </button>
                    {filteredCariler.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => {
                          setSelectedCari(c);
                          setIsCariDropdownOpen(false);
                          setCariSearchTerm('');
                        }}
                        className="w-full text-left p-2.5 hover:bg-slate-800 text-xs text-white border-b border-slate-700/60 last:border-none flex justify-between cursor-pointer font-medium"
                      >
                        <span className="font-bold">{c.name}</span>
                        <span className="font-mono text-xs text-teal-300 font-bold">
                          ₺{c.balance.toFixed(2)}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 2. SEPET TABLOSU (SAĞ PANELİ TAM KAPLAR VE RAHATÇA UZAR) */}
          <PosCartTable
            items={cartItems}
            onUpdateQuantity={handleUpdateQuantity}
            onSetQuantity={handleSetQuantity}
            onUpdateDiscount={handleUpdateDiscount}
            onUpdateUnitPrice={handleUpdateUnitPrice}
            onRemoveItem={handleRemoveItem}
            onClearCart={handleClearCart}
          />
        </div>
      </div>

      {/* PARÇALI ÖDEME MODALI */}
      <PosSplitPaymentModal
        isOpen={isSplitModalOpen}
        onClose={() => setIsSplitModalOpen(false)}
        grandTotal={summary.grandTotal}
        bankAccounts={safeBankAccounts}
        selectedCari={selectedCari}
        onConfirmPayment={executeSale}
      />

      {/* FİŞ / FİŞ YAZDIRMA MODALI */}
      <PosReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
        saleSummary={completedSaleSummary}
      />

      {/* ASKIDAKİ SATIŞLAR MODALI */}
      <PosParkedSalesModal
        isOpen={isParkedModalOpen}
        onClose={() => setIsParkedModalOpen(false)}
        parkedSales={parkedSales}
        onRestoreSale={handleRestoreParkedSale}
        onDeleteSale={(id) => setParkedSales((prev) => prev.filter((p) => p.id !== id))}
      />

      {/* ONLINE PLATFORM AYARLARI MODALI */}
      <PosPlatformSettingsModal
        isOpen={isPlatformSettingsOpen}
        onClose={() => setIsPlatformSettingsOpen(false)}
        platforms={platforms}
        onSavePlatforms={(updated) => setPlatforms(updated)}
      />

      {/* ONLINE PLATFORM SATIŞ MODALI */}
      <PosDirectPlatformSaleModal
        isOpen={!!selectedPlatformForSale}
        onClose={() => setSelectedPlatformForSale(null)}
        platform={selectedPlatformForSale}
        cartItems={cartItems}
        cartGrandTotal={summary.grandTotal}
        onConfirmSale={handleConfirmPlatformSale}
      />

      {/* RESTORAN MASA YÖNETİMİ MODALI */}
      <PosTableManagementModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        tables={tables}
        activeTableId={activeTableId}
        onSelectTableForOrder={handleSelectTableForOrder}
        onUpdateTables={(newTables) => setTables(newTables)}
      />

      {/* ADİSYON MODALI */}
      <PosTableAdisyonModal
        isOpen={isAdisyonModalOpen}
        onClose={() => setIsAdisyonModalOpen(false)}
        table={activeTable}
        onMarkBillPrinted={(tableId) => {
          setTables((prev) =>
            prev.map((t) => (t.id === tableId ? { ...t, status: 'bill_printed' } : t))
          );
        }}
      />

      {/* MASADAN ÇIK ONAY MODALI */}
      {isExitTableConfirmOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
                <Utensils size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Masadan Ayrıl</h3>
                <p className="text-xs text-slate-400">{activeTable?.name || 'Aktif Masa'}</p>
              </div>
            </div>
            <p className="text-sm text-slate-200 bg-slate-950 p-3 rounded-xl border border-white/10">
              Masadan çıkmak üzeresiniz. Yapmak istediğiniz işlemi seçiniz:
            </p>
            <div className="flex flex-col items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsExitTableConfirmOpen(false)}
                className="w-full sm:w-auto px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSaveCartToActiveTable();
                  setActiveTableId(null);
                  setCartItems([]);
                  setIsExitTableConfirmOpen(false);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Kaydet & Çık
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTableId(null);
                  setCartItems([]);
                  setIsExitTableConfirmOpen(false);
                }}
                className="w-full sm:w-auto px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Kaydetmeden Çık
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEPETİ TEMİZLE ONAY MODALI */}
      {isClearCartConfirmOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl">
                <RotateCcw size={24} />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Sepeti Temizle</h3>
                <p className="text-xs text-slate-400">Tüm ürünler sepetten silinecek</p>
              </div>
            </div>
            <p className="text-sm text-slate-200 bg-slate-950 p-3 rounded-xl border border-white/10">
              Sepetteki tüm ürünler silinecektir. Devam etmek istiyor musunuz?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsClearCartConfirmOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={confirmClearCart}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-600/30 cursor-pointer"
              >
                Evet, Sepeti Temizle
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
