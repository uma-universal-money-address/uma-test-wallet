/**
 * Validates a 2-character country code (ISO 3166-1 alpha-2)
 * @param code - The country code to validate
 * @returns Error message if invalid, empty string if valid
 */
export function validateCountryCode(code: string): string {
  if (!code) return "";

  const trimmed = code.trim();
  if (trimmed.length === 0) return "";

  if (trimmed.length !== 2) {
    return "Country code must be exactly 2 characters";
  }

  if (!/^[A-Z]{2}$/.test(trimmed)) {
    return "Country code must be 2 uppercase letters (e.g., US, GB)";
  }

  return "";
}

/**
 * Validates a phone number in E.164 format
 * @param phone - The phone number to validate
 * @returns Error message if invalid, empty string if valid
 */
export function validatePhoneNumber(phone: string): string {
  if (!phone) return "";

  const trimmed = phone.trim();
  if (trimmed.length === 0) return "";

  // E.164 format: +[country code][number]
  // Must start with +, followed by 1-15 digits
  if (!/^\+[1-9]\d{1,14}$/.test(trimmed)) {
    return "Phone must be in E.164 format (e.g., +12025551234)";
  }

  return "";
}

/**
 * Validates an email address
 * @param email - The email to validate
 * @returns Error message if invalid, empty string if valid
 */
export function validateEmail(email: string): string {
  if (!email) return "";

  const trimmed = email.trim();
  if (trimmed.length === 0) return "";

  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return "Invalid email format";
  }

  return "";
}

/**
 * Validates a date in ISO format (YYYY-MM-DD)
 * @param date - The date string to validate
 * @returns Error message if invalid, empty string if valid
 */
export function validateDate(date: string): string {
  if (!date) return "";

  const trimmed = date.trim();
  if (trimmed.length === 0) return "";

  // Check format YYYY-MM-DD
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return "Date must be in format YYYY-MM-DD";
  }

  // Check if it's a valid date
  const parsedDate = new Date(trimmed);
  if (isNaN(parsedDate.getTime())) {
    return "Invalid date";
  }

  // Check if the date string matches the parsed date
  // This catches cases like 2023-02-30
  const isoString = parsedDate.toISOString().split("T")[0];
  if (isoString !== trimmed) {
    return "Invalid date";
  }

  return "";
}

/**
 * Formats a country code to uppercase
 * @param code - The country code to format
 * @returns Formatted country code or empty string
 */
export function formatCountryCode(code: string): string {
  const trimmed = code.trim().toUpperCase();
  return trimmed.slice(0, 2);
}

/**
 * Formats a phone number to ensure it starts with +
 * @param phone - The phone number to format
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  const trimmed = phone.trim();
  if (!trimmed) return "";

  // If it doesn't start with +, add it
  if (!trimmed.startsWith("+")) {
    return `+${trimmed}`;
  }

  return trimmed;
}
