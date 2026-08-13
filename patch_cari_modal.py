import re

with open("src/components/cariler/CariModal.tsx", "r", encoding="utf-8") as f:
    content = f.read()

import_line = "import { VirtualKeyboard } from '../VirtualKeyboard';\n"
if "VirtualKeyboard" not in content:
    content = content.replace("import React, { useState, useEffect } from 'react';", "import React, { useState, useEffect } from 'react';\n" + import_line)

state_hooks = """
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardTarget, setKeyboardTarget] = useState<'name' | 'phone' | 'email' | 'taxOffice' | 'taxNo' | 'code'>('name');
  
  const handleKeyboardConfirm = (val: string) => {
    setFormData(prev => ({ ...prev, [keyboardTarget]: val }));
  };
"""
if "isKeyboardOpen" not in content:
    content = re.sub(r'(const \[formError, setFormError\] = useState\(\'\'\);)', state_hooks + r'\n  \1', content)

def replace_input(input_id, state_key, content):
    pattern = rf'(<input\s+id="{input_id}".*?/>)'
    def repl(m):
        btn = f'\n<button type="button" onClick={{() => {{ setKeyboardTarget(\'{state_key}\'); setIsKeyboardOpen(true); }}}} className="absolute right-2 top-2 bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-2 py-1 rounded transition-colors" title="Sanal Klavye">ABC</button>'
        return f'<div className="relative">{m.group(1)}{btn}</div>'
    return re.sub(pattern, repl, content, flags=re.DOTALL)

content = replace_input("form-cari-name", "name", content)
content = replace_input("form-cari-phone", "phone", content)
content = replace_input("form-cari-email", "email", content)
content = replace_input("form-cari-tax-office", "taxOffice", content)

if "<VirtualKeyboard" not in content:
    kb_component = """
        <VirtualKeyboard
          isOpen={isKeyboardOpen}
          onClose={() => setIsKeyboardOpen(false)}
          initialValue={formData[keyboardTarget as keyof typeof formData] as string}
          onConfirm={handleKeyboardConfirm}
          title={keyboardTarget === 'name' ? 'Ünvan/Ad' : 'Giriş'}
        />
      </div>
    </div>
"""
    content = re.sub(r'      </div>\s*</div>\s*$', kb_component, content)

with open("src/components/cariler/CariModal.tsx", "w", encoding="utf-8") as f:
    f.write(content)
