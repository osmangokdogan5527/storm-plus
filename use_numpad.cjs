const fs = require('fs');

let content = fs.readFileSync('src/components/pos/PosView.tsx', 'utf8');

// Add import
if (!content.includes('PosNumpadModal')) {
    content = content.replace(
        "import { PosReceiptModal } from './PosReceiptModal';",
        "import { PosReceiptModal } from './PosReceiptModal';\nimport { PosNumpadModal } from './PosNumpadModal';"
    );
}

// Add state
if (!content.includes('isDiscountNumpadOpen')) {
    content = content.replace(
        "const [discountVal, setDiscountVal] = useState<number | string>('');",
        "const [discountVal, setDiscountVal] = useState<number | string>('');\n  const [isDiscountNumpadOpen, setIsDiscountNumpadOpen] = useState(false);"
    );
}

// Add Numpad modal
if (!content.includes('<PosNumpadModal')) {
    content = content.replace(
        "{/* İSKONTO GİRİŞ INPUT'U */}",
        `{/* İSKONTO GİRİŞ INPUT'U */}
                <PosNumpadModal
                  isOpen={isDiscountNumpadOpen}
                  onClose={() => setIsDiscountNumpadOpen(false)}
                  title={discountMode === 'percent' ? 'İskonto % Oranı' : discountMode === 'amount' ? 'İskonto Tutarı (₺)' : 'Alınacak Net Tutar (₺)'}
                  initialValue={discountVal}
                  onConfirm={(val) => setDiscountVal(val)}
                  allowDecimal={true}
                />`
    );
}

// Replace input with button
content = content.replace(
    /<input\s+type="number"[\s\S]*?onChange=\{\(e\) => setDiscountVal[^}]+\)\}[\s\S]*?className="w-full pl-3.5 pr-9 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 font-bold focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400"\s+style=\{\{ backgroundColor: '#0f172a', color: '#ffffff' \}\}\s*\/>/,
    `<button
                    onClick={() => setIsDiscountNumpadOpen(true)}
                    className="w-full text-left pl-3.5 pr-9 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-white font-bold hover:border-amber-400 transition-colors flex items-center h-[42px]"
                    style={{ backgroundColor: '#0f172a', color: '#ffffff' }}
                  >
                    {discountVal === '' || discountVal === 0 ? (
                      <span className="text-slate-500">
                        {discountMode === 'percent'
                          ? 'İskonto % Oranı Giriniz...'
                          : discountMode === 'amount'
                          ? 'İskonto Tutarı ₺ Giriniz...'
                          : 'Alınacak Net Tutar ₺ Giriniz...'}
                      </span>
                    ) : (
                      <span>{discountVal}</span>
                    )}
                  </button>`
);

fs.writeFileSync('src/components/pos/PosView.tsx', content, 'utf8');
console.log('Done');
