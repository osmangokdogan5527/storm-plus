import fs from 'fs';
let ayarlar = fs.readFileSync('src/components/AyarlarView.tsx', 'utf8');
ayarlar = ayarlar.replace(/\{settingsSubTab === 'ai' && \([\s\S]*?<AiSettings[\s\S]*?\/>\s*\)\}/, "");
fs.writeFileSync('src/components/AyarlarView.tsx', ayarlar);
