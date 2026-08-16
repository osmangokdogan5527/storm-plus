import React, { useState, useEffect } from 'react';
import { PosPlatformConfig, PosCartItem, PosPaymentSplit } from '../../types/pos';
import { ShoppingBag, Calculator, CheckCircle2, Percent, DollarSign, X, AlertCircle, Delete } from 'lucide-react';

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
  const [customCommissionRate, setCustomCommissionRate] = useState<number>(38);
  const [orderNote, setOrderNote] = useState<string>('');
  const [useCartItems, setUseCartItems] = useState<boolean>(false);
  const [showNumpad, setShowNumpad] = useState<boolean>(true);

  useEffect(() => {
    if (platform) {
      setCustomCommissionRate(typeof platform.commissionRate === 'number' ? platform.commissionRate : 38);
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

  const handleNumpadPress = (key: string) => {
    if (useCartItems) {
      setUseCartItems(false);
    }

    setSaleAmount((prevStr) => {
      const current = String(prevStr || '');
      if (key === 'C') {
        return '';
      }
      if (key === 'BACKSPACE') {
        return current.slice(0, -1);
      }
      if (key === '.' || key === ',') {
        if (current.includes('.')) return current;
        return current === '' ? '0.' : current + '.';
      }
      if (key === '00') {
        if (current === '' || current === '0') return '0';
        return current + '00';
      }
      if (current === '0') {
        return key;
      }
      return current + key;
    });
  };

  const handleQuickAdd = (addVal: number) => {
    if (useCartItems) {
      setUseCartItems(false);
    }
    const currentNum = Number(saleAmount) || 0;
    const newNum = currentNum + addVal;
    setSaleAmount(Number.isInteger(newNum) ? String(newNum) : Number(newNum.toFixed(2)));
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md bg-slate-900 border-2 border-teal-500/60 rounded-3xl shadow-2xl overflow-hidden flex flex-col text-slate-100 max-h-[95vh]">
        {/* HEADER */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl shadow-lg ${platform.bgColor}`}>
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
        <form onSubmit={handleConfirm} className="p-4 space-y-3.5 overflow-y-auto custom-scrollbar">
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
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <span>Sipariş / Fiş Tutarı (₺)</span>
                {useCartItems && (
                  <span className="text-[11px] text-teal-400 font-mono font-bold">
                    (Sepetten Alındı)
                  </span>
                )}
              </label>

              <button
                type="button"
                onClick={() => setShowNumpad(!showNumpad)}
                className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-slate-700 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
              >
                <Calculator size={13} />
                <span>Numpad {showNumpad ? 'Kapat' : 'Aç'}</span>
              </button>
            </div>

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
                onChange={(e) => {
                  if (useCartItems) setUseCartItems(false);
                  setSaleAmount(e.target.value);
                }}
                placeholder="Örn: 350.00"
                className={`w-full pl-10 pr-4 py-2.5 bg-slate-950 border-2 ${
                  useCartItems ? 'border-teal-500/50 text-teal-300' : 'border-slate-700 text-white focus:border-teal-400'
                } rounded-2xl text-xl font-mono font-black placeholder-slate-600 focus:outline-none shadow-inner`}
              />
            </div>
          </div>

          {/* TOUCH NUMPAD */}
          {showNumpad && (
            <div className="p-3 bg-slate-950/90 rounded-2xl border border-slate-800/80 space-y-2 animate-fadeIn">
              {/* Quick Add Buttons */}
              <div className="grid grid-cols-5 gap-1.5">
                {[10, 50, 100, 200, 500].map((amount) => (
                  <button
                    key={amount}
                    type="button"
                    onClick={() => handleQuickAdd(amount)}
                    className="py-1.5 bg-slate-900 hover:bg-teal-500/20 hover:border-teal-400/50 text-teal-300 font-mono text-xs font-black rounded-xl border border-slate-800 transition-all cursor-pointer active:scale-95 touch-manipulation"
                  >
                    +{amount}₺
                  </button>
                ))}
              </div>

              {/* Numpad Keypad Grid */}
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {/* Row 1 */}
                <button
                  type="button"
                  onClick={() => handleNumpadPress('7')}
                  className="h-11 bg-slate-900 hover:bg-slate-800 text-white font-mono text-lg font-black rounded-xl border border-slate-800 hover:border-teal-400/40 transition-all active:scale-95 touch-manipulation cursor-pointer"
                >
                  7
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadPress('8')}
                  className="h-11 bg-slate-900 hover:bg-slate-800 text-white font-mono text-lg font-black rounded-xl border border-slate-800 hover:border-teal-400/40 transition-all active:scale-95 touch-manipulation cursor-pointer"
                >
                  8
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadPress('9')}
                  className="h-11 bg-slate-900 hover:bg-slate-800 text-white font-mono text-lg font-black rounded-xl border border-slate-800 hover:border-teal-400/40 transition-all active:scale-95 touch-manipulation cursor-pointer"
                >
                  9
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadPress('BACKSPACE')}
                  className="h-11 bg-slate-900 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 rounded-xl border border-slate-800 hover:border-rose-500/40 transition-all active:scale-95 touch-manipulation flex items-center justify-center cursor-pointer"
                  title="Sil (Backspace)"
                >
                  <Delete size={20} />
                </button>

                {/* Row 2 */}
                <button
                  type="button"
                  onClick={() => handleNumpadPress('4')}
                  className="h-11 bg-slate-900 hover:bg-slate-800 text-white font-mono text-lg font-black rounded-xl border border-slate-800 hover:border-teal-400/40 transition-all active:scale-95 touch-manipulation cursor-pointer"
                >
                  4
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadPress('5')}
                  className="h-11 bg-slate-900 hover:bg-slate-800 text-white font-mono text-lg font-black rounded-xl border border-slate-800 hover:border-teal-400/40 transition-all active:scale-95 touch-manipulation cursor-pointer"
                >
                  5
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadPress('6')}
                  className="h-11 bg-slate-900 hover:bg-slate-800 text-white font-mono text-lg font-black rounded-xl border border-slate-800 hover:border-teal-400/40 transition-all active:scale-95 touch-manipulation cursor-pointer"
                >
                  6
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadPress('C')}
                  className="h-11 bg-slate-900 hover:bg-amber-950/40 text-amber-400 font-extrabold text-xs rounded-xl border border-slate-800 hover:border-amber-500/40 transition-all active:scale-95 touch-manipulation flex items-center justify-center cursor-pointer uppercase tracking-wider"
                  title="Temizle"
                >
                  C
                </button>

                {/* Row 3 */}
                <button
                  type="button"
                  onClick={() => handleNumpadPress('1')}
                  className="h-11 bg-slate-900 hover:bg-slate-800 text-white font-mono text-lg font-black rounded-xl border border-slate-800 hover:border-teal-400/40 transition-all active:scale-95 touch-manipulation cursor-pointer"
                >
                  1
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadPress('2')}
                  className="h-11 bg-slate-900 hover:bg-slate-800 text-white font-mono text-lg font-black rounded-xl border border-slate-800 hover:border-teal-400/40 transition-all active:scale-95 touch-manipulation cursor-pointer"
                >
                  2
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadPress('3')}
                  className="h-11 bg-slate-900 hover:bg-slate-800 text-white font-mono text-lg font-black rounded-xl border border-slate-800 hover:border-teal-400/40 transition-all active:scale-95 touch-manipulation cursor-pointer"
                >
                  3
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadPress('.')}
                  className="h-11 bg-slate-900 hover:bg-slate-800 text-teal-300 font-mono text-lg font-black rounded-xl border border-slate-800 hover:border-teal-400/40 transition-all active:scale-95 touch-manipulation cursor-pointer"
                >
                  ,
                </button>

                {/* Row 4 */}
                <button
                  type="button"
                  onClick={() => handleNumpadPress('0')}
                  className="col-span-2 h-11 bg-slate-900 hover:bg-slate-800 text-white font-mono text-lg font-black rounded-xl border border-slate-800 hover:border-teal-400/40 transition-all active:scale-95 touch-manipulation cursor-pointer"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={() => handleNumpadPress('00')}
                  className="col-span-2 h-11 bg-slate-900 hover:bg-slate-800 text-teal-300 font-mono text-lg font-black rounded-xl border border-slate-800 hover:border-teal-400/40 transition-all active:scale-95 touch-manipulation cursor-pointer"
                >
                  00
                </button>
              </div>
            </div>
          )}

          {/* ANLIK HESAPLAMA ÖZET KUTUSU */}
          <div className="p-3 bg-slate-950/90 rounded-2xl border-2 border-slate-800 space-y-2 font-mono">
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

            <div className="flex items-center justify-between text-sm text-teal-300 font-black pt-1.5 border-t border-slate-700/80">
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
              placeholder="Örn: Yemeksepeti Sipariş #98231"
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white placeholder-slate-500 focus:outline-none focus:border-teal-400"
            />
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-1 flex items-center justify-end gap-2">
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
