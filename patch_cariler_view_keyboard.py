import re

with open("src/components/CarilerView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_line = "import { VirtualKeyboard } from './VirtualKeyboard';\n"
if "VirtualKeyboard" not in content[:1000]:
    content = content.replace("import React, { useState, useMemo } from 'react';", "import React, { useState, useMemo } from 'react';\n" + import_line)

if "<VirtualKeyboard" not in content:
    kb_component = """
      <VirtualKeyboard
        isOpen={isKeyboardOpen}
        onClose={() => setIsKeyboardOpen(false)}
        initialValue={searchTerm}
        onConfirm={setSearchTerm}
        title="Cari Arama"
        placeholder="Cari adı veya kodu girin..."
      />
    </div>
  );
"""
    content = re.sub(r'    </div>\s*\);\s*}\s*$', kb_component + "}", content)

with open("src/components/CarilerView.tsx", "w", encoding="utf-8") as f:
    f.write(content)
