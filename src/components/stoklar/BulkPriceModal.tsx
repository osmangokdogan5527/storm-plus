import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Search, 
  RefreshCw,
  Sparkles,
  Check, 
  DollarSign, 
  Delete, 
  ChevronUp, 
  ChevronDown,
  Calculator,
  ArrowRight,
  Package
} from 'lucide-react';
import { Stock } from '../../types';
import { updateBulkStockPrices } from '../../firebase';

interface BulkPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  stoklar: Stock[];
  categories?: string[];
  brands?: string[];
}

type PriceField = 'salesPrice' | 'purchasePrice' | 'both';
type BulkOpType = 'percent_increase' | 'percent_decrease' | 'amount_increase' | 'amount_decrease' | 'fixed_set';

export const BulkPriceModal: React.FC<BulkPriceModalProps> = ({
  isOpen,
  onClose,
  stoklar = []
}) => {
  // Price field target for bulk calculator
  const [priceField, setPriceField] = useState<PriceField>('salesPrice');
  const [bulkOp, setBulkOp] = useState<BulkOpType>('percent_increase');
  const [bulkValue, setBulkValue] = useState<number>(10);

  // Search & manual edit map: stockId -> { salesPrice?: number; purchasePrice?: number }
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [customPrices, setCustomPrices] = useState<{
    [id: string]: { salesPrice: number; purchasePrice: number };
  }>({});

  // Active item and active editing field for Numpad
  const [activeStockId, setActiveStockId] = useState<string | null>(null);
  const [activeField, setActiveField] = useState<'salesPrice' | 'purchasePrice'>('salesPrice');
  const [numpadBuffer, setNumpadBuffer] = useState<string>('');

  const [isUpdating, setIsUpdating] = useState<boolean>(false);
  const [updateSuccess, setUpdateSuccess] = useState<boolean>(false);
  const [updatedCount, setUpdatedCount] = useState<number>(0);

  // Initialize custom prices and selections whenever modal opens
  useEffect(() => {
    if (isOpen) {
      const initialMap: { [id: string]: { salesPrice: number; purchasePrice: number } } = {};
      const allIds = new Set<string>();
      
      (stoklar || []).forEach((s) => {
        initialMap[s.id] = {
          salesPrice: Number(s.salesPrice) || 0,
          purchasePrice: Number(s.purchasePrice) || 0
        };
        allIds.add(s.id);
      });

      setCustomPrices(initialMap);
      setSelectedIds(allIds);
      if (stoklar.length > 0) {
        setActiveStockId(stoklar[0].id);
        setNumpadBuffer((stoklar[0].salesPrice || 0).toString());
      }
      setSearchTerm('');
      setUpdateSuccess(false);
    }
  }, [isOpen, stoklar]);

  // Sync buffer when active stock or field changes
  useEffect(() => {
    if (activeStockId && customPrices[activeStockId]) {
      const val = customPrices[activeStockId][activeField];
      setNumpadBuffer(val !== undefined ? val.toString() : '');
    }
  }, [activeStockId, activeField]);

  // Filter stocks by search
  const filteredStocks = useMemo(() => {
    if (!searchTerm.trim()) return stoklar || [];
    const term = searchTerm.toLowerCase();
    return (stoklar || []).filter((s) => {
      const nameMatch = (s.name || '').toLowerCase().includes(term);
      const codeMatch = (s.code || '').toLowerCase().includes(term);
      const barcodeMatch = (s.barcode || '').toLowerCase().includes(term);
      return nameMatch || codeMatch || barcodeMatch;
    });
  }, [stoklar, searchTerm]);

  // Count changed stocks
  const changedStocks = useMemo(() => {
    const changes: { id: string; stock: Stock; oldSales: number; newSales: number; oldPurchase: number; newPurchase: number }[] = [];
    (stoklar || []).forEach((s) => {
      const current = customPrices[s.id];
      if (!current) return;
      const oldSales = Number(s.salesPrice) || 0;
      const newSales = Number(current.salesPrice) || 0;
      const oldPurchase = Number(s.purchasePrice) || 0;
      const newPurchase = Number(current.purchasePrice) || 0;

      const salesChanged = Math.abs(oldSales - newSales) > 0.001;
      const purchaseChanged = Math.abs(oldPurchase - newPurchase) > 0.001;

      if (salesChanged || purchaseChanged) {
        changes.push({
          id: s.id,
          stock: s,
          oldSales,
          newSales,
          oldPurchase,
          newPurchase
        });
      }
    });
    return changes;
  }, [stoklar, customPrices]);

  // Apply bulk operation to selected items
  const handleApplyBulkToSelected = () => {
    if (selectedIds.size === 0) {
      alert('Lütfen toplu işlem uygulamak istediğiniz ürünleri listeden seçin.');
      return;
    }

    setCustomPrices((prev) => {
      const updated = { ...prev };
      (stoklar || []).forEach((s) => {
        if (selectedIds.has(s.id)) {
          const current = updated[s.id] || {
            salesPrice: s.salesPrice || 0,
            purchasePrice: s.purchasePrice || 0
          };

          let newSales = current.salesPrice;
          let newPurchase = current.purchasePrice;

          const calculateVal = (origVal: number) => {
            const val = Number(origVal) || 0;
            const opVal = Number(bulkValue) || 0;
            if (bulkOp === 'percent_increase') {
              return Math.round((val + (val * opVal) / 100) * 100) / 100;
            }
            if (bulkOp === 'percent_decrease') {
              return Math.max(0, Math.round((val - (val * opVal) / 100) * 100) / 100);
            }
            if (bulkOp === 'amount_increase') {
              return Math.round((val + opVal) * 100) / 100;
            }
            if (bulkOp === 'amount_decrease') {
              return Math.max(0, Math.round((val - opVal) * 100) / 100);
            }
            if (bulkOp === 'fixed_set') {
              return Math.max(0, Math.round(opVal * 100) / 100);
            }
            return val;
          };

          if (priceField === 'salesPrice' || priceField === 'both') {
            newSales = calculateVal(s.salesPrice || 0);
          }
          if (priceField === 'purchasePrice' || priceField === 'both') {
            newPurchase = calculateVal(s.purchasePrice || 0);
          }

          updated[s.id] = {
            salesPrice: newSales,
            purchasePrice: newPurchase
          };
        }
      });
      return updated;
    });

    // Update buffer if active item was modified
    if (activeStockId && selectedIds.has(activeStockId)) {
      setTimeout(() => {
        setCustomPrices((curr) => {
          const val = curr[activeStockId]?.[activeField];
          if (val !== undefined) setNumpadBuffer(val.toString());
          return curr;
        });
      }, 50);
    }
  };

  // Toggle single item selection
  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select all or clear
  const handleSelectAll = () => {
    setSelectedIds(new Set((stoklar || []).map((s) => s.id)));
  };

  const handleClearSelection = () => {
    setSelectedIds(new Set());
  };

  // Numpad key handlers
  const handleNumpadNumber = (char: string) => {
    if (!activeStockId) return;
    setNumpadBuffer((prev) => {
      let next = prev;
      if (char === '.') {
        if (next.includes('.')) return next;
        next = next === '' ? '0.' : next + '.';
      } else {
        if (next === '0' && char !== '00') {
          next = char;
        } else {
          next = next + char;
        }
      }

      const numVal = parseFloat(next) || 0;
      setCustomPrices((curr) => ({
        ...curr,
        [activeStockId]: {
          ...(curr[activeStockId] || { salesPrice: 0, purchasePrice: 0 }),
          [activeField]: numVal
        }
      }));

      return next;
    });
  };

  const handleNumpadBackspace = () => {
    if (!activeStockId) return;
    setNumpadBuffer((prev) => {
      const next = prev.slice(0, -1);
      const numVal = parseFloat(next) || 0;
      setCustomPrices((curr) => ({
        ...curr,
        [activeStockId]: {
          ...(curr[activeStockId] || { salesPrice: 0, purchasePrice: 0 }),
          [activeField]: numVal
        }
      }));
      return next;
    });
  };

  const handleNumpadClear = () => {
    if (!activeStockId) return;
    setNumpadBuffer('');
    setCustomPrices((curr) => ({
      ...curr,
      [activeStockId]: {
        ...(curr[activeStockId] || { salesPrice: 0, purchasePrice: 0 }),
        [activeField]: 0
      }
    }));
  };

  // Quick adjust for active item
  const handleQuickAdjustActive = (percentOrAmount: number, isPercent: boolean) => {
    if (!activeStockId) return;
    const current = customPrices[activeStockId] || { salesPrice: 0, purchasePrice: 0 };
    const currentVal = current[activeField] || 0;

    let nextVal = currentVal;
    if (isPercent) {
      nextVal = currentVal + (currentVal * percentOrAmount) / 100;
    } else {
      nextVal = currentVal + percentOrAmount;
    }
    nextVal = Math.max(0, Math.round(nextVal * 100) / 100);

    setNumpadBuffer(nextVal.toString());
    setCustomPrices((curr) => ({
      ...curr,
      [activeStockId]: {
        ...(curr[activeStockId] || { salesPrice: 0, purchasePrice: 0 }),
        [activeField]: nextVal
      }
    }));
  };

  // Navigate to previous or next stock in list
  const handleNavigate = (direction: 'up' | 'down') => {
    if (filteredStocks.length === 0) return;
    const currentIndex = filteredStocks.findIndex((s) => s.id === activeStockId);
    let nextIndex = 0;
    if (direction === 'up') {
      nextIndex = currentIndex <= 0 ? filteredStocks.length - 1 : currentIndex - 1;
    } else {
      nextIndex = currentIndex >= filteredStocks.length - 1 ? 0 : currentIndex + 1;
    }
    const nextStock = filteredStocks[nextIndex];
    if (nextStock) {
      setActiveStockId(nextStock.id);
    }
  };

  // Manual direct input typing in row
  const handleDirectPriceChange = (id: string, field: 'salesPrice' | 'purchasePrice', valueStr: string) => {
    const num = parseFloat(valueStr) || 0;
    setCustomPrices((prev) => ({
      ...prev,
      [id]: {
        ...(prev[id] || { salesPrice: 0, purchasePrice: 0 }),
        [field]: num
      }
    }));
    if (activeStockId === id && activeField === field) {
      setNumpadBuffer(valueStr);
    }
  };

  // Execute and commit bulk prices to Firestore
  const handleCommitUpdates = async () => {
    if (changedStocks.length === 0) {
      alert('Değiştirilen herhangi bir fiyat bulunmuyor.');
      return;
    }

    const confirmMsg = `${changedStocks.length} adet ürünün yeni fiyatları kaydedilecek. Onaylıyor musunuz?`;
    if (!window.confirm(confirmMsg)) return;

    setIsUpdating(true);
    try {
      const updates = changedStocks.map((c) => ({
        id: c.id,
        salesPrice: c.newSales,
        purchasePrice: c.newPurchase
      }));

      await updateBulkStockPrices(updates);
      setUpdatedCount(updates.length);
      setUpdateSuccess(true);
      setTimeout(() => {
        setUpdateSuccess(false);
        onClose();
      }, 1500);
    } catch (err: any) {
      console.error('Fiyat güncelleme hatası:', err);
      if (window.electronAPI && (window.electronAPI as any).reportError) {
        (window.electronAPI as any).reportError({
          message: `Toplu Fiyat Güncelleme Hatası: ${err?.message || err}`,
          stack: err?.stack || ''
        });
      }
      alert('Fiyatlar güncellenirken bir hata oluştu.');
    } finally {
      setIsUpdating(false);
    }
  };

  const activeStock = useMemo(() => {
    return (stoklar || []).find((s) => s.id === activeStockId);
  }, [stoklar, activeStockId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        id="bulk-price-modal-overlay"
        className="fixed inset-0 z-[99999] flex items-center justify-center p-2 sm:p-4 pl-2 md:pl-24 lg:pl-28 bg-black/85 backdrop-blur-md overflow-hidden"
      >
        <motion.div
          id="bulk-price-modal-card"
          initial={{ opacity: 0, scale: 0.97, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 15 }}
          className="w-full max-w-[calc(100vw-110px)] lg:max-w-[1650px] h-[92vh] max-h-[960px] min-h-[580px] bg-[#0f172a] border-2 border-slate-700/90 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white"
        >
          {/* HEADER */}
          <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center shrink-0">
                <Calculator size={22} />
              </div>
              <div>
                <h3 className="text-base font-black text-white flex items-center gap-2">
                  Fiyat Güncelleme
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-teal-500/20 text-teal-300 border border-teal-500/30 uppercase">
                    v1.4.4
                  </span>
                </h3>
                <p className="text-xs text-slate-400 font-medium">
                  Listeden ürün seçip sağdaki numpad ile satış ve alış fiyatlarını hızlıca güncelleyin.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>

          {/* MAIN SPLIT CONTENT: LEFT TABLE + RIGHT NUMPAD */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
            {/* LEFT: INTERACTIVE PRODUCT TABLE */}
            <div className="flex-1 flex flex-col border-b md:border-b-0 md:border-r border-slate-800 overflow-hidden bg-slate-950/60 min-h-0">
              {/* TABLE CONTROLS */}
              <div className="p-3 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/60 shrink-0">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    type="text"
                    placeholder="Ürün adı, barkod veya stok kodu ile ara..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-medium text-white placeholder-slate-400 outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400/40"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={handleSelectAll}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-200 border border-slate-700 transition cursor-pointer"
                  >
                    Tümünü Seç
                  </button>
                  <button
                    type="button"
                    onClick={handleClearSelection}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-200 border border-slate-700 transition cursor-pointer"
                  >
                    Seçimi Kaldır
                  </button>
                </div>
              </div>

              {/* TABLE LIST */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-900 text-slate-300 text-[11px] font-black uppercase tracking-wider border-b border-slate-800 z-10 shadow-sm">
                    <tr>
                      <th className="p-3 w-12 text-center">Seç</th>
                      <th className="p-3">Ürün Bilgisi</th>
                      <th className="p-3 text-right w-32">Mevcut Satış</th>
                      <th className="p-3 text-right w-44">Yeni Satış (₺)</th>
                      <th className="p-3 text-right w-40">Yeni Alış (₺)</th>
                      <th className="p-3 text-right w-28">Fark</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredStocks.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-12 text-center text-slate-400 font-bold">
                          Eşleşen ürün bulunamadı.
                        </td>
                      </tr>
                    ) : (
                      filteredStocks.map((stock) => {
                        const current = customPrices[stock.id] || {
                          salesPrice: stock.salesPrice || 0,
                          purchasePrice: stock.purchasePrice || 0
                        };
                        const oldSales = Number(stock.salesPrice) || 0;
                        const newSales = Number(current.salesPrice) || 0;
                        const salesDiff = newSales - oldSales;
                        const isSelected = selectedIds.has(stock.id);
                        const isActive = activeStockId === stock.id;

                        return (
                          <tr
                            key={stock.id}
                            onClick={() => {
                              setActiveStockId(stock.id);
                            }}
                            className={`transition-colors cursor-pointer ${
                              isActive
                                ? 'bg-teal-500/15 border-l-4 border-teal-400'
                                : isSelected
                                ? 'hover:bg-slate-800/50 bg-slate-900/40'
                                : 'hover:bg-slate-800/30 opacity-60'
                            }`}
                          >
                            {/* Checkbox */}
                            <td
                              className="p-3 text-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleSelectId(stock.id);
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectId(stock.id)}
                                className="w-4 h-4 rounded border-slate-700 text-teal-500 focus:ring-0 cursor-pointer"
                              />
                            </td>

                            {/* Name & Code */}
                            <td className="p-3">
                              <div className="font-black text-white text-sm tracking-wide">{stock.name}</div>
                              <div className="text-xs font-mono flex items-center flex-wrap gap-2 mt-1">
                                <span className="px-2 py-0.5 rounded-md bg-slate-800 text-teal-300 border border-teal-500/30 font-black tracking-wide text-xs shadow-xs">
                                  {stock.code ? stock.code : 'KODSUZ'}
                                </span>
                                {stock.barcode && (
                                  <span className="px-2 py-0.5 rounded-md bg-slate-800/90 text-amber-300 border border-slate-700 font-bold text-[11px]">
                                    Barkod: {stock.barcode}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Current Sales */}
                            <td className="p-3 text-right font-mono font-bold text-slate-300 text-sm">
                              ₺{oldSales.toFixed(2)}
                            </td>

                            {/* New Sales Input */}
                            <td className="p-3 text-right" onClick={() => setActiveField('salesPrice')}>
                              <div
                                className={`flex items-center justify-end px-3 py-1.5 rounded-xl border font-mono font-black text-sm transition shadow-sm ${
                                  isActive && activeField === 'salesPrice'
                                    ? 'bg-teal-500/20 border-teal-400 text-teal-300 ring-2 ring-teal-500/30'
                                    : 'bg-slate-900 border-slate-700 text-white hover:border-slate-500'
                                }`}
                              >
                                <span className="text-xs text-slate-400 mr-1.5 font-bold">₺</span>
                                <input
                                  type="number"
                                  step="any"
                                  value={current.salesPrice}
                                  onChange={(e) =>
                                    handleDirectPriceChange(stock.id, 'salesPrice', e.target.value)
                                  }
                                  onFocus={() => {
                                    setActiveStockId(stock.id);
                                    setActiveField('salesPrice');
                                  }}
                                  className="w-24 bg-transparent text-right outline-none font-black text-white"
                                />
                              </div>
                            </td>

                            {/* New Purchase Input */}
                            <td className="p-3 text-right" onClick={() => setActiveField('purchasePrice')}>
                              <div
                                className={`flex items-center justify-end px-3 py-1.5 rounded-xl border font-mono font-bold text-sm transition shadow-sm ${
                                  isActive && activeField === 'purchasePrice'
                                    ? 'bg-amber-500/20 border-amber-400 text-amber-300 ring-2 ring-amber-500/30'
                                    : 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-500'
                                }`}
                              >
                                <span className="text-xs text-slate-400 mr-1.5 font-bold">₺</span>
                                <input
                                  type="number"
                                  step="any"
                                  value={current.purchasePrice}
                                  onChange={(e) =>
                                    handleDirectPriceChange(stock.id, 'purchasePrice', e.target.value)
                                  }
                                  onFocus={() => {
                                    setActiveStockId(stock.id);
                                    setActiveField('purchasePrice');
                                  }}
                                  className="w-20 bg-transparent text-right outline-none font-bold text-slate-200"
                                />
                              </div>
                            </td>

                            {/* Difference Badge */}
                            <td className="p-3 text-right font-mono">
                              {Math.abs(salesDiff) > 0.001 ? (
                                <span
                                  className={`px-2 py-1 rounded-lg text-xs font-black inline-block shadow-sm ${
                                    salesDiff > 0
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                      : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                  }`}
                                >
                                  {salesDiff > 0 ? `+₺${salesDiff.toFixed(2)}` : `₺${salesDiff.toFixed(2)}`}
                                </span>
                              ) : (
                                <span className="text-slate-500 text-xs font-bold">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RIGHT: DEDICATED NUMPAD PANEL */}
            <div className="w-full md:w-88 lg:w-96 bg-slate-900 flex flex-col justify-between shrink-0 overflow-y-auto custom-scrollbar p-3.5 space-y-3 border-l border-slate-800">
              {/* ACTIVE ITEM DETAILS */}
              <div className="p-3.5 bg-slate-950 rounded-2xl border-2 border-teal-500/40 shadow-xl space-y-2.5 shrink-0">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                    <Package size={14} className="text-teal-400" />
                    Aktif Seçili Ürün
                  </span>
                  {activeStock?.code && (
                    <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-teal-950 text-teal-300 font-black border border-teal-500/40 shadow-xs">
                      {activeStock.code}
                    </span>
                  )}
                </div>

                {activeStock ? (
                  <div className="space-y-2.5">
                    <h4 className="text-base font-black text-white leading-snug tracking-wide uppercase line-clamp-2 select-none" style={{ color: '#ffffff' }}>
                      {activeStock.name}
                    </h4>

                    {/* Old Prices Display */}
                    <div className="grid grid-cols-2 gap-2 p-2 bg-slate-900 rounded-xl border border-slate-800">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Eski Satış</span>
                        <span className="text-xs font-black font-mono text-emerald-400">
                          ₺{(activeStock.salesPrice || 0).toFixed(2)}
                        </span>
                      </div>
                      <div className="flex flex-col border-l border-slate-800 pl-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Eski Alış</span>
                        <span className="text-xs font-black font-mono text-amber-400">
                          ₺{(activeStock.purchasePrice || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Field Switcher */}
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setActiveField('salesPrice')}
                        className={`py-2 px-2.5 rounded-xl text-xs font-black text-center transition cursor-pointer flex items-center justify-center gap-1.5 border shadow-sm ${
                          activeField === 'salesPrice'
                            ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-teal-500/20'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        <DollarSign size={13} />
                        Satış Fiyatı
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveField('purchasePrice')}
                        className={`py-2 px-2.5 rounded-xl text-xs font-black text-center transition cursor-pointer flex items-center justify-center gap-1.5 border shadow-sm ${
                          activeField === 'purchasePrice'
                            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-amber-400/20'
                            : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
                        }`}
                      >
                        <DollarSign size={13} />
                        Alış Fiyatı
                      </button>
                    </div>

                    {/* Active Value Display - High Contrast */}
                    <div className={`p-2.5 rounded-xl border-2 transition-all flex items-center justify-between shadow-inner ${
                      activeField === 'salesPrice'
                        ? 'bg-slate-900 border-teal-400 ring-2 ring-teal-500/20'
                        : 'bg-slate-900 border-amber-400 ring-2 ring-amber-500/20'
                    }`}>
                      <span className={`text-[11px] font-black uppercase tracking-wider ${
                        activeField === 'salesPrice' ? 'text-teal-400' : 'text-amber-400'
                      }`}>
                        {activeField === 'salesPrice' ? 'YENİ SATIŞ:' : 'YENİ ALIŞ:'}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-sm font-black ${
                          activeField === 'salesPrice' ? 'text-teal-400' : 'text-amber-400'
                        }`}>
                          ₺
                        </span>
                        <span className="text-xl font-black font-mono text-white tracking-tight">
                          {numpadBuffer || '0.00'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 py-3 text-center font-bold">
                    Lütfen listeden bir ürün seçin.
                  </div>
                )}
              </div>

              {/* QUICK +/- BUTTONS FOR ACTIVE ITEM */}
              <div className="grid grid-cols-4 gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => handleQuickAdjustActive(5, true)}
                  className="py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-xs font-black transition cursor-pointer border border-emerald-500/40 shadow-xs"
                >
                  +%5
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdjustActive(10, true)}
                  className="py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 rounded-lg text-xs font-black transition cursor-pointer border border-emerald-500/40 shadow-xs"
                >
                  +%10
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdjustActive(-5, true)}
                  className="py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-xs font-black transition cursor-pointer border border-rose-500/40 shadow-xs"
                >
                  -%5
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickAdjustActive(-10, true)}
                  className="py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded-lg text-xs font-black transition cursor-pointer border border-rose-500/40 shadow-xs"
                >
                  -%10
                </button>
              </div>

              {/* TOUCH NUMPAD GRID - HIGH CONTRAST CLEAR NUMBERS */}
              <div className="grid grid-cols-3 gap-2 shrink-0">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', '00'].map((btn) => (
                  <button
                    key={btn}
                    type="button"
                    onClick={() => handleNumpadNumber(btn)}
                    className="h-11 sm:h-12 bg-slate-800 hover:bg-teal-500 hover:text-slate-950 active:scale-95 text-white text-lg sm:text-xl font-black font-mono rounded-xl border-2 border-slate-600 hover:border-teal-400 transition-all cursor-pointer flex items-center justify-center shadow-md select-none touch-manipulation"
                  >
                    {btn}
                  </button>
                ))}
              </div>

              {/* NUMPAD CONTROL BUTTONS (BACKSPACE, CLEAR, NAVIGATE) */}
              <div className="grid grid-cols-4 gap-1.5 shrink-0 pt-1">
                <button
                  type="button"
                  onClick={handleNumpadBackspace}
                  className="h-11 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl font-black flex items-center justify-center transition cursor-pointer border-2 border-amber-500/40 shadow-sm"
                  title="Geri Sil"
                >
                  <Delete size={19} />
                </button>
                <button
                  type="button"
                  onClick={handleNumpadClear}
                  className="h-11 bg-rose-500/25 hover:bg-rose-500/35 text-rose-300 rounded-xl text-sm font-black flex items-center justify-center transition cursor-pointer border-2 border-rose-500/40 shadow-sm"
                  title="Temizle"
                >
                  C
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('up')}
                  className="h-11 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center justify-center transition cursor-pointer border-2 border-slate-600 shadow-sm"
                  title="Önceki Ürüne Geç"
                >
                  <ChevronUp size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => handleNavigate('down')}
                  className="h-11 bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 rounded-xl font-bold flex items-center justify-center transition cursor-pointer border-2 border-teal-500/40 shadow-sm"
                  title="Sonraki Ürüne Geç"
                >
                  <ChevronDown size={20} />
                </button>
              </div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-4 shrink-0">
            <div className="text-xs text-slate-300 font-medium">
              Toplam <strong className="text-teal-300 font-bold">{changedStocks.length}</strong> ürünün fiyatı değiştirildi.
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isUpdating}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer border border-slate-700"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={handleCommitUpdates}
                disabled={isUpdating || changedStocks.length === 0}
                className="px-6 py-2.5 bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl text-xs font-black transition flex items-center gap-2 shadow-lg shadow-teal-500/25 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Kaydediliyor...</span>
                  </>
                ) : updateSuccess ? (
                  <>
                    <Check size={16} className="text-emerald-950" />
                    <span>{updatedCount} Ürün Güncellendi!</span>
                  </>
                ) : (
                  <>
                    <Check size={16} />
                    <span>Değişiklikleri Kaydet ({changedStocks.length})</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
