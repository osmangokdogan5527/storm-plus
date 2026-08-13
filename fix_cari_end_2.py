import re

with open("src/components/cariler/CariModal.tsx", "r", encoding="utf-8") as f:
    content = f.read()

pattern = r'      <VirtualKeyboard[\s\S]*?/>\s*</div>\s*</div>\s*\}\)\s*</>\s*\);\s*\}'

replacement = """      <VirtualKeyboard
        isOpen={isKeyboardOpen}
        onClose={() => setIsKeyboardOpen(false)}
        initialValue={formData[keyboardTarget as keyof typeof formData] as string || ""}
        onConfirm={handleKeyboardConfirm}
        title={keyboardTarget === 'name' ? 'Ünvan/Ad' : 'Giriş'}
      />
    </>
  );
}"""

content = re.sub(pattern, replacement, content)

with open("src/components/cariler/CariModal.tsx", "w", encoding="utf-8") as f:
    f.write(content)
