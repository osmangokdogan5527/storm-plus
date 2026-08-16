import { PosPlatformConfig } from './pos';

export interface OnlineMarketOrder {
  id: string;
  orderNo: string;
  platformId: string;
  platformName: string;
  date: string;
  time: string;
  customerName: string;
  grossAmount: number;
  commissionRate: number;
  commissionAmount: number;
  netAmount: number;
  items?: {
    stockId: string;
    stockName: string;
    quantity: number;
    unitPrice: number;
    totalLine: number;
  }[];
  status: 'completed' | 'cancelled' | 'pending_payout' | 'paid_out';
  note?: string;
  createdAt: string;
}

export interface OnlineMarketPayout {
  id: string;
  payoutNo: string;
  platformId: string;
  platformName: string;
  date: string;
  amount: number;
  destinationAccountType: 'bank' | 'cash';
  destinationAccountId?: string;
  destinationAccountName: string;
  note?: string;
  createdAt: string;
}

export interface OnlineMarketPlatformSummary {
  platform: PosPlatformConfig;
  totalGross: number;
  totalCommission: number;
  totalNet: number;
  totalPaidOut: number;
  pendingBalance: number; // Net Alacak Bakiyesi (totalNet - totalPaidOut)
  orderCount: number;
}
