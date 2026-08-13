import re

def fix_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Add autoComplete off properly
    def add_auto(m):
        if 'autoComplete="off"' not in m.group(0):
            return m.group(1) + ' autoComplete="off" />'
        return m.group(0)

    # find <input ... /> safely
    content = re.sub(r'(<input\b(?:[^>"\']|"[^"]*"|\'[^\']*\')*?)\s*/>', add_auto, content)
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

fix_file("src/components/cariler/CariModal.tsx")
fix_file("src/components/stoklar/StockModal.tsx")
