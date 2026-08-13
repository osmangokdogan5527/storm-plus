import os
import re

def patch_file(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Replace multiple autoComplete="off" if any
    content = content.replace(' autoComplete="off"  autoComplete="off" />', ' autoComplete="off" />')
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

patch_file("src/components/cariler/CariModal.tsx")
patch_file("src/components/stoklar/StockModal.tsx")
