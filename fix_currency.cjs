const fs = require('fs');

let content = fs.readFileSync('src/components/pos/PosView.tsx', 'utf8');

// Replace the Para Birimi block
const oldBlock = `{/* 3. ÖDENECEK PARA BİRİMİ SEÇİMİ (SAĞA YANAŞTIRILMIŞ) */}
              <div className="md:col-span-4 space-y-1.5 flex flex-col items-end text-right">
                <div className="flex items-center justify-end gap-2 w-full">
                  <span className="text-xs font-black text-teal-300 uppercase tracking-wider flex items-center gap-1" style={{ color: '#5eead4' }}>
                    <DollarSign size={14} />
                    Para Birimi:
                  </span>
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
                    {[
                      { code: 'TRY', label: '₺ TRY' },
                      { code: 'USD', label: '$ USD' },
                      { code: 'EUR', label: '€ EUR' },
                    ].map((c) => (
                      <button
                        key={c.code}
                        type="button"
                        onClick={() => {
                          setSelectedCurrency(c.code as any);
                          setCustomRate('');
                        }}
                        className={\`px-2.5 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer active:scale-95 touch-manipulation \${
                          selectedCurrency === c.code
                            ? 'bg-teal-400 text-slate-950 shadow'
                            : 'text-slate-400 hover:text-white'
                        }\`}
                        style={selectedCurrency === c.code ? { backgroundColor: '#2dd4bf', color: '#020617', fontWeight: 900 } : {}}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>`;

const newBlock = `{/* 3. ÖDENECEK PARA BİRİMİ SEÇİMİ */}
              <div className="md:col-span-4 space-y-1.5">
                <span className="text-xs font-black text-teal-300 uppercase tracking-wider flex items-center gap-1" style={{ color: '#5eead4' }}>
                  Para Birimi:
                </span>
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-700">
                  {[
                    { code: 'TRY', label: 'TRY', icon: '₺' },
                    { code: 'USD', label: 'USD', icon: '$' },
                    { code: 'EUR', label: 'EUR', icon: '€' },
                  ].map((c) => (
                    <button
                      key={c.code}
                      type="button"
                      onClick={() => {
                        setSelectedCurrency(c.code as any);
                        setCustomRate('');
                      }}
                      className={\`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer text-center active:scale-95 touch-manipulation flex items-center justify-center gap-1 \${
                        selectedCurrency === c.code
                          ? 'bg-teal-400 text-slate-950 shadow scale-105'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      }\`}
                      style={selectedCurrency === c.code ? { backgroundColor: '#2dd4bf', color: '#020617', fontWeight: 900 } : {}}
                    >
                      <span className="opacity-70">{c.icon}</span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>`;

content = content.replace(oldBlock, newBlock);

fs.writeFileSync('src/components/pos/PosView.tsx', content, 'utf8');
console.log('Done');
