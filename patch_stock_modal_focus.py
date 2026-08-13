import re

with open("src/components/stoklar/StockModal.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Remove ABC buttons
content = re.sub(r'<button type="button" onClick=\{.*?\} className="absolute right-2 top-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-2 py-1 rounded transition-colors" title="Sanal Klavye">ABC</button>', '', content)

def add_focus(input_id, state_key, content):
    replacement = f'id="{input_id}"\n                    onFocus={{() => {{ setKeyboardTarget(\'{state_key}\'); setIsKeyboardOpen(true); }}}}'
    if replacement not in content:
        content = content.replace(f'id="{input_id}"', replacement)
    return content

content = add_focus("form-stock-name", "name", content)
content = add_focus("form-stock-category", "category", content)
content = add_focus("form-stock-brand", "brand", content)

with open("src/components/stoklar/StockModal.tsx", "w", encoding="utf-8") as f:
    f.write(content)
