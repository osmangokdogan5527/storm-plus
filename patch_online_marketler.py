import re

with open("src/components/OnlineMarketlerView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_line = "import { VirtualKeyboard } from './VirtualKeyboard';\n"
if "VirtualKeyboard" not in content:
    content = content.replace("import React, { useState, useMemo } from 'react';", "import React, { useState, useMemo } from 'react';\n" + import_line)

if "const [isKeyboardOpen, setIsKeyboardOpen]" not in content:
    content = re.sub(r'(const \[searchTerm, setSearchTerm\] = useState\(\'\'\);)', r'\1\n  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);', content)

search_input = """<div className="relative min-w-[150px]">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Sipariş / Fiş Ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-10 py-1.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-[var(--accent-500)]"
              />
              <button type="button" onClick={() => setIsKeyboardOpen(true)} className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-slate-300 hover:bg-slate-400 text-slate-800 text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors" title="Sanal Klavye">ABC</button>
            </div>"""

content = re.sub(r'<div className="relative min-w-\[150px\]">\s*<Search className="absolute left-2\.5 top-1/2 -translate-y-1/2 text-slate-400" size=\{14\} />\s*<input\s*type="text"\s*placeholder="Sipariş / Fiş Ara..."\s*value=\{searchTerm\}\s*onChange=\{\(e\) => setSearchTerm\(e\.target\.value\)\}\s*className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-1\.5 text-xs text-slate-800 font-medium focus:outline-none focus:border-\[var\(--accent-500\)\]"\s*/>\s*</div>', search_input, content, flags=re.DOTALL)

if "<VirtualKeyboard" not in content:
    kb_component = """
      <VirtualKeyboard
        isOpen={isKeyboardOpen}
        onClose={() => setIsKeyboardOpen(false)}
        initialValue={searchTerm}
        onConfirm={setSearchTerm}
        title="Sipariş Arama"
        placeholder="Arama metni girin..."
      />
    </div>
  );
"""
    content = re.sub(r'    </div>\s*\);\s*}\s*$', kb_component + "}", content)

with open("src/components/OnlineMarketlerView.tsx", "w", encoding="utf-8") as f:
    f.write(content)
