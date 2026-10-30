/** @typedef {{ cashAmount: number, posAmount: number, openAccountAmount: number }} PaymentSplitAmounts */

/**
 * @param {number} grandTotal
 * @param {PaymentSplitAmounts} split
 * @returns {string | null}
 */
export function validatePaymentSplit(grandTotal, split) {
  const amounts = [split.cashAmount, split.posAmount, split.openAccountAmount];
  if (!Number.isFinite(grandTotal) || grandTotal < 0 || amounts.some((amount) => !Number.isFinite(amount) || amount < 0)) {
    return 'Ödeme tutarları sıfır veya daha büyük geçerli sayılar olmalıdır.';
  }

  const toCents = (amount) => Math.round((amount + Number.EPSILON * Math.abs(amount)) * 100);
  const differenceCents = toCents(grandTotal) - amounts.reduce((sum, amount) => sum + toCents(amount), 0);
  const difference = differenceCents / 100;
  if (differenceCents > 0) {
    return `Lütfen kalan ₺${difference.toFixed(2)} tutarı ödeme türlerine tam olarak dağıtın.`;
  }
  if (differenceCents < 0) {
    return `Dağıtılan ödeme toplamı satış tutarını ₺${Math.abs(difference).toFixed(2)} aşıyor.`;
  }
  return null;
}
