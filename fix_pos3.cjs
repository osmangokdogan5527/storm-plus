const fs = require('fs');

let file = fs.readFileSync('src/components/pos/PosView.tsx', 'utf8');

const broken = `  // KUR VE DÖVİZLİ TUTAR HESAPLAMASI
  const currentRate =
    selectedCurrency === 'TRY'
      ? 1
      : customRate !== ''
      ? Math.max(0.0001, Number(customRate))
      : exchangeRates[selectedCurrency] || 1;

  const convertedTotal = summary.grandTotal / currentRate;

  const currencySymbol =
    selectedCurrency === 'TRY'
      ? '₺'
      : selectedCurrency === 'USD'
      ? '$'
      : '€';`;

const fixed = `  // KUR VE DÖVİZLİ TUTAR HESAPLAMASI
  const currentRate = 1;
  const convertedTotal = summary.grandTotal;
  const currencySymbol = '₺';`;

file = file.replace(broken, fixed);
fs.writeFileSync('src/components/pos/PosView.tsx', file, 'utf8');
console.log('Fixed pos usage');
