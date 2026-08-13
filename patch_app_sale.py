import re

with open("src/App.tsx", "r", encoding="utf-8") as f:
    content = f.read()

pattern = r'''        account: saleData.paymentSplit.cashAmount > 0
          \? 'cash'
          : saleData.paymentSplit.posAmount > 0
          \? 'pos'
          : '','''

replacement = '''        account: isPlatformSale ? '' : (saleData.paymentSplit.cashAmount > 0
          ? 'cash'
          : saleData.paymentSplit.posAmount > 0
          ? 'pos'
          : ''),'''

content = re.sub(pattern, replacement, content)

with open("src/App.tsx", "w", encoding="utf-8") as f:
    f.write(content)
