import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

pattern = r"bankAccountId: saleData.paymentSplit.posAccountId,"

replacement = r"bankAccountId: isPlatformSale ? undefined : saleData.paymentSplit.posAccountId,"

content = re.sub(pattern, replacement, content)

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(content)
