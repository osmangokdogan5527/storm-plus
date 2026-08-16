import fs from 'fs';
let c = fs.readFileSync('src/hooks/useAppSettings.ts', 'utf8');
c = c.replace(/const \[isAiEnabled, setIsAiEnabled\] = useState<boolean>[\s\S]*?\)\;/g, "");
c = c.replace(/isAiEnabled,\n\s*setIsAiEnabled,/g, "");
c = c.replace(/isAiEnabled\?: boolean;/g, "");
c = c.replace(/setIsAiEnabled\?: \(val\: boolean\) => void;/g, "");
fs.writeFileSync('src/hooks/useAppSettings.ts', c);
