import React, { useState } from 'react';
import { PosTable } from '../../types/pos';
import { ArrowRight, ArrowLeftRight, X, Utensils, CheckCircle } from 'lucide-react';

interface PosTableTransferModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: PosTable[];
  sourceTable: PosTable | null;
  onTransferTable: (sourceTableId: string, targetTableId: string, actionType: 'move' | 'merge') => void;
}

export const PosTableTransferModal: React.FC<PosTableTransferModalProps> = ({
  isOpen,
  onClose,
  tables,
  sourceTable,
  onTransferTable,
}) => {
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  const [actionType, setActionType] = useState<'move' | 'merge'>('move');

  if (!isOpen || !sourceTable) return null;

  const sourceTotal = (sourceTable.items || []).reduce((acc, item) => acc + (item.totalLine || 0), 0);

  // Filter out source table
  const availableTables = tables.filter((t) => t.id !== sourceTable.id);

  const handleConfirm = () => {
    if (!selectedTargetId) {
      alert('Lütfen hedef masayı seçiniz.');
      return;
    }
    onTransferTable(sourceTable.id, selectedTargetId, actionType);
    onClose();
  };

  const selectedTargetTable = availableTables.find((t) => t.id === selectedTargetId);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col">
        {/* HEADER */}
        <div className="px-5 py-4 bg-slate-950 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <ArrowLeftRight size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wide">
                Masa Taşıma & Birleştirme
              </h3>
              <p className="text-xs text-slate-400">
                <span className="text-amber-400 font-bold">{sourceTable.name}</span> ({sourceTable.category}) masasını başka bir masaya aktarın
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="p-5 space-y-5">
          {/* SOURCE TABLE SUMMARY CARD */}
          <div className="bg-slate-950/80 border border-amber-500/30 rounded-xl p-3.5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center font-bold text-sm">
                <Utensils size={18} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Kaynak Masa</span>
                <span className="text-sm font-black text-white">{sourceTable.name}</span>
                <span className="text-xs text-slate-400 block font-mono">
                  {(sourceTable.items || []).length} Kalem Ürün ({sourceTable.openedAt || 'Açık'})
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-slate-400 block uppercase font-bold">Masa Tutar</span>
              <span className="text-base font-black text-amber-400">
                ₺{sourceTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* ISLEM TURU SEÇİMİ (TAŞI / BİRLEŞTİR) */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-2">İşlem Türü</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setActionType('move')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  actionType === 'move'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                    : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <ArrowRight size={14} /> Boş Masaya Taşı
                </span>
                <span className="text-[11px] opacity-80 leading-tight">
                  Kaynak masadaki tüm adisyonu seçilen boş masaya aktarır.
                </span>
              </button>

              <button
                type="button"
                onClick={() => setActionType('merge')}
                className={`p-3 rounded-xl border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  actionType === 'merge'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-1 ring-amber-500'
                    : 'bg-slate-950 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                <span className="font-bold text-xs flex items-center gap-1.5">
                  <ArrowLeftRight size={14} /> Dolu Masayla Birleştir
                </span>
                <span className="text-[11px] opacity-80 leading-tight">
                  Kaynak masa adisyonunu hedef masadaki adisyonun üzerine ekler.
                </span>
              </button>
            </div>
          </div>

          {/* TARGET TABLE SELECTION */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase mb-2">
              Hedef Masa Seçin ({actionType === 'move' ? 'Boş Masalar' : 'Tüm / Dolu Masalar'})
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-52 overflow-y-auto custom-scrollbar p-1 bg-slate-950 border border-white/10 rounded-xl">
              {availableTables
                .filter((t) => (actionType === 'move' ? t.status === 'empty' : true))
                .map((table) => {
                  const targetTotal = (table.items || []).reduce((acc, i) => acc + (i.totalLine || 0), 0);
                  const isSelected = selectedTargetId === table.id;

                  return (
                    <button
                      key={table.id}
                      onClick={() => setSelectedTargetId(table.id)}
                      className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-lg'
                          : table.status === 'empty'
                          ? 'bg-slate-900 border-emerald-500/30 text-white hover:border-emerald-400'
                          : 'bg-slate-900 border-rose-500/30 text-white hover:border-rose-400'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black truncate">{table.name}</span>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                          table.status === 'empty' 
                            ? isSelected ? 'bg-slate-950 text-emerald-400' : 'bg-emerald-500/20 text-emerald-400'
                            : isSelected ? 'bg-slate-950 text-rose-400' : 'bg-rose-500/20 text-rose-400'
                        }`}>
                          {table.status === 'empty' ? 'Boş' : 'Dolu'}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-between text-[10px]">
                        <span className={isSelected ? 'text-slate-800' : 'text-slate-400'}>{table.category}</span>
                        <span className="font-mono font-bold">
                          {table.status === 'empty' ? '₺0,00' : `₺${targetTotal.toFixed(2)}`}
                        </span>
                      </div>
                    </button>
                  );
                })}

              {availableTables.filter((t) => (actionType === 'move' ? t.status === 'empty' : true)).length === 0 && (
                <div className="col-span-full py-8 text-center text-xs text-slate-500">
                  Uygun hedef masa bulunamadı.
                </div>
              )}
            </div>
          </div>

          {/* PREVIEW SUMMARY OF COMBINED RESULT */}
          {selectedTargetTable && (
            <div className="p-3 bg-teal-500/10 border border-teal-500/30 rounded-xl text-xs text-teal-300 flex items-center justify-between">
              <div>
                <span className="font-bold block">İşlem Onay Özeti:</span>
                <span className="text-[11px] text-teal-200">
                  {sourceTable.name} ➔ {selectedTargetTable.name} ({actionType === 'move' ? 'Taşıma' : 'Birleştirme'})
                </span>
              </div>
              <div className="text-right font-mono font-black text-sm text-teal-400">
                Yeni Tutar: ₺
                {((sourceTotal + (selectedTargetTable.items || []).reduce((acc, i) => acc + i.totalLine, 0))).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          )}
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            İptal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={!selectedTargetId}
            className="px-5 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 text-xs font-black rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center gap-1.5 cursor-pointer"
          >
            <CheckCircle size={15} />
            <span>Aktarımı Tamamla</span>
          </button>
        </div>
      </div>
    </div>
  );
};
