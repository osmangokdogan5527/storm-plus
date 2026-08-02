const fs = require('fs');
let file = fs.readFileSync('src/components/MasraflarView.tsx', 'utf8');

// 1. Remove currency switcher block
file = file.replace(/\{\/\* Currency switcher \*\/\}.*?<\/div>/s, '');

// 2. Remove USD and EUR total boxes
const usdBlockStart = '<div className="bg-[#ffffff] p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">\n          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">\n            <TrendingDown size={20} />\n          </div>\n          <div>\n            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Toplam Masraf (USD)</span>\n            <h4 className="text-xl font-bold text-slate-900 mt-1">\n              {formatCurrency(totalStats.totalsByCurrency.USD || 0, \'USD\')}\n            </h4>\n          </div>\n        </div>';

const eurBlockStart = '<div className="bg-[#ffffff] p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">\n          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">\n            <TrendingDown size={20} />\n          </div>\n          <div>\n            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Toplam Masraf (EUR)</span>\n            <h4 className="text-xl font-bold text-slate-900 mt-1">\n              {formatCurrency(totalStats.totalsByCurrency.EUR || 0, \'EUR\')}\n            </h4>\n          </div>\n        </div>';

file = file.replace(usdBlockStart, '');
file = file.replace(eurBlockStart, '');

// 3. totalsByCurrency
file = file.replace('const totalsByCurrency = { TRY: 0, USD: 0, EUR: 0 };', 'const totalsByCurrency = { TRY: 0 };');

// 4. selectedCurrency usage inside MasraflarView
file = file.replace(/const \[selectedCurrency, setSelectedCurrency\] = useState\<'TRY' \| 'USD' \| 'EUR'\>\('TRY'\);/, 'const selectedCurrency = "TRY";');
file = file.replace(/const \[selectedCurrency, setSelectedCurrency\] = useState\<'TRY'\>\('TRY'\);/, 'const selectedCurrency = "TRY";');

fs.writeFileSync('src/components/MasraflarView.tsx', file, 'utf8');
console.log('Fixed MasraflarView');
