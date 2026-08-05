const fs = require('fs');
let code = fs.readFileSync('src/constants.tsx', 'utf8');
code = code.replace(
  /{ name: 'Kullanıcı 1', pin: '111111', email: 'admin@storm.com', password: 'storm_admin_pass' }/,
  "{ name: 'OSES KARTALTEPE', pin: '111111', email: 'admin@storm.com', password: 'storm_admin_pass' }"
);
fs.writeFileSync('src/constants.tsx', code);
