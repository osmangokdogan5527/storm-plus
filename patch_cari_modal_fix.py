import re

with open("src/components/cariler/CariModal.tsx", "r", encoding="utf-8") as f:
    content = f.read()

state_hooks = """
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const [keyboardTarget, setKeyboardTarget] = useState<'name' | 'phone' | 'email' | 'taxOffice' | 'taxNo' | 'code'>('name');
  
  const handleKeyboardConfirm = (val: string) => {
    setFormData(prev => ({ ...prev, [keyboardTarget]: val }));
  };
"""
if "const [isKeyboardOpen, setIsKeyboardOpen]" not in content:
    content = re.sub(r'(const \[formError, setFormError\] = useState\(""\);)', state_hooks + r'\n  \1', content)

with open("src/components/cariler/CariModal.tsx", "w", encoding="utf-8") as f:
    f.write(content)
