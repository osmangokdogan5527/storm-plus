import re

with open("src/components/cariler/CariModal.tsx", "r", encoding="utf-8") as f:
    content = f.read()

def add_focus(input_id, state_key, content):
    replacement = f'id="{input_id}"\n                    onFocus={{() => {{ setKeyboardTarget(\'{state_key}\'); setIsKeyboardOpen(true); }}}}'
    if replacement not in content:
        content = content.replace(f'id="{input_id}"', replacement)
    return content

content = add_focus("form-cari-name", "name", content)
content = add_focus("form-cari-phone", "phone", content)
content = add_focus("form-cari-email", "email", content)
content = add_focus("form-cari-tax-office", "taxOffice", content)

with open("src/components/cariler/CariModal.tsx", "w", encoding="utf-8") as f:
    f.write(content)
