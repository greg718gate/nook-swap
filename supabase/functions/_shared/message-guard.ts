/** Detect off-platform contact / payment bypass attempts in chat. */

const KEYWORD_PATTERNS: RegExp[] = [
  /\bwhatsapp\b/i,
  /\bwa\.me\b/i,
  /\bviber\b/i,
  /\btelegram\b/i,
  /\bt\.me\b/i,
  /\bsignal\b/i,
  /\bfacebook\s*marketplace\b/i,
  /\bgumtree\b/i,
  /\bdirect\s+transfer\b/i,
  /\bbank\s+transfer\b/i,
  /\bpay\s+outside\b/i,
  /\bpay\s+off\s+platform\b/i,
  /\bcash\s+on\s+delivery\b/i,
  /\bblik\b/i,
  /\brevolut\s+me\b/i,
  /\bmonzo\s+me\b/i,
];

const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

const UK_PHONE_PATTERN =
  /(?:\+44\s?7\d{3}|\(?0\s?7\d{3}\)?)\s?\d{3}\s?\d{3,4}|\+44\s?\d{2,4}\s?\d{3,4}\s?\d{3,4}/i;

export type MessageGuardResult = {
  flagged: boolean;
  reasons: string[];
  warning: string | null;
};

export function scanMessageContent(content: string): MessageGuardResult {
  const reasons: string[] = [];
  const text = content.trim();

  if (EMAIL_PATTERN.test(text)) reasons.push("email_detected");
  if (UK_PHONE_PATTERN.test(text)) reasons.push("phone_detected");

  for (const pattern of KEYWORD_PATTERNS) {
    if (pattern.test(text)) {
      reasons.push(`keyword:${pattern.source.slice(0, 24)}`);
      break;
    }
  }

  const flagged = reasons.length > 0;
  return {
    flagged,
    reasons,
    warning: flagged
      ? "For your safety, keep all communication and payments on VelvetBazzar. Off-platform deals are not protected by our escrow or buyer support."
      : null,
  };
}
