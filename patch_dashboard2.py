import re

with open("src/components/DashboardView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

pattern = r"(// 1\. Add normal transactions \(islemler\)\n\s*islemler\.forEach\(\(islem\) => \{\n)"
replacement = r"\1      // HOTFIX: Eski online sipariş satışlarının (POS olarak kaydedilenlerin) finansal hareketlerde görünmesini engelle\n      if (islem.type === 'sale' && islem.cariId && islem.cariId.startsWith('plat_cari_')) return;\n"
content = re.sub(pattern, replacement, content)

with open("src/components/DashboardView.tsx", "w", encoding="utf-8") as f:
    f.write(content)
