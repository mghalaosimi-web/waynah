/**
 * WAYNAH Phase 9 — Text & Attribute Normalization Module
 *
 * Implements deterministic safe normalization and approved Arabic heuristic normalization.
 */

const APPROVED_BUSINESS_PREFIXES = [
  'شركة', 'شركه',
  'مؤسسة', 'مؤسسه',
  'مكتب',
  'محل',
  'مركز',
  'معرض',
  'متجر',
  'ورشة', 'ورشه',
  'مطعم',
  'بقالة', 'بقاله',
  'سوبر ماركت',
  'صيدلية', 'صيدليه',
  'كافيه',
  'مقهى', 'مقهي',
  'مستشفى', 'مستشفي',
  'عيادة', 'عياده',
];

/**
 * Safe, deterministic text normalization.
 * - Trims whitespace
 * - Lowercases English/Latin characters
 * - Collapses multiple spaces
 * - Strips unwanted punctuation/symbols while preserving Arabic & alphanumeric chars
 */
export function normalizeSafeText(text: string | null | undefined): string {
  if (!text) return '';

  let normalized = text.trim().toLowerCase();

  // Remove punctuation and special symbols except letters, numbers, and spaces
  normalized = normalized.replace(/[^\p{L}\p{N}\s]/gu, ' ');

  // Collapse multiple whitespace
  normalized = normalized.replace(/\s+/g, ' ').trim();

  return normalized;
}

/**
 * Approved Arabic heuristic normalization.
 * - Applies safe normalization
 * - Removes Arabic Tashkeel (diacritics) & Tatweel
 * - Normalizes Alef variants (أ, إ, آ -> ا)
 * - Normalizes Ta Marbouta (ة -> ه)
 * - Normalizes Alef Maqsura (ى -> ي)
 * - Strips approved business prefixes if leading
 */
export function normalizeArabicHeuristics(text: string | null | undefined): string {
  let normalized = normalizeSafeText(text);
  if (!normalized) return '';

  // 1. Remove Tashkeel (Arabic diacritics) & Tatweel (\u0640)
  normalized = normalized.replace(/[\u064B-\u0652\u0640]/g, '');

  // 2. Alef variants -> Alef (أ, إ, آ -> ا)
  normalized = normalized.replace(/[\u0623\u0625\u0622]/g, '\u0627');

  // 3. Ta Marbouta -> Ha (ة -> ه)
  normalized = normalized.replace(/\u0629/g, '\u0647');

  // 4. Alef Maqsura -> Ya (ى -> ي)
  normalized = normalized.replace(/\u0649/g, '\u064A');

  // 5. Approved business prefix stripping
  let words = normalized.split(' ');
  while (words.length > 1) {
    const firstWord = words[0];
    if (!firstWord) break;
    const twoWordPrefix = words.slice(0, 2).join(' ');

    if (APPROVED_BUSINESS_PREFIXES.includes(twoWordPrefix)) {
      words = words.slice(2);
    } else if (APPROVED_BUSINESS_PREFIXES.includes(firstWord)) {
      words = words.slice(1);
    } else {
      break;
    }
  }

  const result = words.join(' ').trim();
  return result.length >= 2 ? result : normalized;
}

/**
 * Phone number normalization.
 * Strips non-digits, normalizes leading zeros / country code, returns standardized digit string.
 */
export function normalizePhoneNumber(phone: string | null | undefined): string | null {
  if (!phone) return null;

  let digits = phone.replace(/\D/g, '');
  if (!digits || digits.length < 6) return null;

  // Normalize Yemen country code 967 or leading zero 0
  if (digits.startsWith('967') && digits.length > 9) {
    digits = digits.substring(3);
  }
  if (digits.startsWith('0') && digits.length > 7) {
    digits = digits.substring(1);
  }

  return digits.length >= 6 ? digits : null;
}

/**
 * Trigram similarity computation (pg_trgm compatible algorithm).
 * Generates 3-character slices and returns Dice coefficient similarity [0.0, 1.0].
 */
export function calculateTrigramSimilarity(str1: string, str2: string): number {
  if (!str1 || !str2) return 0.0;
  if (str1 === str2) return 1.0;

  const getTrigrams = (str: string): Map<string, number> => {
    const padded = `  ${str} `;
    const map = new Map<string, number>();
    for (let i = 0; i < padded.length - 2; i++) {
      const tri = padded.substring(i, i + 3);
      map.set(tri, (map.get(tri) || 0) + 1);
    }
    return map;
  };

  const tri1 = getTrigrams(str1);
  const tri2 = getTrigrams(str2);

  let total1 = 0;
  for (const count of tri1.values()) total1 += count;

  let total2 = 0;
  for (const count of tri2.values()) total2 += count;

  if (total1 === 0 || total2 === 0) return 0.0;

  let shared = 0;
  for (const [tri, count1] of tri1.entries()) {
    const count2 = tri2.get(tri);
    if (count2) {
      shared += Math.min(count1, count2);
    }
  }

  return (2.0 * shared) / (total1 + total2);
}
