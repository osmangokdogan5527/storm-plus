import fs from 'fs';
let c = fs.readFileSync('src/components/pos/PosView.tsx', 'utf8');

// 1. Remove overflow-y-auto from pos-terminal-wrapper so that sticky works relative to 'main'
c = c.replace(/className="pos-terminal-wrapper flex flex-col min-h-\[calc\(100vh-4rem\)\] h-auto overflow-y-auto gap-3\.5 animate-fade-in p-1\.5 bg-slate-900 rounded-2xl pb-10"/g,
'className="pos-terminal-wrapper flex flex-col min-h-[calc(100vh-4rem)] h-auto gap-3.5 animate-fade-in p-1.5 bg-slate-900 rounded-2xl pb-10"');

// 2. Add Mobile Floating Total at the bottom of the PosView component
const returnRegex = /return \(\s*<div className="pos-terminal-wrapper/;
const mobileFloatingTotal = `return (
    <div className="pos-terminal-wrapper flex flex-col min-h-[calc(100vh-4rem)] h-auto gap-3.5 animate-fade-in p-1.5 bg-slate-900 rounded-2xl pb-10" style={{ backgroundColor: '#0f172a' }}>
      
      {/* MOBİL İÇİN SABİT YAPIŞKAN FİYAT GÖSTERGESİ (SADECE MOBİLDE GÖRÜNÜR) */}
      <div className="md:hidden fixed bottom-4 right-4 z-50 bg-slate-900 border-2 border-teal-500/80 rounded-2xl p-3 shadow-[0_0_20px_rgba(45,212,191,0.4)] flex flex-col items-end">
         <span className="text-[10px] font-black text-teal-400 uppercase tracking-widest">ÖDENECEK</span>
         <span className="text-white font-black text-2xl font-mono leading-none">
            ₺{summary.grandTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
         </span>
         {selectedCurrency !== 'TRY' && (
            <span className="text-amber-400 font-bold text-xs mt-1">
               {currencySymbol}{convertedTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} {selectedCurrency}
            </span>
         )}
      </div>
`;
c = c.replace(/return \(\s*<div className="pos-terminal-wrapper flex flex-col min-h-\[calc\(100vh-4rem\)\] h-auto gap-3\.5 animate-fade-in p-1\.5 bg-slate-900 rounded-2xl pb-10" style=\{\{ backgroundColor: '#0f172a' \}\}>/g, mobileFloatingTotal);

// 3. Make desktop total sticky top-4 instead of top-0 for some breathing room
c = c.replace(/className="sticky top-0 z-10 bg-slate-900 p-4 rounded-2xl border-2 border-teal-500\/50/g,
'className="sticky top-4 z-10 bg-slate-900 p-4 rounded-2xl border-2 border-teal-500/50');

fs.writeFileSync('src/components/pos/PosView.tsx', c);
