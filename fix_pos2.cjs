const fs = require('fs');

let file = fs.readFileSync('src/components/pos/PosView.tsx', 'utf8');

file = file.replace('              {/* HESAPLAMA ÖZETİ & EKRAN GÖSTERGESİ (2 KOLONLU DÜZEN) */}', '            </div>\n              {/* HESAPLAMA ÖZETİ & EKRAN GÖSTERGESİ (2 KOLONLU DÜZEN) */}');

fs.writeFileSync('src/components/pos/PosView.tsx', file, 'utf8');
console.log('Fixed pos missing div');
