import re

with open("src/components/KasaView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Patch accountBalances calculation
pattern1 = r"(// 2\. Commercial / Invoice transactions \(islemler\)\n\s*islemler\.forEach\(islem => \{\n)"
replacement1 = r"\1      // HOTFIX: Eski online sipariş satışlarının (POS olarak kaydedilenlerin) kasada görünmesini engelle\n      if (islem.type === 'sale' && islem.cariId && islem.cariId.startsWith('plat_cari_')) return;\n"
content = re.sub(pattern1, replacement1, content)

# Patch allMovements calculation
pattern2 = r"(// 1\. Add islemler\n\s*islemler\.forEach\(islem => \{\n)"
replacement2 = r"\1      // HOTFIX: Eski online sipariş satışlarının (POS olarak kaydedilenlerin) kasada görünmesini engelle\n      if (islem.type === 'sale' && islem.cariId && islem.cariId.startsWith('plat_cari_')) return;\n"
content = re.sub(pattern2, replacement2, content)

with open("src/components/KasaView.tsx", "w", encoding="utf-8") as f:
    f.write(content)
