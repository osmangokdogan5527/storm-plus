import os
import re

def patch_file(filepath):
    if not os.path.exists(filepath): return
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Add autoComplete="off" to all inputs that have onFocus and are triggering the keyboard
    # Actually let's just add it to all inputs in these modals for safety.
    content = re.sub(r'(<input[^>]+id="form-[^"]+"[^>]*?)(/?>)', r'\1 autoComplete="off" \2', content)
    
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)

patch_file("src/components/cariler/CariModal.tsx")
patch_file("src/components/stoklar/StockModal.tsx")
