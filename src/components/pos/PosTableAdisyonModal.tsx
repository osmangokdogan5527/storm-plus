import React, { useRef } from 'react';
import { PosTable } from '../../types/pos';
import { Printer, X, Receipt, CheckCircle, Clock, Utensils, User } from 'lucide-react';
import { printThermalReceipt } from '../../utils/thermalPrintStyles';

interface PosTableAdisyonModalProps {
  isOpen: boolean;
  onClose: () => void;
  table: PosTable | null;
  onMarkBillPrinted?: (tableId: string) => void;
}

export const PosTableAdisyonModal: React.FC<PosTableAdisyonModalProps> = ({
  isOpen,
  onClose,
  table,
  onMarkBillPrinted,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !table) return null;

  const storeName = (() => {
    try {
      const saved = localStorage.getItem('storm_muhasebe_print_settings');
      if (saved) {
        const p = JSON.parse(saved);
        if (p.companyName) return p.companyName;
      }
    } catch (e) {}
    return 'RESTORAN & POS BİLGİ FİŞİ';
  })();

  const items = table.items || [];
  const subtotal = items.reduce((sum, item) => sum + (item.totalLine || 0), 0);
  const nowStr = new Date().toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });

  const handleThermalPrint = () => {
    if (!printRef.current) return;

    printThermalReceipt({
      title: `Adisyon - ${table.name}`,
      htmlContent: printRef.current.innerHTML,
      paperWidthMm: '80mm',
      fontFamily: 'mono',
      fontSize: 'base'
    });

    if (onMarkBillPrinted) {
      onMarkBillPrinted(table.id);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="px-5 py-4 bg-slate-950 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Receipt size={20} />
            </div>
            <div>
              <h3 className="text-base font-black text-white uppercase tracking-wide">
                Masa Adisyon Fişi
              </h3>
              <p className="text-xs text-amber-400 font-bold">
                {table.name} ({table.category})
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

        {/* ADİSYON REALISTIC THERMAL TICKET PREVIEW */}
        <div className="p-6 bg-slate-950 flex-1 overflow-y-auto custom-scrollbar flex flex-col items-center">
          <div
            ref={printRef}
            className="w-[280px] bg-white text-black p-4 font-mono text-xs shadow-2xl rounded-sm border-2 border-black relative"
            style={{ color: '#000000' }}
          >
            {/* TICKET HEADER */}
            <div className="text-center space-y-1 mb-3">
              <div className="company-title font-black text-base sm:text-lg uppercase tracking-tight text-black">{storeName}</div>
              <div className="document-title font-black text-xs sm:text-sm uppercase tracking-wider py-1 my-1 border-y-2 border-black text-center text-black">
                *** ADİSYON / HESAP FİŞİ ***
              </div>
            </div>

            {/* TICKET METADATA */}
            <div className="space-y-1 text-[11px] font-bold text-black mb-3">
              <div className="flex justify-between items-center text-black">
                <span className="font-bold">Masa:</span>
                <span className="text-base font-black border-2 border-black px-2 py-0.5 rounded text-black">{table.name}</span>
              </div>
              <div className="flex justify-between text-black">
                <span>Salon/Bölge:</span>
                <span className="font-bold">{table.category}</span>
              </div>
              <div className="flex justify-between text-black">
                <span>Tarih & Saat:</span>
                <span className="font-bold">{nowStr}</span>
              </div>
              {table.openedAt && (
                <div className="flex justify-between text-black">
                  <span>Açılış Saati:</span>
                  <span className="font-bold">{table.openedAt}</span>
                </div>
              )}
              {table.waiterName && (
                <div className="flex justify-between text-black">
                  <span>Garson:</span>
                  <span className="font-black">{table.waiterName}</span>
                </div>
              )}
              {table.note && (
                <div className="mt-1 p-1.5 bg-amber-50 text-[10px] font-bold border border-black rounded italic text-black">
                  Not: {table.note}
                </div>
              )}
            </div>

            <div className="border-t-2 border-black my-2"></div>

            {/* ITEM TABLE */}
            <div className="space-y-2 mb-3">
              <div className="flex justify-between font-black text-[10px] uppercase text-black border-b-2 border-black pb-1">
                <span>Ürün</span>
                <span>Miktar x Fiyat</span>
                <span className="text-right">Tutar</span>
              </div>

              {items.map((item, idx) => (
                <div key={item.id || idx} className="text-[11px] leading-tight font-bold text-black border-b border-black pb-1">
                  <div className="font-black text-black text-xs">{idx + 1}. {item.stockName}</div>
                  <div className="flex justify-between text-[10px] font-bold text-black pl-2 mt-0.5">
                    <span>
                      {item.quantity} {item.unit} x ₺{item.unitPrice.toFixed(2)}
                    </span>
                    <span className="font-black text-black font-mono">
                      ₺{(item.totalLine || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="text-center py-4 text-black font-bold italic">Masada kayıtlı sipariş yok.</div>
              )}
            </div>

            <div className="border-t-2 border-black my-2"></div>

            {/* TOTALS */}
            <div className="grand-total space-y-1 text-sm font-black text-black border-2 border-black p-2 bg-white my-2">
              <div className="flex justify-between items-center text-base sm:text-lg font-black text-black">
                <span>TOPLAM TUTAR:</span>
                <span className="font-mono text-black font-black text-lg">
                  ₺{subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="border-t-2 border-black my-3"></div>

            {/* FOOTER */}
            <div className="text-center text-[10px] font-bold text-black space-y-1">
              <div className="font-black uppercase text-xs">*** BİLGİ VE ADİSYON FİŞİDİR ***</div>
              <div className="font-bold">Mali Değeri Yoktur</div>
              <div className="font-black text-sm text-black mt-1 uppercase">Afiyet Olsun!</div>
            </div>
          </div>
        </div>

        {/* FOOTER ACTIONS */}
        <div className="p-4 bg-slate-950 border-t border-white/10 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Kapat
          </button>

          <button
            type="button"
            onClick={handleThermalPrint}
            className="flex-1 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer size={16} />
            <span>Adisyon Fişi Yazdır (80mm Termal)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
