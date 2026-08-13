import re

with open("src/components/OnlineMarketlerView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Remove ABC buttons
content = re.sub(r'<button type="button" onClick=\{.*?\} className="absolute right-1\.5 top-[^"]+" title="Sanal Klavye">ABC</button>', '', content)

def add_focus(placeholder, state_key, content):
    replacement = f'placeholder="{placeholder}"\n                onFocus={{() => setIsKeyboardOpen(true)}}'
    if replacement not in content:
        content = content.replace(f'placeholder="{placeholder}"', replacement)
    return content

content = add_focus("Sipariş / Fiş Ara...", "", content)

# Remove the padding-right trick if needed, or leave it. We had: `pr-10`. `pr-3` is better without button.
content = content.replace('pr-10', 'pr-3')

with open("src/components/OnlineMarketlerView.tsx", "w", encoding="utf-8") as f:
    f.write(content)
