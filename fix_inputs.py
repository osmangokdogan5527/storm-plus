import re

def fix_file(filepath):
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Fix the broken arrow function
    content = content.replace('onFocus={() = autoComplete="off" >', 'onFocus={() =>')
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

fix_file("src/components/cariler/CariModal.tsx")
fix_file("src/components/stoklar/StockModal.tsx")
