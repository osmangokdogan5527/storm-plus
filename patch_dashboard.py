import re

with open("src/components/DashboardView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

pattern = r"(islemler\.forEach\(\(islem\) => \{\n\s*const cur = islem\.currency \|\| \"TRY\";\n\s*if \(cur !== dashboardCurrency\) return;\n)"
replacement = r"\1\n      // HOTFIX: Eski online sipariş satışlarının (POS olarak kaydedilenlerin) nakit/pos bakiyelerini şişirmesini engelle\n      if (islem.type === 'sale' && islem.cariId && islem.cariId.startsWith('plat_cari_')) return;\n"
content = re.sub(pattern, replacement, content)

with open("src/components/DashboardView.tsx", "w", encoding="utf-8") as f:
    f.write(content)
