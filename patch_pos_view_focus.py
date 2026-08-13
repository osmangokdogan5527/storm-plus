import re

with open("src/components/pos/PosView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Remove ABC buttons
content = re.sub(r'<button type="button" onClick=\{.*?\} className="absolute right-1\.5 top-1/2 -translate-y-1/2 bg-slate-700 hover:bg-slate-600 text-white text-\[9px\] font-bold px-1\.5 py-1 rounded transition-colors" title="Sanal Klavye">ABC</button>', '', content)

def add_focus(val_text, state_key, content):
    replacement = f'value={{{val_text}}}\n                  onFocus={{() => {{\n                    setIsCariDropdownOpen(true);\n                    setIsCariKeyboardOpen(true);\n                  }}}}'
    
    # It already had onFocus={() => setIsCariDropdownOpen(true)}
    pattern = r'value=\{\{' + val_text + r'\}\}\s*onFocus=\{\(\) => setIsCariDropdownOpen\(true\)\}'
    # Wait, the `{val_text}` inside python f-string would be evaluated but the raw string `r` conflicts.
    # Let's just use string replace since it's exact:
    target = f'value={{{val_text}}}\n                  onFocus={{() => setIsCariDropdownOpen(true)}}'
    content = content.replace(target, replacement)
    
    # Try one-liner version if the above didn't hit
    target2 = f'value={{{val_text}}} onFocus={{() => setIsCariDropdownOpen(true)}}'
    content = content.replace(target2, replacement)
    
    return content

content = add_focus("cariSearchTerm", "", content)

# Remove the padding-right trick if needed, or leave it. We had: `pr-10`. `pr-3` is better without button.
content = content.replace('className="w-full pl-3 pr-10', 'className="w-full px-3')

with open("src/components/pos/PosView.tsx", "w", encoding="utf-8") as f:
    f.write(content)
