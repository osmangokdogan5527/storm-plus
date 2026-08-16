import fs from 'fs';
import path from 'path';

const files = [
  'src/components/raporlar/useRaporlarStats.ts',
  'src/components/pos/PosView.tsx',
  'src/components/KasaView.tsx',
  'src/components/OnlineMarketlerView.tsx',
  'src/components/GunlukSatisRaporuView.tsx',
  'src/components/IslemlerView.tsx',
  'src/components/RaporlarView.tsx',
  'src/components/MasraflarView.tsx',
  'src/components/CalisanlarView.tsx',
  'src/utils/posUtils.ts',
  'src/App.tsx'
];

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/utils\/dateUtils/g, 'utils/DateUtils');
  fs.writeFileSync(file, content);
}
