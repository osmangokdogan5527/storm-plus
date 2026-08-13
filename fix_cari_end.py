import re

with open("src/components/cariler/CariModal.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace the messy end with a clean one
messy_end = """      )}
      <VirtualKeyboard
        isOpen={isKeyboardOpen}
        onClose={() => setIsKeyboardOpen(false)}
        initialValue={formData[keyboardTarget as keyof typeof formData] as string || ""}
        onConfirm={handleKeyboardConfirm}
        title={keyboardTarget === 'name' ? 'Ünvan/Ad' : 'Giriş'}
      />
          </div>
        </div>
      )}
          </>
  );
}"""

clean_end = """      )}
      <VirtualKeyboard
        isOpen={isKeyboardOpen}
        onClose={() => setIsKeyboardOpen(false)}
        initialValue={formData[keyboardTarget as keyof typeof formData] as string || ""}
        onConfirm={handleKeyboardConfirm}
        title={keyboardTarget === 'name' ? 'Ünvan/Ad' : 'Giriş'}
      />
    </>
  );
}"""

content = content.replace(messy_end, clean_end)

with open("src/components/cariler/CariModal.tsx", "w", encoding="utf-8") as f:
    f.write(content)
