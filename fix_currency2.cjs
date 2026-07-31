const fs = require('fs');
let content = fs.readFileSync('src/components/pos/PosView.tsx', 'utf8');

content = content.replace(
  "className={`flex-1 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer text-center active:scale-95 touch-manipulation flex items-center justify-center gap-1 ${",
  "className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-black transition-all cursor-pointer text-center active:scale-95 touch-manipulation flex items-center justify-center gap-1.5 ${"
);

fs.writeFileSync('src/components/pos/PosView.tsx', content, 'utf8');
console.log('Done');
