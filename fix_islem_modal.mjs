import fs from 'fs';
let c = fs.readFileSync('src/components/islemler/IslemModal.tsx', 'utf8');

const regex = /\/\/ Init state when modal opens or editingTransaction\/null changes[\s\S]*?\}, \[isOpen, editingTransaction,  modalType, preselectedCariId\]\);/g;

const replacement = `// Init state when modal opens or editingTransaction changes
  useEffect(() => {
    if (!isOpen) return;

    if (editingTransaction) {
      setFormError('');
      setSelectedCariId(editingTransaction.cariId);
      setTransactionDate(editingTransaction.date);
      setAccount(editingTransaction.account || '');
      setSelectedBankAccountId(editingTransaction.bankAccountId || '');
      setDescription(editingTransaction.description || '');
      setInvoiceNo(editingTransaction.invoiceNo || '');
      setIsMultiCurrency(!!(editingTransaction.currency && editingTransaction.currency !== 'TRY' && editingTransaction.exchangeRate));
      setTransactionCurrency(editingTransaction.currency || 'TRY');
      setExchangeRate(editingTransaction.exchangeRate || 1);
      if (editingTransaction.exchangeRate && editingTransaction.exchangeRate !== 1) {
          setIsConvertedAmountEdited(true);
          setCustomConvertedAmount(editingTransaction.convertedAmount || (editingTransaction.amount * editingTransaction.exchangeRate));
      } else {
          setIsConvertedAmountEdited(false);
          setCustomConvertedAmount(0);
      }
      if (['sale', 'purchase', 'sale_return', 'purchase_return'].includes(modalType)) {
        if (editingTransaction.items && editingTransaction.items.length > 0) {
          setInvoiceItems(editingTransaction.items);
        } else {
          setInvoiceItems([{ stockId: '', stockName: '', quantity: 1, unit: 'Adet', price: 0, taxRate: 0, total: 0 }]);
        }
      } else {
        setReceiptAmount(editingTransaction.amount);
      }
    } else {
      setFormError('');
      // No editingTransaction means it's a "New" action
      setSelectedCariId(preselectedCariId || '');
      setTransactionDate(new Date().toISOString().substring(0, 10));
      setAccount(['sale', 'purchase', 'sale_return', 'purchase_return'].includes(modalType) ? '' : 'cash');
      setDescription('');
      setReceiptAmount(0);
      
      const pad = (n: number) => String(n).padStart(4, '0');
      const year = new Date().getFullYear();
      
      let prefix = '';
      if (modalType === 'sale') prefix = \`SAT-\${year}-\`;
      else if (modalType === 'purchase') prefix = \`AL-\${year}-\`;
      else if (modalType === 'sale_return') prefix = \`IADE-S-\${year}-\`;
      else if (modalType === 'purchase_return') prefix = \`IADE-A-\${year}-\`;
      
      if (prefix) {
        setInvoiceNo(\`\${prefix}\${pad(Math.floor(Math.random()*10000))}\`); // Simple random or keep blank for now
      } else {
        setInvoiceNo('');
      }
      setInvoiceItems([{ stockId: '', stockName: '', quantity: 1, unit: 'Adet', price: 0, taxRate: 0, total: 0 }]);
    }
  }, [isOpen, editingTransaction, modalType, preselectedCariId]);`;

c = c.replace(regex, replacement);

fs.writeFileSync('src/components/islemler/IslemModal.tsx', c);
