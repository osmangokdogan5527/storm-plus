import fs from 'fs';
let c = fs.readFileSync('src/components/stoklar/StockModal.tsx', 'utf8');

const regex = /useEffect\(\(\) => \{\s*if \(\!isOpen\) return;[\s\S]*?\}, \[isOpen, editingStock, \(stoklar \|\| \[\]\)\.length\]\);/g;

const replacement = `useEffect(() => {
    if (!isOpen) {
      if (!editingStock) {
        setFormData({
          name: '',
          code: \`STK-\${String((stoklar || []).length + 1).padStart(4, '0')}\`,
          barcode: '',
          imageUrl: '',
          unit: 'Adet',
          purchasePrice: 0,
          salesPrice: 0,
          taxRate: 0,
          quantity: 0,
          minQuantity: 5,
          category: '',
          brand: ''
        });
      }
      return;
    }

    if (editingStock) {
      setFormData({
        name: editingStock.name,
        code: editingStock.code,
        barcode: editingStock.barcode || '',
        imageUrl: editingStock.imageUrl || '',
        unit: editingStock.unit,
        purchasePrice: editingStock.purchasePrice,
        salesPrice: editingStock.salesPrice,
        taxRate: editingStock.taxRate,
        quantity: editingStock.quantity,
        minQuantity: editingStock.minQuantity,
        category: editingStock.category || '',
        brand: editingStock.brand || ''
      });
    } else {
      setFormData({
        name: '',
        code: \`STK-\${String((stoklar || []).length + 1).padStart(4, '0')}\`,
        barcode: '',
        imageUrl: '',
        unit: 'Adet',
        purchasePrice: 0,
        salesPrice: 0,
        taxRate: 0,
        quantity: 0,
        minQuantity: 5,
        category: '',
        brand: ''
      });
    }
    setFormError('');
  }, [isOpen, editingStock, (stoklar || []).length]);`;

c = c.replace(regex, replacement);
fs.writeFileSync('src/components/stoklar/StockModal.tsx', c);
