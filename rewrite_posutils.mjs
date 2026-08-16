import fs from 'fs';

let content = fs.readFileSync('src/utils/posUtils.ts', 'utf8');

// Replace calculateCartSummary signature and body
content = content.replace(/export function calculateCartSummary\([\s\S]*?\}\s*\}/, `export function calculateCartSummary(
  items: PosCartItem[],
  generalDiscountVal: number = 0,
  discountMode: 'percent' | 'amount' | 'target' | 'markup_percent' | 'markup_amount' = 'percent'
) {
  try {
    let rawTotal = 0;
    let totalLineDiscount = 0;

    items.forEach((item) => {
      const lineGross = item.unitPrice * item.quantity;
      rawTotal += lineGross;
      totalLineDiscount += item.discountAmount || 0;
    });

    const subtotalAfterLineDiscounts = Math.max(0, rawTotal - totalLineDiscount);

    let generalDiscountAmount = 0;
    const val = typeof generalDiscountVal === 'number' ? generalDiscountVal : Number(generalDiscountVal) || 0;

    if (discountMode === 'percent') {
      const rate = Math.min(100, Math.max(0, val));
      generalDiscountAmount = (subtotalAfterLineDiscounts * rate) / 100;
    } else if (discountMode === 'amount') {
      generalDiscountAmount = Math.min(subtotalAfterLineDiscounts, Math.max(0, val));
    } else if (discountMode === 'target') {
      const target = Math.max(0, val);
      if (target > 0 && target < subtotalAfterLineDiscounts) {
        generalDiscountAmount = subtotalAfterLineDiscounts - target;
      } else {
        generalDiscountAmount = 0;
      }
    } else if (discountMode === 'markup_percent') {
      const rate = Math.max(0, val);
      generalDiscountAmount = -((subtotalAfterLineDiscounts * rate) / 100);
    } else if (discountMode === 'markup_amount') {
      generalDiscountAmount = -(Math.max(0, val));
    }

    const grandTotal = Math.max(0, subtotalAfterLineDiscounts - generalDiscountAmount);
    const totalDiscount = totalLineDiscount + generalDiscountAmount;

    return {
      rawTotal,
      totalLineDiscount,
      generalDiscountAmount,
      totalDiscount,
      subtotalAfterLineDiscounts,
      grandTotal: Number(grandTotal.toFixed(2)),
    };
  } catch (err: any) {
    reportErrorToTelegram(err, 'posUtils:calculateCartSummary');
    return {
      rawTotal: 0,
      totalLineDiscount: 0,
      generalDiscountAmount: 0,
      totalDiscount: 0,
      subtotalAfterLineDiscounts: 0,
      grandTotal: 0,
    };
  }
}`);

fs.writeFileSync('src/utils/posUtils.ts', content);
