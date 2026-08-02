const fs = require('fs');

let file = fs.readFileSync('src/components/pos/PosView.tsx', 'utf8');

// 1. Change col-span for iskonto
file = file.replace('className="md:col-span-5 space-y-1.5"', 'className="md:col-span-9 space-y-1.5"');

// 2. Remove para birimi block
// This starts at {/* 3. ÖDENECEK PARA BİRİMİ SEÇİMİ */} and ends at <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center border-y border-slate-800 py-3.5">
const startStr = "{/* 3. ÖDENECEK PARA BİRİMİ SEÇİMİ */}";
const endStr = "{/* HESAPLAMA ÖZETİ & EKRAN GÖSTERGESİ (2 KOLONLU DÜZEN) */}";

const startIdx = file.indexOf(startStr);
const endIdx = file.indexOf(endStr);

if (startIdx !== -1 && endIdx !== -1) {
    file = file.substring(0, startIdx) + file.substring(endIdx);
}

// 3. Remove state variables
file = file.replace(/const \[selectedCurrency, setSelectedCurrency\] = useState\<'TRY' \| 'USD' \| 'EUR'\>\('TRY'\);/g, "const selectedCurrency = 'TRY';");
file = file.replace(/const \[exchangeRates\] = useState\<\{ USD: number; EUR: number \}\>\(\{\n    USD: 38\.50,\n    EUR: 41\.20,\n  \}\);/g, "");
file = file.replace(/const \[customRate, setCustomRate\] = useState\<string\>\(''\);/g, "");

// 4. Also remove the 2nd usage which might be in the table/adisyon view, around line 1500?
// Actually wait, let's use a regex to delete any similar start/end blocks.
const startStr2 = "{/* 3. ÖDENECEK PARA BİRİMİ SEÇİMİ */}";
const startIdx2 = file.indexOf(startStr2, startIdx + 1);
if (startIdx2 !== -1) {
    const endIdx2 = file.indexOf(endStr, endIdx + 1);
    if (endIdx2 !== -1) {
        file = file.substring(0, startIdx2) + file.substring(endIdx2);
    }
}

fs.writeFileSync('src/components/pos/PosView.tsx', file, 'utf8');
console.log('Fixed PosView');
