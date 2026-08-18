import React, { useState } from 'react';
import { PosCartItem } from '../../types/pos';
import { 
  DollarSign, 
  CreditCard, 
  Zap, 
  Clock, 
  Delete, 
  Check, 
  Sparkles,
  Wallet
} from 'lucide-react';

interface PosNumpadControlPanelProps {
  cartItems: PosCartItem[];
  selectedItemId?: string | null;
  grandTotal: number;
  onSetQuantity: (id: string, qty: number) => void;
  onUpdateUnitPrice: (id: string, price: number) => void;
  onSetDiscountVal: (val: number | string) => void;
  onSetDiscountMode: (mode: 'percent' | 'amount' | 'target' | 'markup_percent' | 'markup_amount') => void;
  onQuickCashSale: (receivedAmount?: number) => void;
  onQuickPosSale: () => void;
  onOpenSplitPayment: () => void;
  onParkSale: () => void;
  isProcessing?: boolean;
}

export const PosNumpadControlPanel: React.FC<PosNumpadControlPanelProps> = ({
  cartItems = [],
  grandTotal = 0,
  onSetDiscountVal,
  onSetDiscountMode,
  onQuickCashSale,
  onQuickPosSale,
  onOpenSplitPayment,
  onParkSale,
  isProcessing = false
}) => {
  const [typedValue, setTypedValue] = useState<string>('');

  const handleKeyPress = (key: string) => {
    if (key === 'C') {
      setTypedValue('');
      return;
    }

    if (key === 'BACKSPACE') {
      setTypedValue(prev => prev.slice(0, -1));
      return;
    }

    if (key === '.') {
      if (!typedValue.includes('.')) {
        setTypedValue(prev => (prev === '' ? '0.' : prev + '.'));
      }
      return;
    }

    if (key === '00') {
      if (typedValue !== '' && typedValue !== '0') {
        setTypedValue(prev => prev + '00');
      }
      return;
    }

    // Number input
    if (typedValue === '0' && key !== '.') {
      setTypedValue(key);
    } else {
      setTypedValue(prev => (prev.length < 10 ? prev + key : prev));
    }
  };

  const handleQuickPreset = (preset: number, isDirectSet: boolean = true) => {
    if (isDirectSet) {
      setTypedValue(String(preset));
    } else {
      const current = parseFloat(typedValue) || 0;
      setTypedValue(String(current + preset));
    }
  };

  const currentNum = parseFloat(typedValue) || 0;
  const hasInput = typedValue !== '' && !isNaN(currentNum) && currentNum > 0;
  
  // Otomatik İskonto / Para Üstü Hesabı
  const isDiscount = hasInput && currentNum < grandTotal;
  const autoDiscountAmount = isDiscount ? grandTotal - currentNum : 0;
  const cashChange = hasInput && currentNum >= grandTotal ? currentNum - grandTotal : 0;

  // Nakit Satış ve Otomatik İskonto Uygulama
  const handleApplyCashSale = () => {
    if (cartItems.length === 0 || isProcessing) return;

    if (hasInput) {
      if (isDiscount) {
        // Alınan tutar toplamdan azsa (Örn: 500 TL yerine 490 TL verildiyse kalan 10 TL otomatik iskonto yapılır)
        onSetDiscountMode('target');
        onSetDiscountVal(currentNum);
        onQuickCashSale(currentNum);
      } else {
        // Alınan tutar eşit veya fazlaysa para üstü hesaplanarak nakit satış yapılır
        onQuickCashSale(currentNum);
      }
      setTypedValue('');
    } else {
      // Değer girilmediyse doğrudan tam tutarla nakit satış
      onQuickCashSale();
    }
  };

  return (
    <div className="flex flex-col bg-slate-900 border-2 border-slate-700/90 rounded-2xl p-3 shadow-2xl space-y-2.5" style={{ backgroundColor: '#0f172a' }}>
      
      {/* 1. DİJİTAL EKRAN / ALINAN TUTAR VE OTOMATİK İSKONTO / PARA ÜSTÜ */}
      <div className="bg-slate-950 border-2 border-teal-500/40 rounded-xl p-2.5 flex flex-col justify-between shadow-inner h-[80px] relative overflow-hidden">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 border-b border-slate-800 pb-1">
          <span className="flex items-center gap-1.5 text-teal-300 uppercase tracking-wider font-black">
            <Wallet size={13} className="text-teal-400" />
            Alınan Nakit Tutar
          </span>
          <span className="text-slate-400 font-mono text-[10px] font-bold">
            ₺ TRY
          </span>
        </div>

        <div className="flex items-baseline justify-between pt-1 gap-2">
          {/* Otomatik İskonto veya Para Üstü Rozeti */}
          <div className="flex items-center gap-1.5 text-xs font-mono font-black min-w-0">
            {isDiscount ? (
              <span className="text-amber-300 bg-amber-950/90 px-2 py-0.5 rounded border border-amber-500/60 flex items-center gap-1 animate-pulse">
                <Sparkles size={11} className="text-amber-400 shrink-0" />
                <span>Oto İskonto: -₺{autoDiscountAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </span>
            ) : cashChange > 0 ? (
              <span className="text-emerald-300 bg-emerald-950/90 px-2 py-0.5 rounded border border-emerald-500/60">
                Para Üstü: ₺{cashChange.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            ) : (
              <span className="text-slate-400 text-[11px] font-medium">
                Ödenecek: ₺{grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            )}
          </div>

          {/* Girilen Değer */}
          <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-right ml-auto text-teal-300 shrink-0" style={{ color: '#2dd4bf' }}>
            ₺{typedValue || '0'}
          </div>
        </div>
      </div>

      {/* 2. HIZLI DEĞER BUTONLARI (PRESETS) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 custom-scrollbar">
        <button
          type="button"
          onClick={() => handleQuickPreset(grandTotal, true)}
          className="flex-1 min-w-[54px] py-1.5 bg-teal-950/80 hover:bg-teal-900 text-teal-300 font-mono font-black text-xs rounded-lg border border-teal-500/50 active:scale-95 transition-all touch-manipulation cursor-pointer text-center"
          title="Tam Tutar"
        >
          Tam (₺{grandTotal > 0 ? grandTotal.toFixed(0) : '0'})
        </button>
        {[50, 100, 200, 500].map(preset => (
          <button
            key={preset}
            type="button"
            onClick={() => handleQuickPreset(preset, true)}
            className="flex-1 min-w-[44px] py-1.5 bg-emerald-950/70 hover:bg-emerald-900 text-emerald-300 font-mono font-black text-xs rounded-lg border border-emerald-500/40 active:scale-95 transition-all touch-manipulation cursor-pointer text-center"
          >
            ₺{preset}
          </button>
        ))}
      </div>

      {/* 3. BÜYÜK DOKUNMATİK SAYISAL TUŞ TAKIMI (NUMPAD GRID) */}
      <div className="grid grid-cols-4 gap-2">
        {/* Satır 1 */}
        <button
          type="button"
          onClick={() => handleKeyPress('7')}
          className="h-12 sm:h-13 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-mono font-black text-xl rounded-xl border border-slate-700 shadow flex items-center justify-center cursor-pointer active:scale-95 touch-manipulation"
        >
          7
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('8')}
          className="h-12 sm:h-13 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-mono font-black text-xl rounded-xl border border-slate-700 shadow flex items-center justify-center cursor-pointer active:scale-95 touch-manipulation"
        >
          8
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('9')}
          className="h-12 sm:h-13 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-mono font-black text-xl rounded-xl border border-slate-700 shadow flex items-center justify-center cursor-pointer active:scale-95 touch-manipulation"
        >
          9
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('BACKSPACE')}
          className="h-12 sm:h-13 bg-slate-800 hover:bg-rose-950/80 text-rose-400 font-black text-sm rounded-xl border border-rose-500/40 shadow flex items-center justify-center cursor-pointer active:scale-95 touch-manipulation"
          title="Geri Sil"
        >
          <Delete size={20} />
        </button>

        {/* Satır 2 */}
        <button
          type="button"
          onClick={() => handleKeyPress('4')}
          className="h-12 sm:h-13 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-mono font-black text-xl rounded-xl border border-slate-700 shadow flex items-center justify-center cursor-pointer active:scale-95 touch-manipulation"
        >
          4
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('5')}
          className="h-12 sm:h-13 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-mono font-black text-xl rounded-xl border border-slate-700 shadow flex items-center justify-center cursor-pointer active:scale-95 touch-manipulation"
        >
          5
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('6')}
          className="h-12 sm:h-13 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-mono font-black text-xl rounded-xl border border-slate-700 shadow flex items-center justify-center cursor-pointer active:scale-95 touch-manipulation"
        >
          6
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('C')}
          className="h-12 sm:h-13 bg-slate-800 hover:bg-rose-950/80 text-rose-300 font-black text-sm rounded-xl border border-rose-500/40 shadow flex items-center justify-center cursor-pointer active:scale-95 touch-manipulation"
          title="Temizle"
        >
          TEMİZLE
        </button>

        {/* Satır 3 */}
        <button
          type="button"
          onClick={() => handleKeyPress('1')}
          className="h-12 sm:h-13 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-mono font-black text-xl rounded-xl border border-slate-700 shadow flex items-center justify-center cursor-pointer active:scale-95 touch-manipulation"
        >
          1
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('2')}
          className="h-12 sm:h-13 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-mono font-black text-xl rounded-xl border border-slate-700 shadow flex items-center justify-center cursor-pointer active:scale-95 touch-manipulation"
        >
          2
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('3')}
          className="h-12 sm:h-13 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-mono font-black text-xl rounded-xl border border-slate-700 shadow flex items-center justify-center cursor-pointer active:scale-95 touch-manipulation"
        >
          3
        </button>
        <button
          type="button"
          onClick={handleApplyCashSale}
          disabled={cartItems.length === 0 || isProcessing}
          className="row-span-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-500/30 flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 touch-manipulation border-2 border-emerald-300"
          title="Nakit Tahsilatı Onayla"
        >
          <Check size={24} className="stroke-[3]" />
          <span className="text-[11px] font-black uppercase text-center leading-tight">
            {isDiscount ? 'İSKONTO & NAKİT' : 'NAKİT ONAY'}
          </span>
        </button>

        {/* Satır 4 */}
        <button
          type="button"
          onClick={() => handleKeyPress('0')}
          className="h-12 sm:h-13 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-mono font-black text-xl rounded-xl border border-slate-700 shadow flex items-center justify-center cursor-pointer active:scale-95 touch-manipulation"
        >
          0
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('00')}
          className="h-12 sm:h-13 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-mono font-black text-base rounded-xl border border-slate-700 shadow flex items-center justify-center cursor-pointer active:scale-95 touch-manipulation"
        >
          00
        </button>
        <button
          type="button"
          onClick={() => handleKeyPress('.')}
          className="h-12 sm:h-13 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-white font-mono font-black text-xl rounded-xl border border-slate-700 shadow flex items-center justify-center cursor-pointer active:scale-95 touch-manipulation"
        >
          ,
        </button>
      </div>

      {/* 4. DOĞRUDAN DOKUNMATİK ÖDEME BUTONLARI (TOUCH ACTIONS) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-800">
        <button
          type="button"
          disabled={cartItems.length === 0 || isProcessing}
          onClick={handleApplyCashSale}
          className="py-3 px-2 bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-emerald-500/30 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 touch-manipulation border-2 border-emerald-300"
        >
          <DollarSign size={18} className="shrink-0 stroke-[2.5]" />
          <span className="text-center font-black">NAKİT SATIŞ</span>
        </button>

        <button
          type="button"
          disabled={cartItems.length === 0 || isProcessing}
          onClick={onQuickPosSale}
          className="py-3 px-2 bg-blue-500 hover:bg-blue-400 disabled:opacity-40 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-blue-500/30 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 touch-manipulation border-2 border-blue-300"
        >
          <CreditCard size={18} className="shrink-0 stroke-[2.5]" />
          <span className="text-center font-black">POS KART</span>
        </button>

        <button
          type="button"
          disabled={cartItems.length === 0 || isProcessing}
          onClick={onOpenSplitPayment}
          className="py-3 px-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-black rounded-xl text-xs shadow-lg shadow-purple-600/30 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 touch-manipulation border-2 border-purple-400"
        >
          <Zap size={16} className="shrink-0" />
          <span className="text-center font-black">PARÇALI</span>
        </button>

        <button
          type="button"
          disabled={cartItems.length === 0 || isProcessing}
          onClick={onParkSale}
          className="py-3 px-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-all flex flex-col items-center justify-center gap-1 cursor-pointer active:scale-95 touch-manipulation border-2 border-amber-300"
        >
          <Clock size={16} className="shrink-0" />
          <span className="text-center font-black">ASKIYA AL</span>
        </button>
      </div>
    </div>
  );
};
