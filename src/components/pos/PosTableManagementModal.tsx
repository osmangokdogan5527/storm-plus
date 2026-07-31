import React, { useState } from 'react';
import { PosTable } from '../../types/pos';
import { 
  X, 
  Plus, 
  Utensils, 
  Users, 
  Clock, 
  Receipt, 
  ArrowLeftRight, 
  Trash2, 
  CheckCircle2, 
  RotateCcw, 
  Sparkles,
  Search,
  Filter,
  DollarSign
} from 'lucide-react';
import { PosTableTransferModal } from './PosTableTransferModal';
import { PosTableAdisyonModal } from './PosTableAdisyonModal';

interface PosTableManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  tables: PosTable[];
  activeTableId: string | null;
  onSelectTableForOrder: (table: PosTable) => void;
  onUpdateTables: (newTables: PosTable[]) => void;
}

export const PosTableManagementModal: React.FC<PosTableManagementModalProps> = ({
  isOpen,
  onClose,
  tables,
  activeTableId,
  onSelectTableForOrder,
  onUpdateTables,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [searchTerm, setSearchTerm] = useState<string>('');
  
  // MODALS STATE
  const [transferSourceTable, setTransferSourceTable] = useState<PosTable | null>(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState<boolean>(false);
  
  const [adisyonTable, setAdisyonTable] = useState<PosTable | null>(null);
  const [isAdisyonModalOpen, setIsAdisyonModalOpen] = useState<boolean>(false);

  // NEW TABLE FORM STATE
  const [isAddingTable, setIsAddingTable] = useState<boolean>(false);
  const [newTableName, setNewTableName] = useState<string>('');
  const [newTableCategory, setNewTableCategory] = useState<string>('Salon');
  const [newTableCapacity, setNewTableCapacity] = useState<number>(4);

  // CONFIRMATION & ALERT STATES
  const [tableToDelete, setTableToDelete] = useState<PosTable | null>(null);
  const [tableToReset, setTableToReset] = useState<PosTable | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  // Categories list
  const categories = ['Tümü', ...Array.from(new Set(tables.map((t) => t.category)))];

  // Filtered tables
  const filteredTables = (tables || []).filter((t) => {
    const matchesCat = selectedCategory === 'Tümü' || t.category === selectedCategory;
    const matchesSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  // Analytics
  const totalCount = (tables || []).length;
  const occupiedTables = (tables || []).filter((t) => t.status === 'occupied' || t.status === 'bill_printed');
  const emptyCount = (tables || []).filter((t) => t.status === 'empty').length;
  const billPrintedCount = (tables || []).filter((t) => t.status === 'bill_printed').length;
  
  const totalOpenRevenue = occupiedTables.reduce((sum, t) => {
    const tableSum = (t.items || []).reduce((acc, i) => acc + (i.totalLine || 0), 0);
    return sum + tableSum;
  }, 0);

  // HANDLERS
  const handleAddNewTable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTableName.trim()) return;

    const newTable: PosTable = {
      id: `table_${Date.now()}`,
      name: newTableName.trim(),
      category: newTableCategory || 'Salon',
      status: 'empty',
      capacity: newTableCapacity || 4,
      items: [],
    };

    onUpdateTables([...tables, newTable]);
    setNewTableName('');
    setIsAddingTable(false);
  };

  const onRequestDeleteTable = (table: PosTable) => {
    if ((table.items || []).length > 0 || table.status === 'occupied' || table.status === 'bill_printed') {
      setAlertMessage(`"${table.name}" masasında açık sipariş/adisyon bulunduğu için silinemez. Önce masayı boşaltmalısınız.`);
      return;
    }
    setTableToDelete(table);
  };

  const confirmDeleteTable = () => {
    if (!tableToDelete) return;
    const updated = (tables || []).filter((t) => t.id !== tableToDelete.id);
    onUpdateTables(updated);
    setTableToDelete(null);
  };

  const onRequestResetTable = (table: PosTable) => {
    setTableToReset(table);
  };

  const confirmResetTable = () => {
    if (!tableToReset) return;
    const updated = tables.map((t) =>
      t.id === tableToReset.id
        ? {
            ...t,
            status: 'empty' as const,
            items: [],
            openedAt: undefined,
            waiterName: undefined,
            note: undefined,
            billPrintedAt: undefined,
          }
        : t
    );
    onUpdateTables(updated);
    setTableToReset(null);
  };

  const handleTransferTable = (sourceId: string, targetId: string, actionType: 'move' | 'merge') => {
    const source = tables.find((t) => t.id === sourceId);
    const target = tables.find((t) => t.id === targetId);

    if (!source || !target) return;

    let updatedTables = [...tables];

    if (actionType === 'move') {
      // Transfer all items to empty target
      updatedTables = updatedTables.map((t) => {
        if (t.id === targetId) {
          return {
            ...t,
            status: 'occupied' as const,
            items: [...source.items],
            openedAt: source.openedAt || new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
            waiterName: source.waiterName,
            note: source.note,
          };
        }
        if (t.id === sourceId) {
          return {
            ...t,
            status: 'empty' as const,
            items: [],
            openedAt: undefined,
            waiterName: undefined,
            note: undefined,
          };
        }
        return t;
      });
    } else {
      // Merge items into target
      updatedTables = updatedTables.map((t) => {
        if (t.id === targetId) {
          return {
            ...t,
            status: 'occupied' as const,
            items: [...t.items, ...source.items],
          };
        }
        if (t.id === sourceId) {
          return {
            ...t,
            status: 'empty' as const,
            items: [],
            openedAt: undefined,
            waiterName: undefined,
            note: undefined,
          };
        }
        return t;
      });
    }

    onUpdateTables(updatedTables);
  };

  const handleMarkBillPrinted = (tableId: string) => {
    const updated = tables.map((t) =>
      t.id === tableId
        ? {
            ...t,
            status: 'bill_printed' as const,
            billPrintedAt: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
          }
        : t
    );
    onUpdateTables(updated);
  };

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-6xl h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* HEADER BAR */}
        <div className="px-5 py-3.5 bg-slate-950 border-b border-white/10 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Utensils size={22} />
            </div>
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-wider flex items-center gap-2">
                Restoran Masa Yönetim Planı
                <span className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold px-2 py-0.5 rounded-full">
                  Adisyon POS
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Salon, Bahçe ve Teras masalarını anlık takip edin, adisyon basın, sipariş açın
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAddingTable(!isAddingTable)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              <Plus size={15} />
              <span>{isAddingTable ? 'Kapat' : 'Yeni Masa Ekle'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* TOP SUMMARY STATS STRIP */}
        <div className="bg-slate-950/60 border-b border-white/10 px-5 py-2.5 grid grid-cols-2 sm:grid-cols-5 gap-3 shrink-0 text-xs">
          <div className="bg-slate-900/80 border border-white/10 rounded-xl p-2 flex items-center gap-2.5">
            <div className="p-1.5 bg-slate-800 text-slate-300 rounded-lg">
              <Utensils size={14} />
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block font-bold uppercase">Toplam Masa</span>
              <span className="font-black text-white text-sm">{totalCount} Adet</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-rose-500/30 rounded-xl p-2 flex items-center gap-2.5">
            <div className="p-1.5 bg-rose-500/20 text-rose-400 rounded-lg">
              <Users size={14} />
            </div>
            <div>
              <span className="text-[10px] text-rose-400 block font-bold uppercase">Dolu Masalar</span>
              <span className="font-black text-white text-sm">{occupiedTables.length} Masa</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-emerald-500/30 rounded-xl p-2 flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <CheckCircle2 size={14} />
            </div>
            <div>
              <span className="text-[10px] text-emerald-400 block font-bold uppercase">Boş Masalar</span>
              <span className="font-black text-white text-sm">{emptyCount} Masa</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-amber-500/30 rounded-xl p-2 flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500/20 text-amber-400 rounded-lg">
              <Receipt size={14} />
            </div>
            <div>
              <span className="text-[10px] text-amber-400 block font-bold uppercase">Hesap İsteyen</span>
              <span className="font-black text-white text-sm">{billPrintedCount} Masa</span>
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1 bg-gradient-to-r from-amber-500/20 to-teal-500/20 border border-amber-500/30 rounded-xl p-2 flex items-center gap-2.5">
            <div className="p-1.5 bg-amber-500 text-slate-950 rounded-lg font-black">
              <DollarSign size={14} />
            </div>
            <div>
              <span className="text-[10px] text-amber-300 block font-bold uppercase">Açık Adisyon Tutar</span>
              <span className="font-mono font-black text-amber-400 text-sm">
                ₺{totalOpenRevenue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* INLINE NEW TABLE ADD FORM */}
        {isAddingTable && (
          <form onSubmit={handleAddNewTable} className="bg-amber-500/10 border-b border-amber-500/30 p-4 shrink-0 flex flex-wrap items-center gap-3 animate-fadeIn text-xs">
            <div className="flex-1 min-w-[160px]">
              <label className="block text-[10px] font-bold text-amber-300 uppercase mb-1">Masa Adı</label>
              <input
                type="text"
                placeholder="Örn: Masa 14, Teras VIP 2"
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-white/15 rounded-lg text-white font-bold focus:outline-none focus:ring-1 focus:ring-amber-500"
                required
              />
            </div>

            <div className="w-36">
              <label className="block text-[10px] font-bold text-amber-300 uppercase mb-1">Kategori / Salon</label>
              <input
                type="text"
                placeholder="Örn: Salon, Bahçe"
                value={newTableCategory}
                onChange={(e) => setNewTableCategory(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-white/15 rounded-lg text-white font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="w-24">
              <label className="block text-[10px] font-bold text-amber-300 uppercase mb-1">Kapasite</label>
              <input
                type="number"
                min={1}
                max={50}
                value={newTableCapacity}
                onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 2)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-white/15 rounded-lg text-white font-semibold focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 mt-4">
              <button
                type="submit"
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-lg transition-colors cursor-pointer"
              >
                Kaydet & Ekle
              </button>
              <button
                type="button"
                onClick={() => setIsAddingTable(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg transition-colors cursor-pointer"
              >
                İptal
              </button>
            </div>
          </form>
        )}

        {/* CATEGORY TABS & SEARCH BAR */}
        <div className="px-5 py-3 bg-slate-950/80 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          {/* CATEGORY BUTTONS */}
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-white/10'
                }`}
              >
                {cat === 'Tümü' ? 'Tüm Masalar' : cat}
                <span className="ml-1.5 opacity-60 text-[10px]">
                  ({cat === 'Tümü' ? (tables || []).length : (tables || []).filter((t) => t.category === cat).length})
                </span>
              </button>
            ))}
          </div>

          {/* SEARCH INPUT */}
          <div className="relative w-full sm:w-60">
            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Masa ara..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-white/15 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* MAIN TABLE GRID AREA */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-slate-950/90">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredTables.map((table) => {
              const tableItems = table.items || [];
              const itemCount = tableItems.reduce((acc, i) => acc + (i.quantity || 1), 0);
              const tableTotal = tableItems.reduce((acc, i) => acc + (i.totalLine || 0), 0);
              const isOccupied = table.status === 'occupied';
              const isBillPrinted = table.status === 'bill_printed';
              const isActiveInPos = activeTableId === table.id;

              return (
                <div
                  key={table.id}
                  className={`relative group rounded-2xl p-4 border transition-all duration-200 flex flex-col justify-between shadow-xl ${
                    isActiveInPos
                      ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-slate-950'
                      : ''
                  } ${
                    isBillPrinted
                      ? 'bg-amber-950/30 border-amber-500/50 hover:border-amber-400'
                      : isOccupied
                      ? 'bg-rose-950/30 border-rose-500/50 hover:border-rose-400'
                      : 'bg-slate-900/80 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900'
                  }`}
                >
                  {/* CARD TOP HEADER */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${
                          isBillPrinted
                            ? 'bg-amber-400 shadow-lg shadow-amber-400/50'
                            : isOccupied
                            ? 'bg-rose-500 shadow-lg shadow-rose-500/50'
                            : 'bg-emerald-500'
                        }`} />
                        <h3 className="font-black text-white text-base tracking-wide truncate">
                          {table.name}
                        </h3>
                      </div>

                      {/* STATUS BADGE */}
                      <span className={`px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shadow-sm ${
                        isBillPrinted
                          ? 'bg-amber-400 text-slate-950 border border-amber-300'
                          : isOccupied
                          ? 'bg-rose-600 text-white border border-rose-400'
                          : 'bg-emerald-600 text-white border border-emerald-400'
                      }`}>
                        {isBillPrinted ? 'Adisyon Basıldı' : isOccupied ? 'Dolu' : 'Boş'}
                      </span>
                    </div>

                    {/* CATEGORY & CAPACITY */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mb-3">
                      <span>{table.category}</span>
                      <span className="flex items-center gap-1">
                        <Users size={12} /> {table.capacity} Kişilik
                      </span>
                    </div>

                    {/* OCCUPIED DETAILS (AÇILIŞ SAATİ, MASA TUTARI) */}
                    {(isOccupied || isBillPrinted) ? (
                      <div className="p-2.5 bg-slate-950/70 rounded-xl border border-white/5 space-y-1.5 mb-3 text-xs">
                        <div className="flex justify-between items-center text-slate-300">
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock size={11} /> Açılış:
                          </span>
                          <span className="font-mono font-bold text-amber-400">{table.openedAt || '19:30'}</span>
                        </div>

                        <div className="flex justify-between items-center text-slate-300">
                          <span className="text-[10px] text-slate-400">Kalem Sayısı:</span>
                          <span className="font-bold">{itemCount} Adet</span>
                        </div>

                        <div className="pt-1 border-t border-white/10 flex justify-between items-center font-mono">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">Tutar:</span>
                          <span className="text-sm font-black text-amber-400">
                            ₺{tableTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-slate-500 text-xs italic bg-slate-950/30 rounded-xl border border-dashed border-white/5 mb-3">
                        Masa müsait. Sipariş açmak için tıklayın.
                      </div>
                    )}
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="space-y-1.5 pt-2 border-t border-white/10">
                    {/* PRIMARY ACTION: SİPARİŞ AÇ / MASAYA GİT */}
                    <button
                      onClick={() => {
                        onSelectTableForOrder(table);
                        onClose();
                      }}
                      className={`w-full py-2 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        (isOccupied || isBillPrinted)
                          ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20'
                          : 'bg-slate-800 hover:bg-emerald-600 text-white border border-white/10'
                      }`}
                    >
                      <Utensils size={14} />
                      <span>{(isOccupied || isBillPrinted) ? 'Siparişe Git / Düzenle' : 'Masayı Aç & Sipariş Gir'}</span>
                    </button>

                    {/* SECONDARY ACTIONS IF OCCUPIED */}
                    {(isOccupied || isBillPrinted) && (
                      <div className="grid grid-cols-2 gap-1.5">
                        <button
                          onClick={() => {
                            setAdisyonTable(table);
                            setIsAdisyonModalOpen(true);
                          }}
                          className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[10px] rounded-lg border border-white/10 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="Adisyon Yazdır"
                        >
                          <Receipt size={12} />
                          <span>Adisyon</span>
                        </button>

                        <button
                          onClick={() => {
                            setTransferSourceTable(table);
                            setIsTransferModalOpen(true);
                          }}
                          className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-sky-300 font-bold text-[10px] rounded-lg border border-white/10 flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          title="Masa Taşı"
                        >
                          <ArrowLeftRight size={12} />
                          <span>Taşı</span>
                        </button>
                      </div>
                    )}

                    {/* CARD FOOTER OPTIONS: BOŞALT & SİL */}
                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                      {(isOccupied || isBillPrinted) ? (
                        <button
                          type="button"
                          onClick={() => onRequestResetTable(table)}
                          className="text-rose-400 hover:text-rose-300 flex items-center gap-0.5 cursor-pointer font-bold"
                        >
                          <RotateCcw size={10} /> Masayı Boşalt
                        </button>
                      ) : (
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Müsait
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => onRequestDeleteTable(table)}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1 cursor-pointer"
                        title="Masayı Sil"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredTables.length === 0 && (
            <div className="py-16 text-center text-slate-500 space-y-3">
              <Utensils size={36} className="mx-auto text-slate-600" />
              <p className="text-sm font-bold">Aramanıza uygun masa bulunamadı.</p>
              <p className="text-xs">Yukarıdaki 'Yeni Masa Ekle' butonunu kullanarak yeni masa tanımlayabilirsiniz.</p>
            </div>
          )}
        </div>

        {/* DELETE CONFIRMATION MODAL */}
        {tableToDelete && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-rose-500/40 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-rose-500/20 text-rose-400 rounded-xl">
                  <Trash2 size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Masa Silme Onayı</h3>
                  <p className="text-xs text-slate-400">Bu işlem geri alınamaz.</p>
                </div>
              </div>
              <p className="text-sm text-slate-200 bg-slate-950 p-3 rounded-xl border border-white/10">
                <strong className="text-rose-400">{tableToDelete.name}</strong> masasını sistemden tamamen silmek istediğinizden emin misiniz?
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTableToDelete(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={confirmDeleteTable}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs rounded-xl shadow-lg shadow-rose-600/30 cursor-pointer"
                >
                  Evet, Masayı Sil
                </button>
              </div>
            </div>
          </div>
        )}

        {/* RESET CONFIRMATION MODAL */}
        {tableToReset && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-amber-500/40 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
                  <RotateCcw size={24} />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Masayı Boşalt</h3>
                  <p className="text-xs text-slate-400">Siparişler sıfırlanacak.</p>
                </div>
              </div>
              <p className="text-sm text-slate-200 bg-slate-950 p-3 rounded-xl border border-white/10">
                <strong className="text-amber-400">{tableToReset.name}</strong> masasının tüm aktif siparişleri temizlenecek ve masa boş duruma getirilecek. Onaylıyor musunuz?
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTableToReset(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  İptal
                </button>
                <button
                  type="button"
                  onClick={confirmResetTable}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  Evet, Masayı Boşalt
                </button>
              </div>
            </div>
          </div>
        )}

        {/* WARNING ALERT MODAL */}
        {alertMessage && (
          <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
            <div className="bg-slate-900 border border-amber-500/50 rounded-2xl p-5 max-w-md w-full shadow-2xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 text-amber-400 rounded-xl">
                  <Utensils size={24} />
                </div>
                <h3 className="text-base font-black text-white">İşlem Engellendi</h3>
              </div>
              <p className="text-sm text-amber-200/90 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
                {alertMessage}
              </p>
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setAlertMessage(null)}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl cursor-pointer"
                >
                  Anlaşıldı
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TRANSFER MODAL */}
        <PosTableTransferModal
          isOpen={isTransferModalOpen}
          onClose={() => setIsTransferModalOpen(false)}
          tables={tables}
          sourceTable={transferSourceTable}
          onTransferTable={handleTransferTable}
        />

        {/* ADİSYON PREVIEW MODAL */}
        <PosTableAdisyonModal
          isOpen={isAdisyonModalOpen}
          onClose={() => setIsAdisyonModalOpen(false)}
          table={adisyonTable}
          onMarkBillPrinted={handleMarkBillPrinted}
        />
      </div>
    </div>
  );
};
