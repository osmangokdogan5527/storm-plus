import fs from 'fs';
let c = fs.readFileSync('src/components/pos/PosView.tsx', 'utf8');

c = c.replace(/<div className="md:hidden fixed bottom-4 right-4 z-50 bg-slate-900 border-2 border-teal-500\/80 rounded-2xl p-3 shadow-\[0_0_20px_rgba\(45,212,191,0\.4\)\] flex flex-col items-end">/g,
'<div className="md:hidden fixed bottom-20 left-4 right-4 z-50 bg-slate-900 border-2 border-teal-500/80 rounded-2xl p-3.5 shadow-[0_0_30px_rgba(45,212,191,0.5)] flex items-center justify-between pointer-events-none">');

c = c.replace(/<span className="text-\[10px\] font-black text-teal-400 uppercase tracking-widest">ÖDENECEK<\/span>/g,
'<span className="text-xs font-black text-teal-400 uppercase tracking-widest">TOPLAM ÖDENECEK:</span>');

c = c.replace(/<span className="text-white font-black text-2xl font-mono leading-none">/g,
'<div className="flex flex-col items-end"><span className="text-white font-black text-2xl font-mono leading-none">');

c = c.replace(/\{currencySymbol\}\{convertedTotal\.toLocaleString\('tr-TR', \{ minimumFractionDigits: 2 \}\)\} \{selectedCurrency\}/g,
'{currencySymbol}{convertedTotal.toLocaleString(\'tr-TR\', { minimumFractionDigits: 2 })} {selectedCurrency}');

c = c.replace(/<\/span>\s*\)\}\s*<\/div>\s*\{\/\* ÜST TERMİNAL BİLGİ/g,
'</span>\n)}</div>\n      </div>\n      {/* ÜST TERMİNAL BİLGİ');

fs.writeFileSync('src/components/pos/PosView.tsx', c);
