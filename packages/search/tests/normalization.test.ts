import { describe, it, expect } from 'vitest';
import {
  removeArabicDiacritics,
  normalizeAlef,
  normalizeYaa,
  normalizeWhitespace,
  normalizePunctuation,
  normalizeArabicText,
} from '../src/normalization/arabic.js';

describe('@waynah/search — Arabic Normalization Engine', () => {
  it('1. Removes Arabic diacritics (tashkeel)', () => {
    const input = 'مَطْعَمُ الرِّيَاضِ لِلْمَأْكُولَاتِ';
    const result = removeArabicDiacritics(input);
    expect(result).toBe('مطعم الرياض للمأكولات');
  });

  it('2. Normalizes Alef variants (أ, إ, آ, ٱ -> ا)', () => {
    const input = 'أحمد إبراهيم آمال ٱستمرار';
    const result = normalizeAlef(input);
    expect(result).toBe('احمد ابراهيم امال استمرار');
  });

  it('3. Normalizes Alef Maqsura (ى -> ي)', () => {
    const input = 'مستشفى الأحلي';
    const result = normalizeYaa(input);
    expect(result).toBe('مستشفي الأحلي');
  });

  it('4. Normalizes whitespace', () => {
    const input = '   مطعم   الريان    للوجبات   ';
    const result = normalizeWhitespace(input);
    expect(result).toBe('مطعم الريان للوجبات');
  });

  it('5. Normalizes punctuation while keeping Arabic/Latin/numbers', () => {
    const input = 'صيدلية "الشفاء" (فرع 1) - صنعاء!';
    const result = normalizePunctuation(input);
    expect(result).toBe('صيدلية الشفاء فرع 1 - صنعاء');
  });

  it('6. Full Arabic text normalization pipeline (default options)', () => {
    const input = '  مَطْعَمُ «أَبُو عَلِي» (فرع حَجَّة)  !';
    const result = normalizeArabicText(input);
    expect(result).toBe('مطعم ابو علي فرع حجة');
  });

  it('7. Handles mixed Arabic/English text correctly', () => {
    const input = 'Al-Salam Pharmacy / صَيْدَلِيَّةُ السَّلَامِ';
    const result = normalizeArabicText(input);
    expect(result).toBe('al-salam pharmacy صيدلية السلام');
  });
});
