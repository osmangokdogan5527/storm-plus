const fs = require('fs');

let consts = fs.readFileSync('src/constants.tsx', 'utf8');

consts = consts.replace(/"1\.3\.8 sürümü için geliştirme altyapısı hazırlandı\."/, 
  '"Kritik Senkronizasyon Çözümü: Bilgisayar (Electron) versiyonunda girilen verilerin (müşteri, stok vb.) ön izleme (Web) ekranına düşmesini engelleyen eski önbellek sorunu kesin olarak çözüldü."');

consts = consts.replace(/"1\.3\.8 sürümü geliştirmeleri ve altyapı hazırlıkları başladı\."/, 
  '"Kritik Senkronizasyon Çözümü: Bilgisayar (Electron) versiyonunda oluşturulan müşteri ve stokların web (ön izleme) versiyonunda görünmesini engelleyen yerel önbellek kaynaklı workspace (çalışma alanı) uyumsuzluğu kesin olarak giderildi. Artık veriler anlık ve eksiksiz senkronize olacak."');

fs.writeFileSync('src/constants.tsx', consts);
