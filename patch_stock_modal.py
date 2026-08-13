import re

with open("src/components/stoklar/StockModal.tsx", "r", encoding="utf-8") as f:
    content = f.read()

def replace_input(input_id, state_key, content):
    pattern = rf'(<input\s+id="{input_id}".*?/>)'
    def repl(m):
        btn = f'\n<button type="button" onClick={{() => {{ setKeyboardTarget(\'{state_key}\'); setIsKeyboardOpen(true); }}}} className="absolute right-2 top-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-2 py-1 rounded transition-colors" title="Sanal Klavye">ABC</button>'
        return f'<div className="relative">{m.group(1)}{btn}</div>'
    return re.sub(pattern, repl, content, flags=re.DOTALL)

content = replace_input("form-stock-name", "name", content)
content = replace_input("form-stock-category", "category", content)
content = replace_input("form-stock-brand", "brand", content)

with open("src/components/stoklar/StockModal.tsx", "w", encoding="utf-8") as f:
    f.write(content)
