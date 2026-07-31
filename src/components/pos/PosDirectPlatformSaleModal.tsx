import React, { useState, useEffect } from 'react';
import { PosPlatformConfig, PosCartItem, PosPaymentSplit } from '../../types/pos';
import { ShoppingBag, Calculator, CheckCircle2, Percent, DollarSign, X, AlertCircle } from 'lucide-react';

interface PosDirectPlatformSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  platform: PosPlatformConfig | null;
  cartItems: PosCartItem[];
  cartGrandTotal: number;
  onConfirmSale: (saleData: {
    amount: number;
    commissionRate: number;
    commissionAmount: number;
    netAmount: number;
    useCartItems: boolean;
    note: string;
    platformName: string;
  }) => void;
}

export const PosDirectPlatformSaleModal: React.FC<PosDirectPlatformSaleModalProps> = ({
  isOpen,
  onClose,
  platform,
  cartItems = [],
  cartGrandTotal,
  onConfirmSale,
}) => {
  const safeCartItems = Array.isArray(cartItems) ? cartItems : [];
  const [saleAmount, setSaleAmount] = useState<number | string>('');
  const [customCommissionRate, setCustomCommissionRate] = useState<number>(15);
  const [orderNote, setOrderNote] = useState<string>('');
  const [useCartItems, setUseCartItems] = useState<boolean>(false);

  useEffect(() => {
    if (platform) {
      setCustomCommissionRate(platform.commissionRate);
      setOrderNote(`${platform.name} Online Sipariş`);

      if (safeCartItems.length > 0) {
        setUseCartItems(true);
        setSaleAmount(cartGrandTotal);
      } else {
        setUseCartItems(false);
        setSaleAmount('');
      }
    }
  }, [platform, safeCartItems, cartGrandTotal, isOpen]);

  if (!isOpen || !platform) return null;

  const currentAmount = typeof saleAmount === 'number' ? saleAmount : Number(saleAmount) || 0;
  const commissionAmount = (currentAmount * customCommissionRate) / 100;
  const netAmount = currentAmount - commissionAmount;

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentAmount <= 0) return;

    onConfirmSale({
      amount: currentAmount,
      commissionRate: customCommissionRate,
      commissionAmount,
      netAmount,
      useCartItems: useCartItems && safeCartItems.length > 0,
      note: orderNote,
      platformName: platform.name,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border-2 border-teal-500/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100">
        {/* HEADER */}
        <div className={`p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${platform.bgColor}`}>
              {platform.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-white">{platform.name}</h3>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black border ${platform.badgeColor}`}>
                  %{customCommissionRate} Komisyon
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Online Platform Hızlı Satış Ekranı</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X size={22} />
          </button>
        </div>

        {/* FORM BODY */}
        <form onSubmit={handleConfirm} className="p-4 space-y-4">
          {/* SEPET SEÇENEĞİ (EĞER SEPETTE ÜRÜN VARSA) */}
          {safeCartItems.length > 0 && (
            <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800 space-y-2">
              <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                <ShoppingBag size={15} /> Sepet Algılandı ({safeCartItems.length} Kalem Ürün)
              </span>
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setUseCartItems(true);
                    setSaleAmount(cartGrandTotal);
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                    useCartItems
                      ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-md'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  Sepetteki Ürünlerle Sat (%{customCommissionRate})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUseCartItems(false);
                    setSaleAmount('');
                  }}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer border ${
                    !useCartItems
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                      : 'bg-slate-900 text-slate-300 border-slate-700 hover:text-white'
                  }`}
                >
                  Serbest Tutar Gir
                </button>
              </div>
            </div>
          )}

          {/* SİPARİŞ TUTARI GİRDİSİ */}
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center justify-between">
              <span>Sipariş / Fiş Tutarı (₺)</span>
              {useCartItems && (
                <span className="text-[11px] text-teal-400 font-mono font-bold">
                  (Sepetten Alındı)
                </span>
              )}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-teal-400 font-black text-lg">
                ₺
              </div>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                readOnly={useCartItems}
                value={saleAmount}
                onChange={(e) => setSaleAmount(e.target.value)}
                placeholder="Örn: 350.00"
                className={`w-full pl-10 pr-4 py-3 bg-slate-950 border-2 ${
                  useCartItems ? 'border-teal-500/50 text-teal-300' : 'border-slate-700 text-white focus:border-amber-400'
                } rounded-2xl text-xl font-mono font-black placeholder-slate-600 focus:outline-none shadow-inner`}
              />
            </div>
          </div>

          {/* ANLIK HESAPLAMA ÖZET KUTUSU */}
          <div className="p-3.5 bg-slate-950/90 rounded-2xl border-2 border-slate-800 space-y-2.5 font-mono">
            <div className="flex items-center justify-between text-xs text-slate-400 font-bold">
              <span>Brüt Sipariş Tutarı:</span>
              <span className="text-white font-black">
                ₺{currentAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-amber-400 font-bold pt-1 border-t border-slate-800">
              <div className="flex items-center gap-1">
                <span>Platform Komisyonu:</span>
                <div className="flex items-center bg-slate-900 border border-slate-700 px-1.5 py-0.5 rounded text-[11px]">
                  <span>%</span>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={customCommissionRate}
                    onChange={(e) => setCustomCommissionRate(Number(e.target.value) || 0)}
                    className="w-10 bg-transparent text-amber-300 font-bold focus:outline-none text-center"
                  />
                </div>
              </div>
              <span className="font-black text-amber-300">
                -₺{commissionAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm text-teal-300 font-black pt-2 border-t border-slate-700/80">
              <span className="uppercase text-xs tracking-wider text-slate-300">Hesaba Geçecek Net Tutar:</span>
              <span className="text-base text-teal-300 font-mono">
                ₺{netAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* SİPARİŞ KODU / NOTU */}
          <div className="space-y-1">
            <label className="text-xs font-black text-slate-300 uppercase tracking-wider block">
              Sipariş No / Açıklama (Opsiyonel)
            </label>
            <input
              type="text"
              value={orderNote}
              onChange={(e) => setOrderNote(e.target.value)}
              placeholder="Örn: Trendyol Sipariş #98231"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
            />
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-2xl border border-slate-700 text-slate-300 hover:text-white font-bold text-xs cursor-pointer"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={currentAmount <= 0}
              className="flex-1 py-3.5 px-4 bg-teal-500 hover:bg-teal-400 disabled:opacity-40 text-slate-950 font-black rounded-2xl text-sm shadow-xl shadow-teal-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 touch-manipulation"
            >
              <CheckCircle2 size={18} />
              <span>Satışı Tamamla ({platform.name})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
