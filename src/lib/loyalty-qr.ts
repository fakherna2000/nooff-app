/**
 * إعدادات QR نقاط العيادة.
 *
 * CLINIC_QR_TOKEN: قيمة ثابتة تُشفَّر داخل الـ QR المعلّق في العيادة.
 * عندما يقرأ المريض هذا الـ QR من تطبيقه تُضاف CLINIC_QR_POINTS نقطة لمحفظته.
 */
export const CLINIC_QR_TOKEN = 'NOOF-CLINIC-CHECKIN';
export const CLINIC_QR_POINTS = 2;
export const CLINIC_QR_REASON = 'قراءة QR العيادة';
export const CLINIC_QR_COOLDOWN_HOURS = 48;
