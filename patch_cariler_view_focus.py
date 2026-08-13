import re

with open("src/components/CarilerView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Remove ABC buttons
content = re.sub(r'<button type="button" onClick=\{.*?\} className="absolute right-2 top-[^"]+" title="Sanal Klavye">ABC</button>', '', content)

def add_focus(input_id, state_key, content):
    replacement = f'id="{input_id}"\n            onFocus={{() => setIsKeyboardOpen(true)}}'
    if replacement not in content:
        content = content.replace(f'id="{input_id}"', replacement)
    return content

content = add_focus("search-cari", "", content)

# Remove the padding-right trick if needed, or leave it. We had: `pr-12`. `pr-4` is better without button.
content = content.replace('pr-12', 'pr-4')

with open("src/components/CarilerView.tsx", "w", encoding="utf-8") as f:
    f.write(content)
