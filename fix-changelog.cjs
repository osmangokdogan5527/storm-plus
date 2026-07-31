const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/constants.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /"Hızlı Satış Bölüm & Kategori Yönetimi: POS ekranında özel bölüm ekleme, silme ve ürünleri kategorilere esnek atama altyapısı."/,
  '"Hızlı Satış Bölüm & Kategori Yönetimi: POS ekranında özel bölüm ekleme, silme ve ürünleri kategorilere esnek atama altyapısı.",\n      "Tam Ekran Modu: Ayarlar içerisinden uygulamayı tek tıkla tam ekran kullanabilme özelliği eklendi."'
);

fs.writeFileSync(filePath, content, 'utf8');
