import re

with open("src/components/MasraflarView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_line = "import { VirtualKeyboard } from './VirtualKeyboard';\n"
if "VirtualKeyboard" not in content[:1000]: # Check only imports
    content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\n" + import_line)
    if import_line not in content:
        content = content.replace("import React,", "import React,\n" + import_line)

with open("src/components/MasraflarView.tsx", "w", encoding="utf-8") as f:
    f.write(content)
