/**
 * Pure Arabic text normalization utilities for WAYNAH Search Engine.
 * Provides deterministic, side-effect-free functions for pre-processing text queries and index terms.
 */

// Arabic diacritics regex (Fatha, Damma, Kasra, Sukun, Shadda, Tanwin, Superscript Alef)
const ARABIC_DIACRITICS_REGEX = /[\u064B-\u0652\u0670]/g;

// Alef variants regex (أ, إ, آ, ٱ)
const ALEF_VARIANTS_REGEX = /[أإآٱ]/g;

// Alef Maqsura (ى)
const ALEF_MAQSURA_REGEX = /ى/g;

// Taa Marbouta (ة)
const TAA_MARBOUTA_REGEX = /ة/g;

// Tatweel / Kashida (ـ)
const TATWEEL_REGEX = /ـ/g;

// Multiple whitespace regex
const MULTIPLE_WHITESPACE_REGEX = /\s+/g;

/**
 * Strips all Arabic diacritics (tashkeel) from text.
 */
export function removeArabicDiacritics(text: string): string {
  if (!text) return '';
  return text.replace(ARABIC_DIACRITICS_REGEX, '');
}

/**
 * Normalizes all Alef variants (أ, إ, آ, ٱ) to plain Alef (ا).
 */
export function normalizeAlef(text: string): string {
  if (!text) return '';
  return text.replace(ALEF_VARIANTS_REGEX, 'ا');
}

/**
 * Normalizes Alef Maqsura (ى) to Yaa (ي).
 */
export function normalizeYaa(text: string): string {
  if (!text) return '';
  return text.replace(ALEF_MAQSURA_REGEX, 'ي');
}

/**
 * Optionally normalizes Taa Marbouta (ة) to Haa (ه).
 * Conservative default: Keep false unless explicitly requested.
 */
export function normalizeTaaMarbouta(text: string, force = false): string {
  if (!text || !force) return text;
  return text.replace(TAA_MARBOUTA_REGEX, 'ه');
}

/**
 * Removes Tatweel / Kashida (ـ) extensions.
 */
export function removeTatweel(text: string): string {
  if (!text) return '';
  return text.replace(TATWEEL_REGEX, '');
}

/**
 * Normalizes whitespace (strips leading/trailing spaces, collapses multiple spaces/tabs/newlines).
 */
export function normalizeWhitespace(text: string): string {
  if (!text) return '';
  return text.trim().replace(MULTIPLE_WHITESPACE_REGEX, ' ');
}

/**
 * Cleans non-alphanumeric punctuation marks while preserving space, numbers, and hyphens.
 */
export function normalizePunctuation(text: string): string {
  if (!text) return '';
  // Preserves Arabic characters, Latin letters, numbers, spaces, and hyphens
  return text.replace(/[^\p{L}\p{N}\s-]/gu, '');
}

export interface ArabicNormalizationOptions {
  removeDiacritics?: boolean;
  normalizeAlef?: boolean;
  normalizeYaa?: boolean;
  normalizeTaaMarbouta?: boolean;
  removeTatweel?: boolean;
  normalizePunctuation?: boolean;
  normalizeWhitespace?: boolean;
  lowercaseLatin?: boolean;
}

const DEFAULT_OPTIONS: Required<ArabicNormalizationOptions> = {
  removeDiacritics: true,
  normalizeAlef: true,
  normalizeYaa: true,
  normalizeTaaMarbouta: false, // Conservative default
  removeTatweel: true,
  normalizePunctuation: true,
  normalizeWhitespace: true,
  lowercaseLatin: true,
};

/**
 * Full Arabic text normalization pipeline.
 * Deterministic and side-effect free.
 */
export function normalizeArabicText(
  text: string,
  options?: ArabicNormalizationOptions
): string {
  if (!text) return '';

  const opts = { ...DEFAULT_OPTIONS, ...options };
  let result = text;

  if (opts.lowercaseLatin) {
    result = result.toLowerCase();
  }

  if (opts.removeDiacritics) {
    result = removeArabicDiacritics(result);
  }

  if (opts.removeTatweel) {
    result = removeTatweel(result);
  }

  if (opts.normalizeAlef) {
    result = normalizeAlef(result);
  }

  if (opts.normalizeYaa) {
    result = normalizeYaa(result);
  }

  if (opts.normalizeTaaMarbouta) {
    result = normalizeTaaMarbouta(result, true);
  }

  if (opts.normalizePunctuation) {
    result = normalizePunctuation(result);
  }

  if (opts.normalizeWhitespace) {
    result = normalizeWhitespace(result);
  }

  return result;
}
