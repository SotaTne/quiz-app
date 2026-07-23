/** 大文字小文字を無視してallowedEmailsに含まれるかを判定する。 */
export function isEmailAllowed(email: string, allowedEmails: string[]): boolean {
  const normalized = email.trim().toLowerCase();
  return allowedEmails.some((allowed) => allowed.trim().toLowerCase() === normalized);
}
