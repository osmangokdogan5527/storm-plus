import re

with open("src/components/MasraflarView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_line = "import { VirtualKeyboard } from './VirtualKeyboard';\n"
if "VirtualKeyboard" not in content:
    content = content.replace("import React, { useState, useMemo } from 'react';", "import React, { useState, useMemo } from 'react';\n" + import_line)

if "const [isKeyboardOpen, setIsKeyboardOpen]" not in content:
    content = re.sub(r'(const \[searchTerm, setSearchTerm\] = useState\(\'\'\);)', r'\1\n  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);', content)

search_input = """<div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Search size={16} />
              </span>
              <input
                id="expense-search"
                type="text"
                placeholder="Masraf adı veya açıklama ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 focus:ring-rose-500 rounded-xl pl-9 pr-12 py-2 text-xs font-medium text-slate-900"
              />
              <button type="button" onClick={() => setIsKeyboardOpen(true)} className="absolute right-2 top-1/2 -translate-y-1/2 bg-slate-300 hover:bg-slate-400 text-slate-800 text-[9px] font-bold px-1.5 py-0.5 rounded transition-colors" title="Sanal Klavye">ABC</button>
            </div>"""

content = re.sub(r'<div className="relative flex-1">\s*<span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">\s*<Search size=\{16\} />\s*</span>\s*<input\s*id="expense-search"\s*type="text"\s*placeholder="Masraf adı veya açıklama ara..."\s*value=\{searchTerm\}\s*onChange=\{\(e\) => setSearchTerm\(e\.target\.value\)\}\s*className="w-full bg-slate-50 border border-slate-200 focus:border-rose-500 focus:ring-rose-500 rounded-xl pl-9 pr-4 py-2 text-xs font-medium text-slate-900"\s*/>\s*</div>', search_input, content, flags=re.DOTALL)

if "<VirtualKeyboard" not in content:
    kb_component = """
      <VirtualKeyboard
        isOpen={isKeyboardOpen}
        onClose={() => setIsKeyboardOpen(false)}
        initialValue={searchTerm}
        onConfirm={setSearchTerm}
        title="Masraf Arama"
        placeholder="Arama metni girin..."
      />
    </div>
  );
"""
    content = re.sub(r'    </div>\s*\);\s*}\s*$', kb_component + "}", content)

with open("src/components/MasraflarView.tsx", "w", encoding="utf-8") as f:
    f.write(content)
