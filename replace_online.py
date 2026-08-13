import re

with open("src/components/OnlineMarketlerView.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Imports
content = content.replace("saveOnlineOrder, deleteOnlineOrder, saveOnlinePayout, deleteOnlinePayout,", "")
content = content.replace("import { getActiveWorkspace", "import { getActiveWorkspace, removeTransaction")

# Remove getOnlineOrdersKey and getOnlinePayoutsKey completely
content = re.sub(r'const getOnlineOrdersKey.*?};\n', '', content, flags=re.DOTALL)
content = re.sub(r'const getOnlinePayoutsKey.*?};\n', '', content, flags=re.DOTALL)

# 2. State & Effects
# Find the start of // ONLİNE SİPARİŞLER STATE up to // Platform Eşleştirme Yardımcı Fonksiyonu
start_idx = content.find("// ONLİNE SİPARİŞLER STATE")
end_idx = content.find("// Platform Eşleştirme Yardımcı Fonksiyonu")

replacement = """// ONLİNE SİPARİŞLER STATE
  // Artık sadece islemler (ana muhasebe) referans alınır.
  const safeOrdersCombined = React.useMemo(() => {
    const orders: OnlineMarketOrder[] = [];
    safeIslemler.forEach(islem => {
      if (islem.type === 'sale') {
        let isOnlineOrder = false;
        let pName = '';
        let pId = '';
        let receiptNo = islem.invoiceNo || islem.id;

        if (islem.cariId && islem.cariId.startsWith('plat_cari_')) {
           isOnlineOrder = true;
           pName = islem.cariName || 'Bilinmeyen Platform';
           pId = pName.toLowerCase().replace(/[^a-z0-9]/g, '');
        } else if (islem.description?.includes('POS Hızlı Satış Fişi No:') && islem.description?.includes('(')) {
           const match = islem.description.match(/POS Hızlı Satış Fişi No: (POS-\\d+-\\d+) \\((.+?)\\)/);
           if (match) {
             isOnlineOrder = true;
             receiptNo = match[1];
             pName = match[2];
             pId = pName.toLowerCase().replace(/[^a-z0-9]/g, '');
           }
        } else if (islem.description?.includes('Online Sipariş')) {
           isOnlineOrder = true;
           pName = islem.cariName || 'Bilinmeyen Platform';
           pId = pName.toLowerCase().replace(/[^a-z0-9]/g, '');
        }

        if (isOnlineOrder) {
           const platformConf = safePlatforms.find(p => p.id === pId || p.key === pId || p.name.toLowerCase() === pName.toLowerCase()) || safePlatforms[0];
           const commRate = platformConf ? platformConf.commissionRate : 0;
           
           // POS'tan girilen siparişlerin 'amount'u NET tutardır.
           const netAmount = islem.amount;
           const grossAmount = Number((netAmount / (1 - (commRate / 100))).toFixed(2));
           const commAmount = Number((grossAmount - netAmount).toFixed(2));

           orders.push({
              id: islem.id,
              orderNo: receiptNo,
              platformId: pId,
              platformName: pName,
              date: (islem.date || islem.createdAt || '').split('T')[0],
              time: (islem.date && islem.date.includes('T')) ? islem.date.split('T')[1].substring(0,5) : '12:00',
              customerName: islem.cariName || `${pName} Müşterisi`,
              grossAmount: grossAmount,
              commissionRate: commRate,
              commissionAmount: commAmount,
              netAmount: netAmount,
              items: [],
              status: 'completed',
              note: islem.description,
              createdAt: islem.createdAt || islem.date
           });
        }
      }
    });
    return orders.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
  }, [safeIslemler, safePlatforms]);

  const safePayoutsCombined = React.useMemo(() => {
    const payouts: OnlineMarketPayout[] = [];
    safeIslemler.forEach(islem => {
      if (islem.type === 'collection' && islem.cariId && islem.cariId.startsWith('plat_cari_')) {
         payouts.push({
            id: islem.id,
            payoutNo: islem.invoiceNo || islem.id,
            platformId: islem.cariName?.toLowerCase().replace(/[^a-z0-9]/g, '') || '',
            platformName: islem.cariName || 'Platform',
            date: (islem.date || islem.createdAt || '').split('T')[0],
            amount: islem.amount,
            destinationAccountType: islem.account === 'bank' ? 'bank' : 'cash',
            destinationAccountName: islem.account === 'bank' ? 'Banka Hesabı' : 'Kasa',
            note: islem.description,
            createdAt: islem.createdAt || islem.date
         });
      }
    });
    return payouts.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
  }, [safeIslemler]);

  """

content = content[:start_idx] + replacement + content[end_idx:]

# 3. Fix save / delete
content = content.replace("await saveOnlineOrder(newOrder);", "")
content = content.replace("await saveOnlinePayout(newPayout);", "")

# Fix handleDeleteOrder
delete_order_func = """const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('Bu online sipariş kaydını silmek istediğinizden emin misiniz?')) {
      try {
        const islemToDelete = safeIslemler.find(i => i.id === orderId);
        if (islemToDelete) {
           await removeTransaction(islemToDelete);
           showToast('Sipariş başarıyla silindi.', 'success');
        } else {
           showToast('Sipariş ana işlemlerde bulunamadı.', 'error');
        }
      } catch (err) {
        console.error('Silme hatası:', err);
        showToast('Sipariş silinirken hata oluştu.', 'error');
      }
    }
  };"""
content = re.sub(r'const handleDeleteOrder = async \(orderId: string\) => \{.*?\};\n', delete_order_func, content, flags=re.DOTALL)

# Fix handleDeletePayout
delete_payout_func = """const handleDeletePayout = async (payoutId: string) => {
    if (window.confirm('Bu tahsilat kaydını iptal etmek istediğinizden emin misiniz?')) {
      try {
        const islemToDelete = safeIslemler.find(i => i.id === payoutId);
        if (islemToDelete) {
           await removeTransaction(islemToDelete);
           showToast('Tahsilat başarıyla silindi.', 'success');
        } else {
           showToast('Tahsilat ana işlemlerde bulunamadı.', 'error');
        }
      } catch (err) {
        console.error('Silme hatası:', err);
        showToast('Tahsilat silinirken hata oluştu.', 'error');
      }
    }
  };"""
content = re.sub(r'const handleDeletePayout = async \(payoutId: string\) => \{.*?\};\n', delete_payout_func, content, flags=re.DOTALL)

with open("src/components/OnlineMarketlerView.tsx", "w", encoding="utf-8") as f:
    f.write(content)
