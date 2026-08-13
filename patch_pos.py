import re

with open("src/components/pos/PosProductCatalog.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Fix the broken import
content = content.replace("import React, { useState } from 'react';\nimport { VirtualKeyboard } from '../VirtualKeyboard'; { useState, useMemo, useEffect } from 'react';", "import React, { useState, useMemo, useEffect } from 'react';\nimport { VirtualKeyboard } from '../VirtualKeyboard';")

with open("src/components/pos/PosProductCatalog.tsx", "w", encoding="utf-8") as f:
    f.write(content)
