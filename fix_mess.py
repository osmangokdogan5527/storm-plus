import os
def fix_file(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    content = content.replace('onChange={(e) = autoComplete="off" >', 'onChange={(e) =>')
    # Maybe some had inputMode attached?
    content = content.replace('onChange={(e) = inputMode="none" >', 'onChange={(e) =>')
    
    # Just in case, clean up any weird > replacements:
    content = content.replace('= autoComplete="off" >', '=>')
    content = content.replace('= inputMode="none" >', '=>')
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

fix_file("src/components/cariler/CariModal.tsx")
fix_file("src/components/stoklar/StockModal.tsx")
