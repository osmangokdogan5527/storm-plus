import { Stock, Cari } from '../types';

export interface PosCartItem {
  id: string; // Benzersiz sepet satır ID'si
  stockId: string;
  stockCode: string;
  stockName: string;
  unit: string;
  unitPrice: number; // Birim Satış Fiyatı (KDV Dahil)
  quantity: number; // Miktar
  discountRate: number; // Satır İskonto Yüzdesi (%)
  discountAmount: number; // Satır İskonto Tutarı (₺)
  totalLine: number; // Satır Toplamı (Net KDV dahil)
  barcode?: string;
  imageUrl?: string;
}

export interface PosPlatformConfig {
  id: string;
  name: string; // Örn: Trendyol Yemek
  key: 'trendyol' | 'yemeksepeti' | 'getir' | 'migros' | 'uber' | string;
  commissionRate: number; // Örn: 15 (%15)
  bgColor: string; // Tailwind background
  borderColor: string; // Tailwind border
  textColor: string; // Tailwind text
  badgeColor: string;
  icon: string; // Emoji veya icon ismi
  active: boolean;
}

export interface PosPaymentSplit {
  cashAmount: number; // Nakit Ödenen Tutar (₺)
  cashReceived: number; // Nakit Verilen/Alınan Para (₺)
  changeGiven: number; // Müşteriye İade Edilen Para Üstü (₺)
  posAmount: number; // Kredi Kartı / POS ile Ödenen Tutar (₺)
  posAccountId?: string; // Seçili POS / Banka Hesabı ID
  openAccountAmount: number; // Açık Hesap / Veresiye Tutar (₺)
  platformName?: string; // Örn: Trendyol Yemek
  platformCommissionRate?: number; // Örn: %15
  platformCommissionAmount?: number; // Örn: 67.50 ₺
  platformNetAmount?: number; // Örn: 382.50 ₺
}

export interface PosParkedSale {
  id: string;
  createdAt: string;
  customerName: string;
  cariId?: string;
  items: PosCartItem[];
  note?: string;
  totalAmount: number;
}

export interface PosSaleSummary {
  receiptNo: string;
  date: string;
  time: string;
  items: PosCartItem[];
  paymentSplit: PosPaymentSplit;
  cariId?: string;
  cariName: string;
  subtotal: number;
  totalDiscount: number;
  totalTax: number;
  grandTotal: number;
  note?: string;
}

export interface PosTable {
  id: string;
  name: string; // Örn: 'Masa 1', 'Masa 2', 'Bahçe 1', 'Teras 3'
  category: string; // Örn: 'Salon', 'Bahçe', 'Teras', 'VIP'
  status: 'empty' | 'occupied' | 'reserved' | 'bill_printed';
  capacity: number; // Örn: 4
  openedAt?: string; // Örn: '19:42'
  waiterName?: string; // Örn: 'Ahmet Yilmaz'
  note?: string; // Örn: '2 Çocuk Sandalyesi'
  items: PosCartItem[];
  customerName?: string;
  cariId?: string;
  discountVal?: number | string;
  discountMode?: 'percent' | 'amount' | 'target' | 'markup_percent' | 'markup_amount';
  billPrintedAt?: string;
}

export const DEFAULT_RESTAURANT_TABLES: PosTable[] = [
  // SALON
  { id: 'salon-1', name: 'Masa 1', category: 'Salon', status: 'empty', capacity: 4, items: [] },
  { id: 'salon-2', name: 'Masa 2', category: 'Salon', status: 'empty', capacity: 4, items: [] },
  { id: 'salon-3', name: 'Masa 3', category: 'Salon', status: 'empty', capacity: 2, items: [] },
  { id: 'salon-4', name: 'Masa 4', category: 'Salon', status: 'empty', capacity: 6, items: [] },
  { id: 'salon-5', name: 'Masa 5', category: 'Salon', status: 'empty', capacity: 4, items: [] },
  { id: 'salon-6', name: 'Masa 6', category: 'Salon', status: 'empty', capacity: 8, items: [] },

  // BAHÇE
  { id: 'bahce-1', name: 'Bahçe 1', category: 'Bahçe', status: 'empty', capacity: 4, items: [] },
  { id: 'bahce-2', name: 'Bahçe 2', category: 'Bahçe', status: 'empty', capacity: 4, items: [] },
  { id: 'bahce-3', name: 'Bahçe 3', category: 'Bahçe', status: 'empty', capacity: 6, items: [] },
  { id: 'bahce-4', name: 'Bahçe 4', category: 'Bahçe', status: 'empty', capacity: 2, items: [] },

  // TERAS
  { id: 'teras-1', name: 'Teras 1', category: 'Teras', status: 'empty', capacity: 4, items: [] },
  { id: 'teras-2', name: 'Teras 2', category: 'Teras', status: 'empty', capacity: 4, items: [] },
  { id: 'teras-3', name: 'Teras 3', category: 'Teras', status: 'empty', capacity: 6, items: [] },

  // VIP & BAR
  { id: 'vip-1', name: 'VIP Salon 1', category: 'VIP', status: 'empty', capacity: 12, items: [] },
  { id: 'vip-2', name: 'VIP Salon 2', category: 'VIP', status: 'empty', capacity: 10, items: [] },
  { id: 'bar-1', name: 'Bar / Karşılama 1', category: 'Bar', status: 'empty', capacity: 2, items: [] },
];

export const DEFAULT_POS_PLATFORMS: PosPlatformConfig[] = [
  {
    id: 'yemeksepeti',
    key: 'yemeksepeti',
    name: 'Yemeksepeti',
    commissionRate: 38,
    bgColor: 'bg-rose-600 hover:bg-rose-500',
    borderColor: 'border-rose-400',
    textColor: 'text-white',
    badgeColor: 'bg-rose-950 text-rose-300 border-rose-500',
    icon: '🔴',
    active: true,
  },
  {
    id: 'getir',
    key: 'getir',
    name: 'Getir',
    commissionRate: 38,
    bgColor: 'bg-purple-600 hover:bg-purple-500',
    borderColor: 'border-purple-400',
    textColor: 'text-white',
    badgeColor: 'bg-purple-950 text-purple-300 border-purple-500',
    icon: '🟣',
    active: true,
  },
  {
    id: 'trendyol',
    key: 'trendyol',
    name: 'Trendyol',
    commissionRate: 38,
    bgColor: 'bg-orange-600 hover:bg-orange-500',
    borderColor: 'border-orange-400',
    textColor: 'text-white',
    badgeColor: 'bg-orange-950 text-orange-300 border-orange-500',
    icon: '🟠',
    active: true,
  },
  {
    id: 'migros',
    key: 'migros',
    name: 'Migros Yemek',
    commissionRate: 38,
    bgColor: 'bg-amber-600 hover:bg-amber-500',
    borderColor: 'border-amber-400',
    textColor: 'text-white',
    badgeColor: 'bg-amber-950 text-amber-300 border-amber-500',
    icon: '🟡',
    active: true,
  },
  {
    id: 'uber',
    key: 'uber',
    name: 'Uber Eats',
    commissionRate: 38,
    bgColor: 'bg-emerald-600 hover:bg-emerald-500',
    borderColor: 'border-emerald-400',
    textColor: 'text-white',
    badgeColor: 'bg-emerald-950 text-emerald-300 border-emerald-500',
    icon: '🟢',
    active: true,
  },
];
