const WORD_PATTERN = /^[a-z]{2,12}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const normalizeWord = (text: string) => text.trim().toLowerCase();
export const isValidWord = (text: string) => WORD_PATTERN.test(normalizeWord(text));

export const isValidEmail = (text: string) => EMAIL_PATTERN.test(text.trim());

/** Keeps digits and a leading +, so "(555) 123-4567" and "555.123.4567" both work. */
export const cleanPhone = (text: string) => text.trim().replace(/(?!^\+)[^\d]/g, '');
export const isValidPhone = (text: string) => {
  const digits = cleanPhone(text).replace('+', '');
  return digits.length >= 7 && digits.length <= 15;
};
