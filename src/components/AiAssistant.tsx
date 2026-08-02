import * as XLSX from 'xlsx';
import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Loader2, Paperclip, FileText, FileSpreadsheet, Sparkles, AlertCircle, Settings, Bot, HelpCircle, BookOpen } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface AiAssistantProps {
  apiKey: string;
  userRole?: 'admin' | 'employee';
  isSecurityActive?: boolean;
  sensitiveTabs?: string[];
  actionPermissions?: any;
  onNavigateToSettings: () => void;
  onCommandParsed: (command: any) => void;
  financialData?: any;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  isError?: boolean;
  chart?: {
    tip: 'bar' | 'pie';
    data: any[];
  };
}

const AI_EXAMPLES = [
  '"Ahmet Yılmaz\'a 10 adet Monitör sat, birim fiyat 5000 TL"',
  '"Elektrik faturası için 1500 TL masraf gir"',
  '"Ali Kaya\'dan 10000 TL tahsilat yap"',
  '"Tedarikçi AŞ\'ye 25000 TL ödeme yap"',
  '"Ayşe Demir\'e 5000 TL avans ödemesi gir"',
  '"XYZ Lojistik\'ten 50 adet Klavye alışı yap, birim fiyatı 200 TL"',
  '"350 TL Su faturası masrafı ekle"',
  '"Yeni müşteri ekle: Mehmet Demir, Telefon: 0555 123 4567"',
  '"Yeni tedarikçi ekle: ABC Toptan Ticaret, bakiye: -5000 TL"',
  '"Yeni ürün ekle: Kablosuz Mouse, Alış: 150 TL, Satış: 250 TL, Stok: 100 adet"',
  '"Geçen ayki satış analizimi nasıl görebilirim?"'
];

export default function AiAssistant({ 
  apiKey, 
  userRole = 'employee',
  isSecurityActive = false,
  sensitiveTabs = [],
  actionPermissions = {},
  onNavigateToSettings, 
  onCommandParsed, 
  financialData 
}: AiAssistantProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');

  // Drag states for floating button on mobile / desktop
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialPos = useRef({ x: 0, y: 0 });
  const hasMovedRef = useRef(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') {
      setIsDragging(false);
      hasMovedRef.current = false;
      return;
    }
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    initialPos.current = { ...position };
    hasMovedRef.current = false;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    if (Math.abs(dx) > 15 || Math.abs(dy) > 15) {
      hasMovedRef.current = true;
    }
    setPosition({
      x: initialPos.current.x + dx,
      y: initialPos.current.y + dy
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.pointerType === 'mouse') {
      setIsOpen(true);
      return;
    }
    if (!isDragging) return;
    setIsDragging(false);
    (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    if (!hasMovedRef.current) {
      setIsOpen(true);
    }
  };

  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const [showGuide, setShowGuide] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{name: string, content: string, type: 'excel' | 'csv' | 'text' | 'json'} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const extension = file.name.split('.').pop()?.toLowerCase();
      let fileType: 'excel' | 'csv' | 'text' | 'json' = 'text';
      let parsedContent = '';

      if (extension === 'xlsx' || extension === 'xls') {
        fileType = 'excel';
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        parsedContent = JSON.stringify(json, null, 2);
      } else if (extension === 'csv') {
        fileType = 'csv';
        parsedContent = await file.text();
      } else if (extension === 'json') {
        fileType = 'json';
        parsedContent = await file.text();
      } else {
        fileType = 'text';
        parsedContent = await file.text();
      }

      if (parsedContent.length > 100000) {
        parsedContent = parsedContent.slice(0, 100000) + '... (Devamı kesildi)';
      }

      setAttachedFile({
        name: file.name,
        content: parsedContent,
        type: fileType
      });
      
    } catch (err) {
      console.error("Dosya okunurken hata:", err);
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    const randomExample = AI_EXAMPLES[Math.floor(Math.random() * AI_EXAMPLES.length)];
    setMessages([
      {
        id: '1',
        role: 'assistant',
        text: `Merhaba! Ben Storm AI. Size nasıl yardımcı olabilirim?\nÖrneğin: ${randomExample}`
      }
    ]);
  }, []);

  useEffect(() => {
    let timerId: ReturnType<typeof setTimeout>;
    if (isOpen) {
      timerId = setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTo({
            top: messagesContainerRef.current.scrollHeight,
            behavior: 'smooth'
          });
        }
      }, 100);
    }
    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [messages, isOpen, isTyping]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !apiKey) return;

    const userMessage = input.trim();
    setInput('');
    let finalUserMessage = userMessage;
    if (attachedFile) {
      finalUserMessage += "\n\n[KULLANICININ EKLENEN DOSYASI: " + attachedFile.name + "]\n" + attachedFile.content + "\n\nBu eklenen dosyayı yukarıdaki finansal soruyla ilişkilendirerek incele veya sorulan soruyu bu dosya verisine göre yanıtla.";
    }

    setMessages(prev => [...prev, { id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, role: 'user', text: userMessage }]);
    setIsTyping(true);
    
    setAttachedFile(null);

    try {
      const today = new Date().toLocaleDateString('tr-TR');

      let dataContext = '';
      if (financialData) {
        try {
          const safeData = JSON.stringify({
            cariler: financialData.cariler?.slice(0, 100),
            stoklar: financialData.stoklar?.slice(0, 100),
            islemler: financialData.islemler?.slice(0, 100),
            ceksenet: financialData.ceksenet?.slice(0, 100),
            expenses: financialData.expenses?.slice(0, 100),
            bankAccounts: financialData.bankAccounts?.slice(0, 100),
          });
          dataContext = "\n\nMevcut Finansal Veriler (JSON Formatında): \n" + safeData.slice(0, 100000) + "\n\nKullanıcı analiz, rapor veya finansal durumla ilgili soru sorarsa bu verilere bakarak cevapla. Eğer soru analiz veya finansal durumla ilgiliyse, 'tip': 'bilgi' yerine 'tip': 'analiz' kullanabilirsin. Eğer uygun bir grafik çizilebiliyorsa (örneğin gider dağılımı, gelir/gider kıyaslaması vb.) şu formatta dön: \n{ \"tip\": \"analiz\", \"mesaj\": \"Açıklayıcı metin\", \"grafik\": { \"tip\": \"bar\" veya \"pie\", \"data\": [{ \"name\": \"Kategori Adı\", \"value\": 1234 }] } }\nEğer grafik gerekmiyorsa sadece 'tip': 'bilgi' ve 'mesaj' dön.";
        } catch(e) {}
      }

      let securityGuideline = '';
      if (isSecurityActive && userRole === 'employee') {
        const restrictedTabsList = sensitiveTabs.map(t => {
          if (t === 'dashboard') return 'Yönetim Paneli (dashboard)';
          if (t === 'kasa') return 'Kasa ve Banka Hesapları (kasa)';
          if (t === 'ceksenet') return 'Çek/Senet Yönetimi (ceksenet)';
          if (t === 'masraflar') return 'Gider Girişi ve Masraflar (masraflar)';
          if (t === 'calisanlar') return 'Personel Yönetimi ve Maaş Ödemeleri (calisanlar)';
          if (t === 'krediler') return 'Krediler Takibi (krediler)';
          if (t === 'raporlar') return 'Detaylı Raporlama ve Analiz (raporlar)';
          if (t === 'ayarlar') return 'Uygulama ve Sistem Ayarları (ayarlar)';
          return t;
        }).join(', ');

        securityGuideline = `
[KRİTİK GÜVENLİK KISITLAMASI]
Aktif kullanıcı rolünüz "Personel" (Sınırlı Yetki) ve güvenlik PIN koruma modu aktiftir.
Erişiminiz dışındaki menüler: [${restrictedTabsList}].
Kullanıcı bu yasaklı alanlardan birine ait bir işlem yapmaya çalışırsa (örneğin: masraf girişi 'masraf', personel ödemesi 'personel', kasa raporu sorma vb.) veya bu menülere gitmek isterse:
KESİNLİKLE bu işlemi gerçekleştirmeyin ve SADECE şu JSON formatını döndürün:
{ "tip": "bilgi", "mesaj": "Yetki Kısıtlaması: Giriş yaptığınız kullanıcı rolü (Personel) nedeniyle bu işlemi gerçekleştirmeye veya bu menüye erişmeye yetkiniz bulunmamaktadır. Lütfen yönetici girişi yapınız." }
`;
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          system_instruction: {
            parts: [{ text: `Sen Storm Muhasebe asistanısın. Kullanıcının girdisini analiz et. Bugünün tarihi: ${today}.${securityGuideline}${dataContext}
Eğer girdi bir finansal işlem (satış, alış, tahsilat, ödeme, masraf, personel maaş/avans ödemesi) içeriyorsa, SADECE şu JSON formatını döndür: 
{ "tip": "islem", "islem": "satis|alis|tahsilat|odeme|masraf|personel", "cariAdi": "string", "urunAdi": "string", "miktar": number, "fiyat": number, "kdv": number, "tarih": "YYYY-MM-DD" }
KDV belirtilmemişse her zaman 0 yap. Otomatik KDV ekleme. Personel ödemelerinde "cariAdi" veya "urunAdi" alanına personelin adını yaz. Masraflarda (ör: su faturası, elektrik) faturanın cinsini "urunAdi" kısmına yaz. Eğer tarih belirtilmemişse veya 'bugün' denilmişse bugünün tarihini ver. Eğer belirsiz bir şey varsa mantıksal tahmin yürüt.

Eğer girdi bir MÜŞTERİ EKLEME/TANIMLAMA isteği ise (ör: "Mehmet Demir adında müşteri ekle, tel: 0555...", "Yeni müşteri tanımla: Can A.Ş.", vb.), SADECE şu JSON formatını döndür:
{ "tip": "islem", "islem": "add_customer", "cariAdi": "Müşteri Adı/Ünvanı", "phone": "Telefon", "email": "E-posta", "address": "Adres", "bakiye": bakiye_varsa_sayi_değilse_0, "currency": "TRY" }

Eğer girdi bir TEDARİKÇİ EKLEME/TANIMLAMA isteği ise (ör: "XYZ Toptan adında tedarikçi ekle", "Yeni tedarikçi tanımla: ABC Gıda, borç bakiye: -3000 TL", vb.), SADECE şu JSON formatını döndür:
{ "tip": "islem", "islem": "add_supplier", "cariAdi": "Tedarikçi Adı/Ünvanı", "phone": "Telefon", "email": "E-posta", "address": "Adres", "bakiye": bakiye_varsa_sayi_değilse_0, "currency": "TRY" }

Eğer girdi bir ÜRÜN / STOK KARTI EKLEME/TANIMLAMA isteği ise (ör: "Kablosuz Mouse ekle, alış 150 TL, satış 250 TL, stok 100 adet, KDV 20%", "Yeni ürün tanımla: Klavye", vb.), SADECE şu JSON formatını döndür:
{ "tip": "islem", "islem": "add_product", "urunAdi": "Ürün Adı", "code": "Stok Kodu (ör: STK-001 gibi, belirtilmemişse boş bırak)", "barcode": "Barkod (varsa)", "unit": "Adet|KG|Litre|Metre|Kutu|Hizmet (belirtilmemişse Adet)", "purchasePrice": number, "salesPrice": number, "kdv": number (belirtilmemişse KESİNLİKLE 0, otomatik KDV ekleme), "miktar": miktar_sayi_değilse_0, "minQuantity": number (kritik limit, belirtilmemişse 5) }

Eğer kullanıcı sadece bir soru soruyorsa, bilgi istiyorsa veya uygulamanın nasıl kullanılacağı hakkında (örneğin: sistem verileri nasıl sıfırlanır, fatura nasıl kesilir, vb.) bir şey diyorsa, SADECE şu JSON formatını döndür:
{ "tip": "bilgi", "mesaj": "Kullanıcıya verilecek açıklayıcı, profesyonel, yönlendirici veya bilgilendirici cevap metni." }

Yalnızca geçerli bir JSON döndür, etrafında markdown (\`\`\`json vb.) kullanma.` }]
          },
          contents: [{ parts: [{ text: finalUserMessage }] }],
          generationConfig: {
            temperature: 0.1,
          }
        })
      });

      if (!response.ok) {
        throw new Error('API isteği başarısız oldu.');
      }

      const data = await response.json();
      const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      try {
        let jsonStr = responseText.trim();
        if (jsonStr.startsWith('```json')) jsonStr = jsonStr.replace(/^```json/, '');
        if (jsonStr.startsWith('```')) jsonStr = jsonStr.replace(/^```/, '');
        if (jsonStr.endsWith('```')) jsonStr = jsonStr.replace(/```$/, '');
        jsonStr = jsonStr.trim();
        
        const parsedCommand = JSON.parse(jsonStr);
        
        if (parsedCommand.tip === 'bilgi' || parsedCommand.tip === 'analiz') {
          setMessages(prev => {
            const arr = [...prev];
            return [...arr, { 
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
              role: 'assistant', 
              text: parsedCommand.mesaj,
              chart: parsedCommand.grafik
            }];
          });
          setIsTyping(false);
          return;
        }

        if (parsedCommand.islem === 'satis') parsedCommand.islem = 'sale';
        else if (parsedCommand.islem === 'alis') parsedCommand.islem = 'purchase';
        else if (parsedCommand.islem === 'tahsilat') parsedCommand.islem = 'collection';
        else if (parsedCommand.islem === 'odeme') parsedCommand.islem = 'payment';
        else if (parsedCommand.islem === 'masraf') parsedCommand.islem = 'expense';
        else if (parsedCommand.islem === 'personel') parsedCommand.islem = 'employee_payment';
        else if (parsedCommand.islem === 'musteri_ekle') parsedCommand.islem = 'add_customer';
        else if (parsedCommand.islem === 'tedarikci_ekle') parsedCommand.islem = 'add_supplier';
        else if (parsedCommand.islem === 'urun_ekle') parsedCommand.islem = 'add_product';

        let targetTab = 'islemler';
        if (parsedCommand.islem === 'expense') targetTab = 'masraflar';
        else if (parsedCommand.islem === 'employee_payment') targetTab = 'calisanlar';
        else if (parsedCommand.islem === 'add_customer' || parsedCommand.islem === 'add_supplier') targetTab = 'cariler';
        else if (parsedCommand.islem === 'add_product') targetTab = 'stoklar';

        if (isSecurityActive && userRole === 'employee' && sensitiveTabs.includes(targetTab)) {
          setMessages(prev => [...prev, { 
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
            role: 'assistant', 
            text: `Yetki Kısıtlaması: Giriş yaptığınız kullanıcı rolü (Personel) nedeniyle bu işlemi gerçekleştirmeye veya "${targetTab.toUpperCase()}" menüsüne erişmeye yetkiniz bulunmamaktadır. Lütfen yönetici girişi yapınız.`,
            isError: true
          }]);
          setIsTyping(false);
          return;
        }

        setMessages(prev => [...prev, { 
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
          role: 'assistant', 
          text: `İşlemi anladım. Yönlendiriyorum ve formu sizin için dolduruyorum...` 
        }]);

        setTimeout(() => {
          onCommandParsed(parsedCommand);
          setIsOpen(false);
        }, 1500);

      } catch (parseError) {
        setMessages(prev => [...prev, { 
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
          role: 'assistant', 
          text: `Anladığım kadarıyla işlem yapamadım. Lütfen daha net bir ifade kullanın. (${responseText})`,
          isError: true
        }]);
      }

    } catch (error: any) {
      console.error("AI Error:", error);
      let errorMsg = "Sistemle iletişim kurulurken bir hata oluştu. Lütfen internet bağlantınızı ve API anahtarınızı kontrol edin.";
      if (error.status === 429) errorMsg = "API limitlerine ulaşıldı. Lütfen daha sonra tekrar deneyin veya kotalarınızı kontrol edin.";
      
      setMessages(prev => [...prev, { 
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, 
        role: 'assistant', 
        text: errorMsg,
        isError: true
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-20 right-1.5 sm:right-4 z-[100]">
      {/* Chat Window */}
      {isOpen && (
        <div className="mb-4 w-[calc(100vw-12px)] sm:w-[380px] bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col animate-slide-up origin-bottom-right">
          {/* Header */}
          <div className="p-4 flex items-center justify-between" style={{ background: 'linear-gradient(to right, var(--accent-800, #991b1b), var(--accent-950, #4c0519))' }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center border relative" style={{ backgroundColor: 'color-mix(in srgb, var(--accent-500, #ef4444) 20%, transparent)', color: 'var(--accent-400, #f87171)', borderColor: 'color-mix(in srgb, var(--accent-500, #ef4444) 30%, transparent)' }}>
                <Bot size={16} />
                <Sparkles size={8} className="absolute -top-1 -right-1 animate-pulse text-yellow-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Storm AI</h3>
                <p className="text-[11px] font-mono font-medium tracking-wide" style={{ color: 'color-mix(in srgb, var(--accent-100, #fee2e2) 90%, white)' }}>Akıllı Asistan</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {apiKey && (
                <button 
                  onClick={() => setShowGuide(!showGuide)}
                  className={`p-1.5 rounded-lg transition-all cursor-pointer ${showGuide ? 'bg-white/20 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'}`}
                  title="Örnek Komutlar Rehberi"
                >
                  <HelpCircle size={18} />
                </button>
              )}
              <button 
                onClick={() => setIsOpen(false)}
                className="text-white/60 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {!apiKey ? (
            <div className="p-6 flex flex-col items-center justify-center text-center h-[50vh] max-h-[300px] sm:h-[300px] sm:max-h-none bg-slate-50">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
                <AlertCircle size={32} />
              </div>
              <h4 className="text-slate-900 font-bold mb-2">API Anahtarı Eksik</h4>
              <p className="text-slate-500 text-sm mb-6">Storm AI'ı kullanabilmek için Ayarlar bölümünden Gemini API anahtarınızı girmeniz gerekmektedir.</p>
              <button
                onClick={() => {
                  setIsOpen(false);
                  onNavigateToSettings();
                }}
                className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold transition shadow-sm cursor-pointer"
              >
                <Settings size={16} />
                Ayarlara Git
              </button>
            </div>
          ) : showGuide ? (
            <div className="flex-1 h-[60vh] max-h-[440px] sm:h-[440px] sm:max-h-none overflow-y-auto bg-slate-50 flex flex-col animate-fade-in">
              {/* Sample Commands Section */}
              <div className="p-4 flex-1 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-rose-800 font-bold text-xs uppercase tracking-wider">
                  <BookOpen size={14} className="text-rose-600" />
                  <span>Kullanabileceğiniz Örnek Komutlar</span>
                </div>
                <p className="text-slate-500 text-[11px] leading-relaxed">
                  Aşağıdaki örnek kalıpları inceleyebilir veya <strong className="text-teal-600 font-semibold">"Kullan"</strong> butonuna basarak metin kutusuna aktarabilirsiniz.
                </p>

                <div className="flex flex-col gap-2.5 mt-1">
                  {/* Category 1 */}
                  <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-2xs">
                    <div className="text-[11px] font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span>💰 Satış & Alış İşlemleri</span>
                      <span className="text-[9px] text-slate-400 font-normal">Form Doldurma</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {[
                        "Ahmet Yılmaz'a 10 adet Monitör sat, birim fiyat 5000 TL",
                        "XYZ Lojistik'ten 50 adet Klavye alışı yap, birim fiyatı 200 TL"
                      ].map((cmd, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-2 p-2 bg-slate-50 hover:bg-teal-50/40 rounded-lg group border border-slate-100/60 transition">
                          <span className="text-xs text-slate-600 leading-normal font-mono select-all">"{cmd}"</span>
                          <button
                            type="button"
                            onClick={() => {
                              setInput(cmd);
                              setShowGuide(false);
                            }}
                            className="text-[10px] text-teal-600 font-bold hover:text-white bg-teal-50 hover:bg-teal-600 px-2 py-1 rounded transition whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Kullan
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category 2 */}
                  <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-2xs">
                    <div className="text-[11px] font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span>🏦 Ödemeler & Tahsilatlar</span>
                      <span className="text-[9px] text-slate-400 font-normal">Kasa & Cari</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {[
                        "Ali Kaya'dan 10000 TL tahsilat yap",
                        "Tedarikçi AŞ'ye 25000 TL ödeme yap",
                        "Ayşe Demir'e 5000 TL avans ödemesi gir"
                      ].map((cmd, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-2 p-2 bg-slate-50 hover:bg-teal-50/40 rounded-lg group border border-slate-100/60 transition">
                          <span className="text-xs text-slate-600 leading-normal font-mono select-all">"{cmd}"</span>
                          <button
                            type="button"
                            onClick={() => {
                              setInput(cmd);
                              setShowGuide(false);
                            }}
                            className="text-[10px] text-teal-600 font-bold hover:text-white bg-teal-50 hover:bg-teal-600 px-2 py-1 rounded transition whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Kullan
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category 3 */}
                  <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-2xs">
                    <div className="text-[11px] font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span>🏷️ Masraf & Kart Ekleme</span>
                      <span className="text-[9px] text-slate-400 font-normal">Yeni Tanımlama</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {[
                        "Elektrik faturası için 1500 TL masraf gir",
                        "Yeni müşteri ekle: Mehmet Demir, Telefon: 0555 123 4567",
                        "Yeni ürün ekle: Kablosuz Mouse, Alış 150 TL, Satış 250 TL"
                      ].map((cmd, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-2 p-2 bg-slate-50 hover:bg-teal-50/40 rounded-lg group border border-slate-100/60 transition">
                          <span className="text-xs text-slate-600 leading-normal font-mono select-all">"{cmd}"</span>
                          <button
                            type="button"
                            onClick={() => {
                              setInput(cmd);
                              setShowGuide(false);
                            }}
                            className="text-[10px] text-teal-600 font-bold hover:text-white bg-teal-50 hover:bg-teal-600 px-2 py-1 rounded transition whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Kullan
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category 4 */}
                  <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-2xs">
                    <div className="text-[11px] font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                      <span>❓ Soru Sorma & Bilgi</span>
                      <span className="text-[9px] text-slate-400 font-normal">Soru & Cevap</span>
                    </div>
                    <div className="flex flex-col gap-2">
                      {[
                        "Kasada ne kadar paramız var?",
                        "Geçen ayki satış analizimi nasıl görebilirim?"
                      ].map((cmd, idx) => (
                        <div key={idx} className="flex items-start justify-between gap-2 p-2 bg-slate-50 hover:bg-teal-50/40 rounded-lg group border border-slate-100/60 transition">
                          <span className="text-xs text-slate-600 leading-normal font-mono select-all">"{cmd}"</span>
                          <button
                            type="button"
                            onClick={() => {
                              setInput(cmd);
                              setShowGuide(false);
                            }}
                            className="text-[10px] text-teal-600 font-bold hover:text-white bg-teal-50 hover:bg-teal-600 px-2 py-1 rounded transition whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Kullan
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky bottom close */}
              <div className="p-3 bg-white border-t border-slate-100 flex justify-end shrink-0 sticky bottom-0 z-10 shadow-md">
                <button
                  type="button"
                  onClick={() => setShowGuide(false)}
                  className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-xl transition shadow-sm cursor-pointer"
                >
                  Sohbete Geri Dön
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Messages Area */}
              <div ref={messagesContainerRef} className="p-4 h-[55vh] max-h-[350px] sm:h-[350px] sm:max-h-none overflow-y-auto bg-slate-50 flex flex-col gap-3">
                {messages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div 
                      className={`max-w-[85%] p-3 rounded-2xl text-sm whitespace-pre-wrap ${
                        msg.role === 'user' 
                          ? 'bg-teal-600 text-white rounded-br-none' 
                          : msg.isError 
                            ? 'bg-red-50 text-red-700 border border-red-100 rounded-bl-none'
                            : 'bg-white text-slate-800 border border-slate-200 shadow-sm rounded-bl-none'
                      }`}
                    >
                      {msg.text}
                      {msg.chart && msg.chart.data && msg.chart.data.length > 0 && (
                        <div className="mt-3 w-full h-[180px] bg-slate-50/50 rounded-xl p-2 border border-slate-100">
                          <ResponsiveContainer width="100%" height="100%">
                            {msg.chart.tip === 'pie' ? (
                              <PieChart>
                                <Pie data={msg.chart.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} fill="#0d9488" label={({name, percent}) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                                  {msg.chart.data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={['#0d9488', '#0f766e', '#14b8a6', '#5eead4', '#ccfbf1'][index % 5]} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val as number)} />
                              </PieChart>
                            ) : (
                              <BarChart data={msg.chart.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                <XAxis dataKey="name" tick={{fontSize: 10}} interval={0} angle={-20} textAnchor="end" height={40} />
                                <YAxis tick={{fontSize: 10}} width={45} tickFormatter={(val) => `${(val/1000).toFixed(0)}k`} />
                                <Tooltip formatter={(val) => new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val as number)} />
                                <Bar dataKey="value" fill="#0d9488" radius={[4, 4, 0, 0]} />
                              </BarChart>
                            )}
                          </ResponsiveContainer>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-white border border-slate-200 shadow-sm p-3 rounded-2xl rounded-bl-none flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="bg-white border-t border-slate-200">
                {attachedFile && (
                  <div className="flex items-center justify-between bg-slate-50 p-2 mx-3 mt-3 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-2 overflow-hidden">
                      {attachedFile.type === 'excel' ? <FileSpreadsheet size={16} className="text-emerald-600" /> : <FileText size={16} className="text-blue-600" />}
                      <span className="text-xs font-medium text-slate-700 truncate max-w-[200px]">{attachedFile.name}</span>
                    </div>
                    <button type="button" onClick={() => setAttachedFile(null)} className="text-slate-400 hover:text-red-500 transition cursor-pointer">
                      <X size={14} />
                    </button>
                  </div>
                )}
                <form onSubmit={handleSubmit} className="p-3 flex gap-2 items-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".xlsx,.xls,.csv,.txt,.json"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-10 h-10 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl flex items-center justify-center transition shrink-0 cursor-pointer"
                    title="Dosya Ekle (Excel, CSV, TXT)"
                  >
                    <Paperclip size={18} />
                  </button>
                  <div className="relative flex-1 flex items-center min-w-0">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Bir işlem veya komut yazın..."
                      className="w-full bg-slate-50 border border-slate-200 focus:border-teal-500 outline-none rounded-xl px-4 py-2.5 text-sm transition text-slate-900"
                      disabled={isTyping}
                    />
                  </div>

                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={!input.trim() || isTyping}
                    className="w-10 h-10 bg-teal-600 hover:bg-teal-700 text-white rounded-xl flex items-center justify-center transition disabled:opacity-50 disabled:hover:bg-teal-600 shrink-0 cursor-pointer"
                  >
                    {isTyping ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      )}

      {/* Floating Button */}
      {!isOpen && (
        <div 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          className="flex flex-col items-center gap-1 relative group mt-2 select-none touch-none"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
            cursor: isDragging ? 'grabbing' : 'grab',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out'
          }}
        >
          {/* Tooltip-like or subtext */}
          <div className="absolute -top-8 text-white text-[8px] px-2 py-1 rounded-md shadow-xl font-bold uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-20" style={{ backgroundColor: 'var(--accent-600, #dc2626)' }}>
            SİZE NASIL YARDIMCI OLABİLİRİM?
          </div>
          
          <div className="relative">
            {/* Outer glowing rings */}
            <div className="absolute inset-0 rounded-full animate-ping opacity-30 animate-duration-2000" style={{ backgroundColor: 'var(--accent-500, #ef4444)' }}></div>
            <div className="absolute -inset-0.5 rounded-full animate-pulse opacity-20" style={{ backgroundColor: 'var(--accent-400, #f87171)' }}></div>
            
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsOpen(true);
              }}
              className="w-10 h-10 md:w-[58px] md:h-[58px] text-white rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 border-2 border-white/90 relative hover:brightness-125 z-10 cursor-pointer"
              style={{ 
                background: 'linear-gradient(135deg, var(--accent-400, #f87171), var(--accent-600, #dc2626), var(--accent-900, #7f1d1d))',
                boxShadow: '0 0 10px color-mix(in srgb, var(--accent-500, #ef4444) 80%, transparent), inset 0 0 5px rgba(255,255,255,0.5)'
              }}
            >
              <div className="relative flex items-center justify-center md:scale-[1.45]">
                <Bot size={18} className="text-white drop-shadow-[0_0_5px_rgba(255,255,255,1)] transition-transform group-hover:rotate-12" />
                <Sparkles size={8} className="absolute -top-1.5 -right-1.5 text-yellow-300 animate-bounce" style={{ animationDuration: '2.5s' }} />
                <Sparkles size={7} className="absolute -bottom-1 -left-1.5 text-yellow-100 animate-pulse" />
              </div>
              <div className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full border border-white animate-pulse shadow-[0_0_5px_#22c55e] z-20" style={{ backgroundColor: '#22c55e' }}></div>
            </button>
          </div>

          <span className="storm-ai-badge hidden sm:inline-flex items-center gap-1 text-[9px] font-extrabold text-slate-700 dark:text-slate-200 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-2.5 py-0.5 rounded-full shadow-md border border-slate-200/80 dark:border-slate-700/80 uppercase tracking-widest text-center">
            STORM AI
          </span>
        </div>
      )}
    </div>
  );
}
