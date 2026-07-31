const fs = require('fs');

let content = fs.readFileSync('src/components/pos/PosSplitPaymentModal.tsx', 'utf8');

if (!content.includes('PosNumpadModal')) {
    content = content.replace(
        "import { BankAccount, Cari } from '../../types';",
        "import { BankAccount, Cari } from '../../types';\nimport { PosNumpadModal } from './PosNumpadModal';"
    );
}

if (!content.includes('numpadState')) {
    content = content.replace(
        "const [cashReceived, setCashReceived] = useState<number>(0);",
        "const [cashReceived, setCashReceived] = useState<number>(0);\n  const [numpadState, setNumpadState] = useState<{ isOpen: boolean; type: 'cash' | 'cashReceived' | 'pos' | 'open'; initialValue: number } | null>(null);"
    );
}

if (!content.includes('<PosNumpadModal')) {
    content = content.replace(
        "{/* HEADER */}",
        `{/* NUMPAD MODAL */}
      {numpadState && (
        <PosNumpadModal
          isOpen={numpadState.isOpen}
          onClose={() => setNumpadState(null)}
          title={
            numpadState.type === 'cash' ? 'Nakit Tutar (₺)' :
            numpadState.type === 'cashReceived' ? 'Alınan Nakit (₺)' :
            numpadState.type === 'pos' ? 'POS Tutarı (₺)' :
            'Açık Hesap Tutarı (₺)'
          }
          initialValue={numpadState.initialValue}
          onConfirm={(val) => {
            if (numpadState.type === 'cash') {
              setCashAmount(Math.max(0, val));
              if (cashReceived < val) setCashReceived(Math.max(0, val));
            } else if (numpadState.type === 'cashReceived') {
              setCashReceived(Math.max(0, val));
            } else if (numpadState.type === 'pos') {
              setPosAmount(Math.max(0, val));
            } else if (numpadState.type === 'open') {
              setOpenAccountAmount(Math.max(0, val));
            }
          }}
        />
      )}

      {/* HEADER */}`
    );
}

// Replace cash input
content = content.replace(
    /<input[\s\S]*?value=\{cashAmount \|\| ''\}[\s\S]*?onChange=\{\(e\) => \{[\s\S]*?\}\}[\s\S]*?\/>/,
    `<button
                    onClick={() => setNumpadState({ isOpen: true, type: 'cash', initialValue: cashAmount })}
                    className="w-full text-left px-3 py-2 bg-slate-950 border border-slate-600 rounded-lg text-white font-mono text-sm font-bold focus:outline-none focus:border-teal-400 min-h-[38px]"
                  >
                    {cashAmount || '0.00'}
                  </button>`
);

// Replace cashReceived input
content = content.replace(
    /<input[\s\S]*?value=\{cashReceived \|\| ''\}[\s\S]*?onChange=\{\(e\) => setCashReceived\(Math\.max\(0, Number\(e\.target\.value\) \|\| 0\)\)\}[\s\S]*?\/>/,
    `<button
                    onClick={() => setNumpadState({ isOpen: true, type: 'cashReceived', initialValue: cashReceived })}
                    className="w-full text-left px-3 py-2 bg-slate-950 border border-slate-600 rounded-lg text-white font-mono text-sm font-bold focus:outline-none focus:border-teal-400 min-h-[38px]"
                  >
                    {cashReceived || '0.00'}
                  </button>`
);

// Replace posAmount input
content = content.replace(
    /<input[\s\S]*?value=\{posAmount \|\| ''\}[\s\S]*?onChange=\{\(e\) => setPosAmount\(Math\.max\(0, Number\(e\.target\.value\) \|\| 0\)\)\}[\s\S]*?\/>/,
    `<button
                    onClick={() => setNumpadState({ isOpen: true, type: 'pos', initialValue: posAmount })}
                    className="w-full text-left px-3 py-2 bg-slate-950 border border-slate-600 rounded-lg text-white font-mono text-sm font-bold focus:outline-none focus:border-blue-400 min-h-[38px]"
                  >
                    {posAmount || '0.00'}
                  </button>`
);

// Replace openAccountAmount input
content = content.replace(
    /<input[\s\S]*?value=\{openAccountAmount \|\| ''\}[\s\S]*?onChange=\{\(e\) => setOpenAccountAmount\(Math\.max\(0, Number\(e\.target\.value\) \|\| 0\)\)\}[\s\S]*?\/>/,
    `<button
                  disabled={!selectedCari}
                  onClick={() => setNumpadState({ isOpen: true, type: 'open', initialValue: openAccountAmount })}
                  className="w-full text-left px-3 py-2 bg-slate-950 border border-slate-600 rounded-lg text-white font-mono text-sm font-bold focus:outline-none focus:border-amber-400 disabled:opacity-50 min-h-[38px]"
                >
                  {!selectedCari ? 'Açık hesap için önce müşteri seçin' : (openAccountAmount || '0.00')}
                </button>`
);

fs.writeFileSync('src/components/pos/PosSplitPaymentModal.tsx', content, 'utf8');
console.log('Done');
