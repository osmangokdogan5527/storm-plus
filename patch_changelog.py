import re

with open("src/constants.tsx", "r", encoding="utf-8") as f:
    content = f.read()

pattern1 = r"(export const CHANGELOG = \{\n\s*version: '1\.4\.1',\n\s*features: \[\n\s*)\"Sürüm 1\.4\.1 Güncellemeleri ve İyileştirmeleri\"(\n\s*\],\n\s*fixes: \[\]\n\};)"
replacement1 = r'\1"Online Market Hakediş Sistemi Entegrasyonu",\n    "Sipariş ve Tahsilat Ayrımı",\n    "Kasada Bakiye Şişmesi Çözümü (Geçmiş Kayıtlar Hotfix)"\2'
content = re.sub(pattern1, replacement1, content)

pattern2 = r"(version: \"1\.4\.1\",\n\s*date: \"13\.08\.2026\",\n\s*changes: \[\n\s*)\"Sürüm 1\.4\.1 Güncellemeleri ve İyileştirmeleri\"(\n\s*\]\n\s*\},\n\s*\{\n\s*version: \"1\.4\.0\")"
replacement2 = r'\1"Online Market (Yemeksepeti, Getir, vb.) süreçleri Hakediş Tahsilatı sistemiyle entegre edildi.",\n      "Pazar yeri siparişlerinin doğrudan POS kasasına girerek bakiyeleri şişirmesi engellendi.",\n      "Online Marketler ekranına \'Tahsilat Al\' özelliği eklendi.",\n      "Geçmiş dönem online siparişlerin POS/Nakit bakiyelerini şişirmesini engelleyen sistem düzeltmesi (hotfix) yapıldı."\2'
content = re.sub(pattern2, replacement2, content)

with open("src/constants.tsx", "w", encoding="utf-8") as f:
    f.write(content)
