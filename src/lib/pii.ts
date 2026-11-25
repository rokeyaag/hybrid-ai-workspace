export interface PiiRedactionResult {
  sanitizedText: string;
  redactedCount: number;
  redactedTypes: string[];
}

const PII_PATTERNS: Array<{ label: string; regex: RegExp; placeholder: string }> = [
  {
    label: "Email",
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    placeholder: "[REDACTED_EMAIL]",
  },
  {
    label: "API Key / Token",
    regex: /\b(?:sk-|AIza|ghp_|gho_|xoxb-)[A-Za-z0-9_\-]{12,}\b/g,
    placeholder: "[REDACTED_SECRET]",
  },
  {
    label: "Credit Card",
    regex: /\b(?:\d[ -]*?){13,16}\b/g,
    placeholder: "[REDACTED_CARD]",
  },
  {
    label: "Phone",
    regex: /\b(?:\+?\d{1,3}[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/g,
    placeholder: "[REDACTED_PHONE]",
  },
  {
    label: "SSN / National ID",
    regex: /\b\d{3}-\d{2}-\d{4}\b/g,
    placeholder: "[REDACTED_ID]",
  },
];

/**
 * Performs local regex-based PII redaction before text leaves the device.
 */
export function redactPiiLocally(input: string): PiiRedactionResult {
  let sanitizedText = input;
  let redactedCount = 0;
  const detectedTypes = new Set<string>();

  for (const rule of PII_PATTERNS) {
    const matches = sanitizedText.match(rule.regex);
    if (matches && matches.length > 0) {
      redactedCount += matches.length;
      detectedTypes.add(rule.label);
      sanitizedText = sanitizedText.replace(rule.regex, rule.placeholder);
    }
  }

  return {
    sanitizedText,
    redactedCount,
    redactedTypes: Array.from(detectedTypes),
  };
}
