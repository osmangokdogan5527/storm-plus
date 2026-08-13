import re

def fix_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Add inputMode="none" properly
    def add_mode(m):
        if 'inputMode="none"' not in m.group(0):
            return m.group(1) + ' inputMode="none" />'
        return m.group(0)

    # find <input ... /> safely
    content = re.sub(r'(<input\b(?:[^>"\']|"[^"]*"|\'[^\']*\')*?)\s*/>', add_mode, content)
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

fix_file("src/components/cariler/CariModal.tsx")
fix_file("src/components/stoklar/StockModal.tsx")
fix_file("src/components/CarilerView.tsx")
fix_file("src/components/StoklarView.tsx")
fix_file("src/components/IslemlerView.tsx")
fix_file("src/components/MasraflarView.tsx")
fix_file("src/components/OnlineMarketlerView.tsx")
fix_file("src/components/pos/PosProductCatalog.tsx")
fix_file("src/components/pos/PosView.tsx")

