import React, { useRef } from 'react';
import { PosTable } from '../../types/pos';
import { Printer, X, Receipt, CheckCircle, Clock, Utensils, User } from 'lucide-react';

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

  const items = table.items || [];
  const subtotal = items.reduce((sum, item) => sum + (item.totalLine || 0), 0);
  const nowStr = new Date().toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' });

  const handleThermalPrint = () => {
    if (!printRef.current) return;
    const printContent = printRef.current.innerHTML;

    const printWindow = window.open('', '_blank', 'width=420,height=650');
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Adisyon - ${table.name}</title>
          <style>
            @page {
              size: 80mm auto;
              margin: 0;
            }
            body {
              font-family: 'Courier New', Courier, monospace;
              width: 80mm;
              margin: 0 auto;
              padding: 10px;
              color: #000;
              background: #fff;
              font-size: 12px;
              -webkit-print-color-adjust: exact;
            }
            * { box-sizing: border-box; }
            .border-dash { border-top: 1px dashed #000; margin: 8px 0; }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .flex-between { display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          ${printContent}
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();

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
            className="w-[280px] bg-white text-slate-950 p-4 font-mono text-xs shadow-2xl rounded-sm border border-slate-300 relative"
          >
            {/* TICKET HEADER */}
            <div className="text-center space-y-1 mb-3">
              <div className="font-black text-sm uppercase tracking-wider">STORM RESTORAN & POS</div>
              <div className="text-[10px] text-slate-600">Adisyon / Hesap Fişi</div>
              <div className="border-t border-dashed border-slate-400 my-2"></div>
            </div>

            {/* TICKET METADATA */}
            <div className="space-y-1 text-[11px] mb-3">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Masa:</span>
                <span className="text-sm font-black bg-slate-200 px-1.5 rounded">{table.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Salon/Bölge:</span>
                <span>{table.category}</span>
              </div>
              <div className="flex justify-between">
                <span>Tarih & Saat:</span>
                <span>{nowStr}</span>
              </div>
              {table.openedAt && (
                <div className="flex justify-between text-slate-600">
                  <span>Açılış Saati:</span>
                  <span>{table.openedAt}</span>
                </div>
              )}
              {table.waiterName && (
                <div className="flex justify-between">
                  <span>Garson:</span>
                  <span className="font-bold">{table.waiterName}</span>
                </div>
              )}
              {table.note && (
                <div className="mt-1 p-1 bg-amber-50 text-[10px] border border-amber-200 rounded italic text-amber-900">
                  Not: {table.note}
                </div>
              )}
            </div>

            <div className="border-t border-dashed border-slate-400 my-2"></div>

            {/* ITEM TABLE */}
            <div className="space-y-2 mb-3">
              <div className="flex justify-between font-bold text-[10px] uppercase text-slate-600 border-b border-slate-200 pb-1">
                <span>Ürün</span>
                <span>Miktar x Fiyat</span>
                <span className="text-right">Tutar</span>
              </div>

              {items.map((item, idx) => (
                <div key={item.id || idx} className="text-[11px] leading-tight">
                  <div className="font-bold">{item.stockName}</div>
                  <div className="flex justify-between text-[10px] text-slate-600 pl-2">
                    <span>
                      {item.quantity} {item.unit} x ₺{item.unitPrice.toFixed(2)}
                    </span>
                    <span className="font-bold text-slate-950 font-mono">
                      ₺{(item.totalLine || 0).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}

              {items.length === 0 && (
                <div className="text-center py-4 text-slate-400 italic">Masada kayıtlı sipariş yok.</div>
              )}
            </div>

            <div className="border-t-2 border-slate-900 my-2"></div>

            {/* TOTALS */}
            <div className="space-y-1 text-[12px] font-bold">
              <div className="flex justify-between text-base font-black pt-1">
                <span>TOPLAM TUTAR:</span>
                <span className="font-mono text-slate-950">
                  ₺{subtotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <div className="border-t border-dashed border-slate-400 my-3"></div>

            {/* FOOTER */}
            <div className="text-center text-[10px] text-slate-500 space-y-1">
              <div>*** BİLGİ VE ADİSYON FİŞİDİR ***</div>
              <div>Mali Değeri Yoktur</div>
              <div className="font-bold text-slate-900 mt-1">Afiyet Olsun!</div>
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
