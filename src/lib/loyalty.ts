// إعدادات نظام الولاء المشتركة

// عدد النقاط التي يحصل عليها المريض عند تأكيد كل موعد
export const POINTS_PER_BOOKING = 2;

// أنواع حركات النقاط
export const LOYALTY_TX_TYPES = ['earn', 'redeem', 'adjust', 'reversal'] as const;
export type LoyaltyTxType = (typeof LOYALTY_TX_TYPES)[number];

// التسمية العربية لنوع الحركة
export const LOYALTY_TX_LABELS: Record<string, string> = {
  earn: 'نقاط موعد',
  redeem: 'استبدال مكافأة',
  adjust: 'تعديل إداري',
  reversal: 'إلغاء نقاط',
};
