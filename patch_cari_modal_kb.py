with open("src/components/cariler/CariModal.tsx", "r", encoding="utf-8") as f:
    content = f.read()

if "<VirtualKeyboard" not in content:
    kb_component = """
      <VirtualKeyboard
        isOpen={isKeyboardOpen}
        onClose={() => setIsKeyboardOpen(false)}
        initialValue={formData[keyboardTarget as keyof typeof formData] as string}
        onConfirm={handleKeyboardConfirm}
        title={keyboardTarget === 'name' ? 'Ünvan/Ad' : 'Giriş'}
      />
    </>
  );
}
"""
    content = content.replace("          </>\n  );\n}", kb_component)
    # in case of different indentation
    content = content.replace("      )}\n          </>\n  );\n}", "      )}\n" + kb_component)

with open("src/components/cariler/CariModal.tsx", "w", encoding="utf-8") as f:
    f.write(content)
