import re

with open("src/components/cariler/CariModal.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# cleanup duplicate closures if sed messed up
content = content.replace("          </div>\n        </div>\n      )}\n          </>\n  );\n}", "          </>\n  );\n}")

with open("src/components/cariler/CariModal.tsx", "w", encoding="utf-8") as f:
    f.write(content)
