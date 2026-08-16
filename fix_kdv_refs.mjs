import fs from 'fs';

let exportUtils = fs.readFileSync('src/components/raporlar/exportUtils.ts', 'utf8');
exportUtils = exportUtils.replace(/, kdvStats/g, "");
// Remove KDV data generation from exportUtils
// Wait, I need to see where kdvData is created in exportUtils.ts
exportUtils = exportUtils.replace(/const kdvData = \[\s*\{ 'KDV Oranı': '%1',[\s\S]*?XLSX\.utils\.book_append_sheet\(wb, ws, 'KDV_Raporu'\);\s*\}/, "");
fs.writeFileSync('src/components/raporlar/exportUtils.ts', exportUtils);

let raporlarView = fs.readFileSync('src/components/RaporlarView.tsx', 'utf8');
raporlarView = raporlarView.replace(/, kdvStats/g, "");
// Remove KDV tabs if they exist
raporlarView = raporlarView.replace(/<button\s*onClick=\{\(\) => setActiveTab\('kdv'\)\}[\s\S]*?<\/button>/, "");
// Remove KDV view rendering
raporlarView = raporlarView.replace(/\{activeTab === 'kdv' && \([\s\S]*?\}\s*\}\)\(\)\}\s*<\/div>\s*\)\}/, "");

fs.writeFileSync('src/components/RaporlarView.tsx', raporlarView);
