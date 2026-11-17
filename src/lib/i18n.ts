import type { Language } from '../types/ems';

export function tr(lang: Language, en: string, bn?: string, ar?: string): string {
  if (lang === 'bn') return bn || en;
  if (lang === 'ar') return ar || en;
  return en;
}

export function translateStatus(lang: Language, status: string): string {
  const map: Record<string, [string, string, string]> = {
    Active: ['Active', 'সক্রিয়', 'نشط'],
    'Transfer Pending': ['Transfer Pending', 'ট্রান্সফার প্রক্রিয়াধীন', 'نقل قيد التنفيذ'],
    Transferred: ['Transferred', 'ট্রান্সফার হয়েছে', 'تم النقل'],
    'Final Exit': ['Final Exit', 'ফাইনাল এক্সিট', 'خروج نهائي'],
    Inactive: ['Inactive', 'নিষ্ক্রিয়', 'غير نشط'],
    Archived: ['Archived', 'আর্কাইভ করা', 'مؤرشف'],
    None: ['None', 'নেই', 'لا يوجد'],
    Issued: ['Issued', 'ইস্যু হয়েছে', 'صادرة'],
    'Outside KSA': ['Outside KSA', 'সৌদির বাইরে', 'خارج المملكة'],
    Returned: ['Returned', 'ফিরে এসেছেন', 'عاد'],
    Cancelled: ['Cancelled', 'বাতিল', 'ملغاة'],
    PAID: ['PAID', 'সম্পূর্ণ জমা', 'مدفوع'],
    PARTIAL: ['PARTIAL', 'আংশিক জমা', 'مدفوع جزئياً'],
    UNPAID: ['UNPAID', 'বকেয়া', 'غير مدفوع'],
    Overdue: ['Overdue', 'মেয়াদ উত্তীর্ণ', 'متأخر'],
    Company: ['Company', 'কোম্পানি', 'شركة'],
    Domestic: ['Domestic', 'ডোমেস্টিক', 'عمالة منزلية'],
    Iqama: ['Iqama', 'ইকামা', 'الإقامة'],
    'Visa return': ['Visa return', 'ভিসা প্রত্যাবর্তন', 'عودة التأشيرة'],
  };
  const found = map[status];
  if (!found) return status;
  return tr(lang, found[0], found[1], found[2]);
}

export function getMonthNames(lang: Language): string[] {
  const locale = lang === 'ar' ? 'ar-SA' : lang === 'bn' ? 'bn-BD' : 'en-US';
  return Array.from({ length: 12 }, (_, idx) => {
    const d = new Date(Date.UTC(2026, idx, 15));
    return new Intl.DateTimeFormat(locale, { month: 'long', timeZone: 'UTC' }).format(d);
  });
}

export function getWeekdayShort(lang: Language): string[] {
  const locale = lang === 'ar' ? 'ar-SA' : lang === 'bn' ? 'bn-BD' : 'en-US';
  // Start Sunday (0) -> Saturday (6)
  return Array.from({ length: 7 }, (_, idx) => {
    const d = new Date(Date.UTC(2026, 2, 1 + idx)); // March 1, 2026 is Sunday
    return new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' }).format(d);
  });
}
