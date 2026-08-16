import fs from 'fs';

// IslemModal
let islemModal = fs.readFileSync('src/components/islemler/IslemModal.tsx', 'utf8');
islemModal = islemModal.replace(/\s*taxRate: [0-9]+,?\n/g, "\n");
islemModal = islemModal.replace(/item\.taxRate = [^;]+;/g, "");
islemModal = islemModal.replace(/const tax = item\.taxRate \|\| 0;/g, "const tax = 0;");
islemModal = islemModal.replace(/\* \(1 \+ [^/]+\.taxRate \/ 100\)/g, "");
islemModal = islemModal.replace(/\* \(1 \+ item\.taxRate \/ 100\)/g, "");
islemModal = islemModal.replace(/taxRate,/g, "");
fs.writeFileSync('src/components/islemler/IslemModal.tsx', islemModal);

// StockModal
let stockModal = fs.readFileSync('src/components/stoklar/StockModal.tsx', 'utf8');
stockModal = stockModal.replace(/\s*taxRate: [^,]+,?\n/g, "\n");
fs.writeFileSync('src/components/stoklar/StockModal.tsx', stockModal);

// StoklarView
let stoklarView = fs.readFileSync('src/components/StoklarView.tsx', 'utf8');
stoklarView = stoklarView.replace(/<div[^>]*>KDV Oranı: <strong[^>]*>%\{stok\.taxRate\}<\/strong><\/div>/g, "");
stoklarView = stoklarView.replace(/%\{stok\.taxRate\}/g, "");
fs.writeFileSync('src/components/StoklarView.tsx', stoklarView);

// LedgerDrawer
let ledgerDrawer = fs.readFileSync('src/components/cariler/LedgerDrawer.tsx', 'utf8');
ledgerDrawer = ledgerDrawer.replace(/const taxRateValue = selectedStock\.taxRate \|\| 0;\n/g, "");
ledgerDrawer = ledgerDrawer.replace(/\* \(1 \+ taxRateValue \/ 100\)/g, "");
ledgerDrawer = ledgerDrawer.replace(/\s*taxRate: taxRateValue,\n/g, "\n");
fs.writeFileSync('src/components/cariler/LedgerDrawer.tsx', ledgerDrawer);

// PosView
let posView = fs.readFileSync('src/components/pos/PosView.tsx', 'utf8');
posView = posView.replace(/\s*taxRate: [^,]+,?\n/g, "\n");
posView = posView.replace(/taxRate,/g, "");
fs.writeFileSync('src/components/pos/PosView.tsx', posView);

// PosProductCatalog
let posCatalog = fs.readFileSync('src/components/pos/PosProductCatalog.tsx', 'utf8');
posCatalog = posCatalog.replace(/%\{stock\.taxRate \?\? 0\} KDV/g, "");
fs.writeFileSync('src/components/pos/PosProductCatalog.tsx', posCatalog);

// PosReceiptModal
let posReceipt = fs.readFileSync('src/components/pos/PosReceiptModal.tsx', 'utf8');
posReceipt = posReceipt.replace(/\{activeTemplate\.showItemVat !== false \? \` \(\%\$\{item\.taxRate\} KDV\)\` : ''\}/g, "");
fs.writeFileSync('src/components/pos/PosReceiptModal.tsx', posReceipt);

