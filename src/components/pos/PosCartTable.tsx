import React, { useState } from 'react';
import { PosCartItem } from '../../types/pos';
import { Trash2, Plus, Minus, AlertTriangle, X } from 'lucide-react';
import { PosNumpadModal } from './PosNumpadModal';

interface PosCartTableProps {
  items: PosCartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onSetQuantity: (id: string, qty: number) => void;
  onUpdateDiscount: (id: string, discountRate: number) => void;
  onUpdateUnitPrice: (id: string, unitPrice: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export const PosCartTable: React.FC<PosCartTableProps> = ({
  items = [],
  onUpdateQuantity,
  onSetQuantity,
  onUpdateDiscount,
  onUpdateUnitPrice,
  onRemoveItem,
  onClearCart,
}) => {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [numpadState, setNumpadState] = useState<{ isOpen: boolean; type: 'quantity' | 'unitPrice'; itemId: string; initialValue: number } | null>(null);
  const safeItems = Array.isArray(items) ? items : [];

  const handleDeleteClick = (id: string) => {
    setDeleteConfirmId(id);
  };

  const confirmDelete = () => {
    if (deleteConfirmId) {
      onRemoveItem(deleteConfirmId);
      setDeleteConfirmId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirmId(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-[320px] bg-slate-900 border-2 border-slate-700 rounded-2xl overflow-hidden shadow-2xl relative" style={{ backgroundColor: '#0f172a' }}>
      {/* Numpad Modal */}
      {numpadState && (
        <PosNumpadModal
          isOpen={numpadState.isOpen}
          onClose={() => setNumpadState(null)}
          title={numpadState.type === 'quantity' ? 'Miktar (Adet) Giriniz' : 'Birim Fiyat Giriniz'}
          initialValue={numpadState.initialValue}
          onConfirm={(val) => {
            if (numpadState.type === 'quantity') {
              onSetQuantity(numpadState.itemId, Math.max(1, val));
            } else {
              onUpdateUnitPrice(numpadState.itemId, Math.max(0, val));
            }
          }}
          allowDecimal={numpadState.type === 'unitPrice'}
        />
      )}

      {/* Delete Confirmation Modal Overlay */}
      {deleteConfirmId && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border-2 border-slate-700 rounded-2xl p-5 shadow-2xl max-w-sm w-full animate-in fade-in zoom-in duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 className="text-lg font-black text-white mb-1">Ürünü Sil?</h3>
                <p className="text-sm font-medium text-slate-400">
                  Bu ürünü sepetten silmek istediğinize emin misiniz?
                </p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={cancelDelete}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-slate-800 hover:bg-slate-700 transition-colors"
              >
                İptal
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2.5 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)] transition-colors flex items-center gap-2"
              >
                <Trash2 size={16} />
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* BAŞLIK VE SEPETİ TEMİZLE */}
      <div className="px-4 py-3 bg-slate-900 border-b border-slate-700 flex items-center justify-between shrink-0" style={{ backgroundColor: '#0f172a' }}>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" style={{ backgroundColor: '#2dd4bf' }}></span>
          <h4 className="text-xs font-black uppercase tracking-wider text-white" style={{ color: '#ffffff' }}>
            SEPETTEKİ ÜRÜNLER <span className="text-teal-400 font-mono font-black" style={{ color: '#2dd4bf' }}>({safeItems.reduce((acc, i) => acc + (i?.quantity || 0), 0)})</span>
          </h4>
        </div>
        {safeItems.length > 0 && (
          <button
            onClick={onClearCart}
            className="text-xs font-black text-red-400 hover:text-red-300 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
            style={{ color: '#f87171' }}
          >
            <Trash2 size={14} />
            Sepeti Temizle
          </button>
        )}
      </div>

      {/* SEPET LİSTESİ */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 custom-scrollbar bg-slate-900" style={{ backgroundColor: '#0f172a' }}>
        {safeItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 py-12 space-y-2">
            <span className="text-4xl">🛒</span>
            <p className="text-xs font-black text-white">Sepetiniz Boş</p>
            <p className="text-[11px] text-slate-300 font-medium text-center">
              Sol taraftan ürün seçebilir veya barkod okutabilirsiniz.
            </p>
          </div>
        ) : (
          safeItems.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-2xl bg-slate-900 border-2 border-slate-700 hover:border-teal-400 transition-all shadow-xl space-y-2.5 group"
              style={{ backgroundColor: '#0f172a' }}
            >
              {/* SATIR 1: Ürün İsmi, Kod & Silme Butonu */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span
                    className="px-2 py-0.5 text-xs font-black font-mono border rounded-md shrink-0"
                    style={{ backgroundColor: 'rgba(20, 184, 166, 0.25)', color: '#2dd4bf', borderColor: 'rgba(45, 212, 191, 0.6)' }}
                  >
                    {item.stockCode || 'STK'}
                  </span>
                  <h5 className="text-xs sm:text-sm font-black text-white truncate leading-snug">
                    {item.stockName}
                  </h5>
                </div>
                <button
                  onClick={() => handleDeleteClick(item.id)}
                  className="w-9 h-9 rounded-xl text-slate-300 hover:text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center shrink-0 cursor-pointer active:scale-90 touch-manipulation"
                  title="Satırı Sil"
                >
                  <Trash2 size={18} />
                </button>
              </div>

              {/* SATIR 2: Birim Fiyat, Miktar (Adet) & Net Tutar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                {/* 1. Birim Fiyat Kutusu */}
                <div className="flex flex-col gap-1">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Birim Fiyat
                  </span>
                  <div className="flex items-center bg-slate-950 px-3 py-2 rounded-xl border border-slate-700 focus-within:border-teal-400 transition-colors">
                    <span className="text-sm font-black text-teal-400 font-mono mr-1" style={{ color: '#2dd4bf' }}>₺</span>
                    <button
                      onClick={() => setNumpadState({ isOpen: true, type: 'unitPrice', itemId: item.id, initialValue: item.unitPrice })}
                      className="pos-number-input w-22 text-left px-2 text-xs sm:text-sm font-black font-mono text-white bg-transparent outline-none cursor-pointer hover:bg-slate-800 rounded"
                      title="Birim Fiyat"
                      style={{ color: '#ffffff' }}
                    >
                      {item.unitPrice}
                    </button>
                  </div>
                </div>

                {/* 2. Miktar / Adet Stepper Kutusu */}
                <div className="flex flex-col gap-1 items-center">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block text-center">
                    Miktar (Adet)
                  </span>
                  <div className="flex items-center bg-slate-950 rounded-xl border border-slate-700 overflow-hidden">
                    <button
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="w-10 h-10 flex items-center justify-center text-white hover:bg-slate-800 transition-colors font-black shrink-0 cursor-pointer active:bg-slate-700 active:scale-95 touch-manipulation"
                      title="1 Azalt"
                    >
                      <Minus size={18} />
                    </button>
                    <button
                      onClick={() => setNumpadState({ isOpen: true, type: 'quantity', itemId: item.id, initialValue: item.quantity })}
                      className="pos-number-input w-12 text-center text-sm font-black font-mono text-white bg-transparent outline-none cursor-pointer hover:bg-slate-800 rounded h-10"
                      title="Adet"
                      style={{ color: '#ffffff' }}
                    >
                      {item.quantity}
                    </button>
                    <button
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="w-10 h-10 flex items-center justify-center text-white hover:bg-slate-800 transition-colors font-black shrink-0 cursor-pointer active:bg-slate-700 active:scale-95 touch-manipulation"
                      title="1 Arttır"
                    >
                      <Plus size={18} />
                    </button>
                  </div>
                </div>

                {/* 3. Satır Toplam Tutar */}
                <div className="flex flex-col gap-1 text-right min-w-[90px]">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                    Tutar
                  </span>
                  <span className="text-sm sm:text-base font-black text-teal-300 font-mono tracking-tight" style={{ color: '#2dd4bf' }}>
                    ₺{item.totalLine.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
