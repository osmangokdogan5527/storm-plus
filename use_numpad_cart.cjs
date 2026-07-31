const fs = require('fs');

let content = fs.readFileSync('src/components/pos/PosCartTable.tsx', 'utf8');

if (!content.includes('PosNumpadModal')) {
    content = content.replace(
        "import { Trash2, Plus, Minus, AlertTriangle, X } from 'lucide-react';",
        "import { Trash2, Plus, Minus, AlertTriangle, X } from 'lucide-react';\nimport { PosNumpadModal } from './PosNumpadModal';"
    );
}

if (!content.includes('numpadState')) {
    content = content.replace(
        "const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);",
        "const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);\n  const [numpadState, setNumpadState] = useState<{ isOpen: boolean; type: 'quantity' | 'unitPrice'; itemId: string; initialValue: number } | null>(null);"
    );
}

if (!content.includes('<PosNumpadModal')) {
    content = content.replace(
        "{/* Delete Confirmation Modal Overlay */}",
        `{/* Numpad Modal */}
      {numpadState && (
        <PosNumpadModal
          isOpen={numpadState.isOpen}
          onClose={() => setNumpadState(null)}
          title={numpadState.type === 'quantity' ? 'Miktar (Adet) Giriniz' : 'Birim Fiyat Giriniz'}
          initialValue={numpadState.initialValue}
          onConfirm={(val) => {
            if (numpadState.type === 'quantity') {
              onSetQuantity(numpadState.itemId, Math.max(1, val));
            } else {
              onUpdateUnitPrice(numpadState.itemId, Math.max(0, val));
            }
          }}
          allowDecimal={numpadState.type === 'unitPrice'}
        />
      )}

      {/* Delete Confirmation Modal Overlay */}`
    );
}

// Replace unitPrice input
content = content.replace(
    /<input\s+type="number"\s+step="0\.01"\s+min="0"\s+value=\{item\.unitPrice\}[\s\S]*?onChange=\{\(e\) =>\s*onUpdateUnitPrice\(item\.id, Math\.max\(0, Number\(e\.target\.value\) \|\| 0\)\)\s*\}[^>]*\/>/g,
    `<button
                      onClick={() => setNumpadState({ isOpen: true, type: 'unitPrice', itemId: item.id, initialValue: item.unitPrice })}
                      className="pos-number-input w-22 text-left px-2 text-xs sm:text-sm font-black font-mono text-white bg-transparent outline-none cursor-pointer hover:bg-slate-800 rounded"
                      title="Birim Fiyat"
                      style={{ color: '#ffffff' }}
                    >
                      {item.unitPrice}
                    </button>`
);

// Replace quantity input
content = content.replace(
    /<input\s+type="number"\s+min="1"\s+value=\{item\.quantity\}\s+onChange=\{\(e\) => onSetQuantity\(item\.id, Math\.max\(1, Number\(e\.target\.value\) \|\| 1\)\)\}[^>]*\/>/g,
    `<button
                      onClick={() => setNumpadState({ isOpen: true, type: 'quantity', itemId: item.id, initialValue: item.quantity })}
                      className="pos-number-input w-12 text-center text-sm font-black font-mono text-white bg-transparent outline-none cursor-pointer hover:bg-slate-800 rounded h-10"
                      title="Adet"
                      style={{ color: '#ffffff' }}
                    >
                      {item.quantity}
                    </button>`
);

fs.writeFileSync('src/components/pos/PosCartTable.tsx', content, 'utf8');
console.log('Done');
