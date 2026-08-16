import fs from 'fs';
let c = fs.readFileSync('src/App.tsx', 'utf8');
c = c.replace(/if \(window\.electronAPI\.onUpdateProgress\) \{/g, "if ((window.electronAPI as any).onUpdateProgress) {");
c = c.replace(/cleanupProgress = window\.electronAPI\.onUpdateProgress\(\(progressObj\: any\) => \{/g, "cleanupProgress = (window.electronAPI as any).onUpdateProgress((progressObj: any) => {");
fs.writeFileSync('src/App.tsx', c);
