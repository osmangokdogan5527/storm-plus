import React, { useState } from 'react';
import { PosCartItem } from '../../types/pos';
import { Trash2, Plus, Minus, AlertTriangle, X } from 'lucide-react';
import { PosNumpadModal } from './PosNumpadModal';

interface PosCartTableProps {
  items: PosCartItem[];
  selectedItemId?: string | null;
  onSelectItem?: (id: string) => void;
  onUpdateQuantity: (id: string, delta: number) => void;
  onSetQuantity: (id: string, qty: number) => void;
  onUpdateDiscount: (id: string, discountRate: number) => void;
  onUpdateUnitPrice: (id: string, unitPrice: number) => void;
  onRemoveItem: (id: string) => void;
  onClearCart: () => void;
}

export const PosCartTable: React.FC<PosCartTableProps> = ({
  items = [],
  selectedItemId,
  onSelectItem,
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
    <div className="w-full flex flex-col bg-slate-900 border-2 border-slate-700 rounded-2xl overflow-hidden shadow-2xl relative transition-all" style={{ backgroundColor: '#0f172a' }}>
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
      <div className="w-full p-2 space-y-1.5 custom-scrollbar bg-slate-900" style={{ backgroundColor: '#0f172a' }}>
        {safeItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-slate-400 py-6 space-y-1.5">
            <span className="text-2xl">🛒</span>
            <p className="text-xs font-black text-white">Sepetiniz Boş</p>
            <p className="text-[11px] text-slate-300 font-medium text-center">
              Sol taraftan ürün seçebilir veya barkod okutabilirsiniz.
            </p>
          </div>
        ) : (
          safeItems.map((item) => {
            const isSelected = selectedItemId === item.id;
            return (
            <div
              key={item.id}
              onClick={() => onSelectItem && onSelectItem(item.id)}
              className={`p-2 sm:p-2.5 rounded-xl border transition-all shadow-md space-y-1.5 group cursor-pointer ${
                isSelected 
                  ? 'bg-slate-950 border-teal-400 ring-2 ring-teal-400/40 shadow-lg shadow-teal-500/10' 
                  : 'bg-slate-950/70 border-slate-700 hover:border-teal-400/80'
              }`}
              style={{ backgroundColor: isSelected ? '#020617' : 'rgba(2, 6, 23, 0.7)' }}
            >
              {/* SATIR 1: Ürün İsmi, Kod & Silme Butonu */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-800/80 pb-1.5">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span
                    className="px-1.5 py-0.5 text-[10px] font-black font-mono border rounded shrink-0"
                    style={{ backgroundColor: 'rgba(20, 184, 166, 0.2)', color: '#2dd4bf', borderColor: 'rgba(45, 212, 191, 0.5)' }}
                  >
                    {item.stockCode || 'STK'}
                  </span>
                  <h5 className="text-xs font-black text-white truncate leading-tight">
                    {item.stockName}
                  </h5>
                </div>
                <button
                  onClick={() => handleDeleteClick(item.id)}
                  className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center shrink-0 cursor-pointer active:scale-90 touch-manipulation"
                  title="Satırı Sil"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              {/* SATIR 2: Birim Fiyat, Miktar (Adet) & Net Tutar */}
              <div className="flex items-center justify-between gap-2">
                {/* 1. Birim Fiyat */}
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                    Fiyat:
                  </span>
                  <div className="flex items-center bg-slate-900 px-2 py-1 rounded-lg border border-slate-700 h-8 focus-within:border-teal-400 transition-colors">
                    <span className="text-xs font-black text-teal-400 font-mono mr-0.5" style={{ color: '#2dd4bf' }}>₺</span>
                    <button
                      onClick={() => setNumpadState({ isOpen: true, type: 'unitPrice', itemId: item.id, initialValue: item.unitPrice })}
                      className="pos-number-input min-w-[44px] text-left text-xs font-black font-mono text-white bg-transparent outline-none cursor-pointer hover:bg-slate-800 rounded px-1"
                      title="Birim Fiyatı Değiştir"
                      style={{ color: '#ffffff' }}
                    >
                      {item.unitPrice}
                    </button>
                  </div>
                </div>

                {/* 2. Miktar / Adet Stepper Kutusu */}
                <div className="flex items-center bg-slate-900 rounded-lg border border-slate-700 overflow-hidden h-8">
                  <button
                    onClick={() => onUpdateQuantity(item.id, -1)}
                    className="w-7 h-8 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors font-black shrink-0 cursor-pointer active:bg-slate-700 touch-manipulation"
                    title="1 Azalt"
                  >
                    <Minus size={14} />
                  </button>
                  <button
                    onClick={() => setNumpadState({ isOpen: true, type: 'quantity', itemId: item.id, initialValue: item.quantity })}
                    className="pos-number-input w-9 text-center text-xs font-black font-mono text-white bg-transparent outline-none cursor-pointer hover:bg-slate-800 h-8"
                    title="Adet Gir"
                    style={{ color: '#ffffff' }}
                  >
                    {item.quantity}
                  </button>
                  <button
                    onClick={() => onUpdateQuantity(item.id, 1)}
                    className="w-7 h-8 flex items-center justify-center text-slate-300 hover:text-white hover:bg-slate-800 transition-colors font-black shrink-0 cursor-pointer active:bg-slate-700 touch-manipulation"
                    title="1 Arttır"
                  >
                    <Plus size={14} />
                  </button>
                </div>

                {/* 3. Satır Toplam Tutar */}
                <div className="flex items-center gap-1 text-right shrink-0">
                  <span className="text-[10px] font-bold text-slate-400">
                    Tutar:
                  </span>
                  <span className="text-xs sm:text-sm font-black text-teal-300 font-mono tracking-tight" style={{ color: '#2dd4bf' }}>
                    ₺{item.totalLine.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
};
