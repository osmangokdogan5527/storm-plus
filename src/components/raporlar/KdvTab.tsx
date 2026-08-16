import React from 'react';
import { Download, TrendingUp } from 'lucide-react';

interface KdvTabProps {
  summaryStats: any;
  formatMoney: (val: number) => string;
  downloadKarZararPdf: () => void;
}

export function KdvTab({ summaryStats, formatMoney, downloadKarZararPdf }: KdvTabProps) {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DETAILED P&L STATEMENT */}
        <div className="bg-[#0b0c0e] border border-white/5 rounded-2xl overflow-hidden flex flex-col lg:col-span-2">
          <div className="p-5 border-b border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Kar / Zarar Tablosu</h3>
              <p className="text-[10px] text-zinc-400 mt-0.5">Gelir Tablosu formatında net karlılık (EBITDA)</p>
            </div>
            <button
              onClick={downloadKarZararPdf}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/10 text-teal-400 hover:bg-teal-500/20 hover:text-white rounded-lg transition-colors text-xs font-semibold"
            >
              <Download size={14} />
              PDF İndir
            </button>
          </div>
          
          <div className="p-5 space-y-4 flex-1 text-xs">
            {/* Sales Section */}
            <div>
              <div className="flex justify-between items-center py-2 text-zinc-300 font-medium border-b border-white/5">
                <span>A. BRÜT SATIŞLAR</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  {formatMoney(summaryStats.sales)}
                </span>
              </div>
            </div>

            {/* COGS Section */}
            <div>
              <div className="flex justify-between items-center py-2 text-zinc-300 font-medium border-b border-white/5">
                <span>B. SATIŞLARIN MALİYETİ (-)</span>
                <span className="font-mono text-amber-500 font-bold text-sm">
                  {formatMoney(summaryStats.costOfSales)}
                </span>
              </div>
              
              <div className="flex justify-between items-center py-2 text-zinc-400 bg-white/5 px-2 rounded mt-1">
                <span className="pl-4 text-[10px]">Net Brüt Kâr / Zarar</span>
                <span className="font-mono font-bold text-white">
                  {formatMoney(summaryStats.sales - summaryStats.costOfSales)}
                </span>
              </div>
            </div>

            {/* OPEX Section */}
            <div className="pt-2">
              <div className="flex justify-between items-center py-2 text-zinc-300 font-medium border-b border-white/5">
                <span>C. FAALİYET GİDERLERİ (-)</span>
                <span className="font-mono text-rose-400 font-bold text-sm">
                  {formatMoney(summaryStats.totalExpenses + summaryStats.employeeSalaries)}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 text-zinc-400">
                <span className="pl-4">Genel Yönetim / Çeşitli Giderler</span>
                <span className="font-mono">{formatMoney(summaryStats.totalExpenses)}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 text-zinc-400">
                <span className="pl-4">Personel Maaş Hak Edişleri</span>
                <span className="font-mono">{formatMoney(summaryStats.employeeSalaries)}</span>
              </div>
            </div>

            {/* NET INCOME */}
            <div className="pt-4 mt-4 border-t-2 border-white/10">
              <div className="flex justify-between items-center p-3 rounded-xl bg-zinc-900 border border-white/5 shadow-inner">
                <span className="text-sm font-bold text-white">NET FAALİYET KÂRI / ZARARI</span>
                <span className={`text-lg font-bold font-mono ${
                  (summaryStats.sales - summaryStats.costOfSales - summaryStats.totalExpenses - summaryStats.employeeSalaries) >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}>
                  {formatMoney(
                    summaryStats.sales - 
                    summaryStats.costOfSales - 
                    summaryStats.totalExpenses - 
                    summaryStats.employeeSalaries
                  )}
                </span>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
}
