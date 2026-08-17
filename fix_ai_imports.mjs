import fs from 'fs';

let ayarlar = fs.readFileSync('src/components/AyarlarView.tsx', 'utf8');

// Remove import
ayarlar = ayarlar.replace(/import \{ AiSettings \} from '\.\/settings\/AiSettings';\n?/, "");

// Remove tab button
ayarlar = ayarlar.replace(/<button[\s\S]*?onClick=\{\(\) => setSettingsSubTab\('ai'\)\}[\s\S]*?<\/button>/, "");

// Remove render block
ayarlar = ayarlar.replace(/\{settingsSubTab === 'ai' && \([\s\S]*?<AiSettings[\s\S]*?\/>\s*\}\)/, "");

fs.writeFileSync('src/components/AyarlarView.tsx', ayarlar);


let modals = fs.readFileSync('src/components/AppModals.tsx', 'utf8');

// Remove import
modals = modals.replace(/import AiAssistant from "\.\/AiAssistant";\n?/, "");

// Remove render block
modals = modals.replace(/\{\/\* AI Assistant Chat UI \*\/\}\s*\{user && isAiEnabled && \(\s*<AiAssistant[\s\S]*?\/>\s*\)\}/, "");

fs.writeFileSync('src/components/AppModals.tsx', modals);
