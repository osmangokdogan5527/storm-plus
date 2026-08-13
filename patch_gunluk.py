import re

with open("src/components/GunlukSatisRaporuView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix for channelsMap logic (line ~368)
pattern1 = r"(if \(islem\.account === 'cash'\) \{\n\s*channelsMap\.cash\.orderCount \+= 1;\n\s*channelsMap\.cash\.grossAmount \+= gross;\n\s*channelsMap\.cash\.netAmount \+= gross;\n\s*\}) else if \(islem\.account === 'pos'\) \{\n\s*channelsMap\.pos\.orderCount \+= 1;\n\s*channelsMap\.pos\.grossAmount \+= gross;\n\s*channelsMap\.pos\.netAmount \+= gross;\n\s*\}"
replacement1 = r"\1 else if (islem.account === 'pos' && !(islem.cariId && islem.cariId.startsWith('plat_cari_'))) {\n            channelsMap.pos.orderCount += 1;\n            channelsMap.pos.grossAmount += gross;\n            channelsMap.pos.netAmount += gross;\n          }"
content = re.sub(pattern1, replacement1, content)

# Fix for detailed sales list logic (line ~478)
pattern2 = r"(if \(!platformReceiptNos\.has\(invNo\)\) \{\n\s*let chName = 'Nakit Satış';\n\s*let chKey = 'cash';\n\s*if )\(islem\.account === 'pos'\) \{"
replacement2 = r"\1(islem.cariId?.startsWith('plat_cari_')) {\n            chName = islem.cariName || 'Online Satış';\n            chKey = 'platform';\n          } else if (islem.account === 'pos') {"
content = re.sub(pattern2, replacement2, content)

# Remove the duplicate else if for platform since we moved it up
pattern3 = r"\} else if \(islem\.cariId\?\.startsWith\('plat_cari_'\)\) \{\n\s*chName = islem\.cariName \|\| 'Online Satış';\n\s*chKey = 'platform';\n\s*"
replacement3 = r""
content = re.sub(pattern3, replacement3, content)

with open("src/components/GunlukSatisRaporuView.tsx", "w", encoding="utf-8") as f:
    f.write(content)
