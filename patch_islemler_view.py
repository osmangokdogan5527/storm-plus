import re

with open("src/components/IslemlerView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_line = "import { VirtualKeyboard } from './VirtualKeyboard';\n"
if "VirtualKeyboard" not in content:
    content = content.replace("import React, { useState, useMemo } from 'react';", "import React, { useState, useMemo } from 'react';\n" + import_line)

if "const [isKeyboardOpen, setIsKeyboardOpen]" not in content:
    content = re.sub(r'(const \[searchTerm, setSearchTerm\] = useState\(\'\'\);)', r'\1\n  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);', content)

search_input = """<div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/30" size={16} />
          <input 
            id="search-transactions"
            type="text"
            placeholder="Cari adı, fatura no veya açıklama ile ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#111] border border-white/10 rounded-lg pl-10 pr-12 py-2.5 text-sm text-white focus:outline-none focus:border-[#4ADE80] transition-colors"
          />
          <button type="button" onClick={() => setIsKeyboardOpen(true)} className="absolute right-2 top-2 bg-slate-700 hover:bg-slate-600 text-white text-[10px] font-bold px-2 py-1 rounded transition-colors" title="Sanal Klavye">ABC</button>
        </div>"""

content = re.sub(r'<div className="relative flex-1">\s*<Search className="absolute left-3\.5 top-1/2 -translate-y-1/2 text-white/30" size=\{16\} />\s*<input\s*id="search-transactions"\s*type="text"\s*placeholder="Cari adı, fatura no veya açıklama ile ara..."\s*value=\{searchTerm\}\s*onChange=\{\(e\) => setSearchTerm\(e\.target\.value\)\}\s*className="w-full bg-\[\#111\] border border-white/10 rounded-lg pl-10 pr-4 py-2\.5 text-sm text-white focus:outline-none focus:border-\[\#4ADE80\] transition-colors"\s*/>\s*</div>', search_input, content, flags=re.DOTALL)

if "<VirtualKeyboard" not in content:
    kb_component = """
      <VirtualKeyboard
        isOpen={isKeyboardOpen}
        onClose={() => setIsKeyboardOpen(false)}
        initialValue={searchTerm}
        onConfirm={setSearchTerm}
        title="İşlem Arama"
        placeholder="Arama metni girin..."
      />
    </div>
  );
"""
    content = re.sub(r'    </div>\s*\);\s*}\s*$', kb_component + "}", content)

with open("src/components/IslemlerView.tsx", "w", encoding="utf-8") as f:
    f.write(content)
