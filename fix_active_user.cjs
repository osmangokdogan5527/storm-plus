const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');
code = code.replace(
  /const isNameCustomized = savedUser\.name && !legacyNames\.includes\(savedUser\.name\) && savedUser\.name !== defaultUser\.name;/,
  "const isNameCustomized = savedUser.name && !legacyNames.includes(savedUser.name) && savedUser.name !== defaultUser.name;"
);
fs.writeFileSync('src/App.tsx', code);
