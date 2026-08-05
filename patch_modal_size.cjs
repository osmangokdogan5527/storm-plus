const fs = require('fs');
let code = fs.readFileSync('src/components/AuthScreen.tsx', 'utf8');

code = code.replace(
  "w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh]",
  "w-full max-w-6xl rounded-2xl shadow-2xl flex flex-col h-[90vh] max-h-[90vh]"
);

fs.writeFileSync('src/components/AuthScreen.tsx', code);
