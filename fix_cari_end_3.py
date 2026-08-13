with open("src/components/cariler/CariModal.tsx", "r", encoding="utf-8") as f:
    lines = f.readlines()

new_lines = []
for line in lines:
    new_lines.append(line)
    if "title={keyboardTarget === 'name' ? 'Ünvan/Ad' : 'Giriş'}" in line:
        new_lines.append("      />\n")
        new_lines.append("    </>\n")
        new_lines.append("  );\n")
        new_lines.append("}\n")
        break

with open("src/components/cariler/CariModal.tsx", "w", encoding="utf-8") as f:
    f.writelines(new_lines)
