import type { ModerationAction, ModerationCategory } from "../core";
import type { Tier1Result } from "./types";

const ACTION_RANK: Record<ModerationAction, number> = {
  allow: 0,
  flag: 1,
  redact: 2,
  hold: 3,
  escalate: 4,
  block: 5,
};

const OFF_PLATFORM_PATTERNS: RegExp[] = [
  /(?:\+?\d[\s().-]?){10,}/g,
  /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi,
  /t\.me\/\S+/gi,
  /wa\.me\/\S+/gi,
  /whatsapp|telegram|signal|kik|viber/gi,
];

const FINANCIAL_SCAM =
  /cashapp|venmo|paypal|zelle|revolut|bank transfer|sort code|iban|bitcoin|btc|crypto|gift ?card|western union|wire transfer/i;

const HARASSMENT = /\b(kill you|rape|i know where you live)\b/i;

const SAFETY_LEGAL =
  /\b1[0-5]\b|under ?age|under ?18|minor|school ?girl|coerc|forced|against (?:your|her|his) will|traffick/i;

/**
 * Pure, deterministic Tier-1 screen. No I/O. Detects the four moderation
 * categories, masks off-platform contact details, and picks the strongest
 * action by precedence: block > redact > allow. The abuse categories
 * (safety_legal, financial_scam, harassment) block; off_platform redacts.
 */
export function screenTier1(body: string): Tier1Result {
  const categories: ModerationCategory[] = [];
  let action: ModerationAction = "allow";
  let redactedBody = body;
  let excerptIndex: number | null = null;

  const escalate = (next: ModerationAction): void => {
    if (ACTION_RANK[next] > ACTION_RANK[action]) action = next;
  };

  const safetyMatch = SAFETY_LEGAL.exec(body);
  if (safetyMatch) {
    categories.push("safety_legal");
    escalate("block");
    excerptIndex = safetyMatch.index;
  }

  const harassmentMatch = HARASSMENT.exec(body);
  if (harassmentMatch) {
    categories.push("harassment");
    escalate("block");
    if (excerptIndex === null) excerptIndex = harassmentMatch.index;
  }

  const financialMatch = FINANCIAL_SCAM.exec(body);
  if (financialMatch) {
    categories.push("financial_scam");
    escalate("block");
    if (excerptIndex === null) excerptIndex = financialMatch.index;
  }

  let offPlatformMatched = false;
  let offPlatformIndex: number | null = null;
  for (const pattern of OFF_PLATFORM_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(redactedBody)) !== null) {
      offPlatformMatched = true;
      if (offPlatformIndex === null) offPlatformIndex = match.index;
      redactedBody =
        redactedBody.slice(0, match.index) +
        "[redacted]" +
        redactedBody.slice(match.index + match[0].length);
      pattern.lastIndex = match.index + "[redacted]".length;
    }
  }
  if (offPlatformMatched) {
    categories.push("off_platform");
    escalate("redact");
    if (excerptIndex === null) excerptIndex = offPlatformIndex;
  }

  const excerpt =
    excerptIndex === null
      ? null
      : body.slice(Math.max(0, excerptIndex), Math.max(0, excerptIndex) + 120);

  return { categories, action, redactedBody, excerpt };
}
