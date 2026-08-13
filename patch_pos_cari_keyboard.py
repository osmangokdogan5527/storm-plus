import re

with open("src/components/pos/PosView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_line = "import { VirtualKeyboard } from '../VirtualKeyboard';\n"
if "VirtualKeyboard" not in content:
    content = content.replace("import { PosNumpadModal }", import_line + "import { PosNumpadModal }")

if "const [isCariKeyboardOpen, setIsCariKeyboardOpen]" not in content:
    content = re.sub(r'(const \[cariSearchTerm, setCariSearchTerm\] = useState<string>\(\'\'\);)', r'\1\n  const [isCariKeyboardOpen, setIsCariKeyboardOpen] = useState(false);', content)

search_input = """<div className="relative">
                <input
                  type="text"
                  value={cariSearchTerm}
                  onFocus={() => setIsCariDropdownOpen(true)}
                  onChange={(e) => {
                    setCariSearchTerm(e.target.value);
                    setIsCariDropdownOpen(true);
                  }}
                  placeholder="Müşteri Ara veya 'Perakende Müşteri'..."
                  className="w-full pl-3 pr-10 py-2.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 font-bold focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all shadow-inner"
                  style={{ backgroundColor: '#020617', color: '#ffffff' }}
                />
                <button type="button" onClick={() => setIsCariKeyboardOpen(true)} className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-slate-700 hover:bg-slate-600 text-white text-[9px] font-bold px-1.5 py-1 rounded transition-colors" title="Sanal Klavye">ABC</button>"""

content = re.sub(r'<div className="relative">\s*<input\s*type="text"\s*value=\{cariSearchTerm\}\s*onFocus=\{\(\) => setIsCariDropdownOpen\(true\)\}\s*onChange=\{\(e\) => \{\s*setCariSearchTerm\(e\.target\.value\);\s*setIsCariDropdownOpen\(true\);\s*\}\}\s*placeholder="Müşteri Ara veya \'Perakende Müşteri\'\.\.\."\s*className="w-full px-3 py-2\.5 bg-slate-950 border-2 border-slate-700 rounded-xl text-xs text-white placeholder-slate-400 font-bold focus:outline-none focus:border-teal-400 focus:ring-1 focus:ring-teal-400 transition-all shadow-inner"\s*style=\{\{ backgroundColor: \'#020617\', color: \'#ffffff\' \}\}\s*/>', search_input, content, flags=re.DOTALL)

if "<VirtualKeyboard\n        isOpen={isCariKeyboardOpen}" not in content:
    kb_component = """      <VirtualKeyboard
        isOpen={isCariKeyboardOpen}
        onClose={() => setIsCariKeyboardOpen(false)}
        initialValue={cariSearchTerm}
        onConfirm={(val) => { setCariSearchTerm(val); setIsCariDropdownOpen(true); }}
        title="Müşteri Arama"
        placeholder="Müşteri adı veya kodu girin..."
      />

    </div>
  );
"""
    content = re.sub(r'    </div>\s*\);\s*}\s*$', kb_component + "}", content)

with open("src/components/pos/PosView.tsx", "w", encoding="utf-8") as f:
    f.write(content)
