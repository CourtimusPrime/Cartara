/**
 * Prompt-injection safeguards for user input before it reaches LLM prompts.
 *
 * Strategy:
 * 1. Strip control/special characters that could break prompt delimiters
 * 2. Detect common injection patterns and reject them
 * 3. Wrap user input in clear delimiters so the model treats it as data, not instructions
 */

const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?previous\s+instructions/i,
  /ignore\s+(all\s+)?above\s+instructions/i,
  /disregard\s+(all\s+)?previous/i,
  /you\s+are\s+now\s+/i,
  /new\s+instructions?:/i,
  /system\s*prompt/i,
  /\bact\s+as\b/i,
  /\brole\s*play\b/i,
  /```\s*(system|assistant|user)/i,
  /<\s*(system|assistant|user)\s*>/i,
  /\[\s*INST\s*\]/i,
  /\bdo\s+not\s+follow\b/i,
  /\boverride\b.*\binstructions?\b/i,
];

/**
 * Detects likely prompt-injection attempts.
 * Returns true if the input looks suspicious.
 */
export function detectInjection(input: string): boolean {
  return INJECTION_PATTERNS.some(pattern => pattern.test(input));
}

/**
 * Strips characters that could be used to escape prompt delimiters or
 * confuse XML/markdown-based prompt formats.
 */
const ZERO_WIDTH_RE = /[\u200B-\u200F\u202A-\u202E\uFEFF]/g;
// biome-ignore lint/suspicious/noControlCharactersInRegex: stripping control chars is the purpose
const CONTROL_CHAR_RE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;

function stripControlChars(input: string): string {
  return input.replace(ZERO_WIDTH_RE, '').replace(CONTROL_CHAR_RE, '');
}

/**
 * Sanitizes user input for safe inclusion in LLM prompts.
 * Returns the cleaned string. Throws if injection is detected.
 */
export function sanitizeUserInput(input: string): string {
  const cleaned = stripControlChars(input.trim());

  if (detectInjection(cleaned)) {
    throw new PromptInjectionError(
      'Your question contains patterns that look like prompt manipulation. Please rephrase as a genuine geopolitical question.'
    );
  }

  return cleaned;
}

/**
 * Wraps sanitized user input in clear delimiters so the LLM treats it as data.
 * Use this when embedding user text inside a system/instruction prompt.
 */
export function delimitUserInput(sanitizedInput: string): string {
  return `<user_question>${sanitizedInput}</user_question>`;
}

export class PromptInjectionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PromptInjectionError';
  }
}
