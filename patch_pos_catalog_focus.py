import re

with open("src/components/pos/PosProductCatalog.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Remove ABC buttons
content = re.sub(r'<button\s*onClick=\{\(\) => setIsKeyboardOpen\(true\)\}\s*className="absolute inset-y-1\.5 right-1\.5 px-3 bg-slate-700 hover:bg-slate-600 text-white font-black text-xs rounded-xl flex items-center justify-center transition-colors shadow-sm"\s*style=\{\{ right: searchTerm \? \'48px\' : \'6px\' \}\}\s*title="Sanal Klavye"\s*>\s*ABC\s*</button>', '', content)

def add_focus(ref_text, state_key, content):
    replacement = f'ref={{{ref_text}}}\n              onFocus={{() => setIsKeyboardOpen(true)}}'
    if replacement not in content:
        content = content.replace(f'ref={{{ref_text}}}', replacement)
    return content

content = add_focus("searchInputRef", "", content)

# Remove the padding-right trick if needed, or leave it. We had: `pr-12`. `pr-12` is okay since there's an X button for clear.

with open("src/components/pos/PosProductCatalog.tsx", "w", encoding="utf-8") as f:
    f.write(content)
