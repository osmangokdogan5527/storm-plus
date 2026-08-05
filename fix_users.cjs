const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  /const legacyNames = \['XSTORM', 'Yönetici', 'Muhasebe Departmanı', 'Kullanıcı 3', 'Kullanıcı 4', 'Kullanıcı 5'\];/,
  "const legacyNames = ['XSTORM', 'Yönetici', 'Muhasebe Departmanı', 'Kullanıcı 1', 'Kullanıcı 2', 'Kullanıcı 3', 'Kullanıcı 4', 'Kullanıcı 5', 'OSES KARTALTEPE'];"
);
fs.writeFileSync('src/App.tsx', code);
