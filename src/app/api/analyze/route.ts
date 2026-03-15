import { type NextRequest, NextResponse } from 'next/server';

import { processQuestion } from '@/lib/agents/chain';
import { getCached, setCached } from '@/lib/cache';
import { checkRateLimit } from '@/lib/rate-limit';
import { sanitizeUserInput, PromptInjectionError } from '@/lib/agents/sanitize';

const MAX_PROMPT_LENGTH = 500;

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip =
    request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
  const { allowed, remaining } = checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      {
        success: false,
        error: { type: 'rate_limit', message: 'Too many requests. Please try again in a minute.' },
      },
      {
        status: 429,
        headers: { 'X-RateLimit-Remaining': '0' },
      }
    );
  }

  // Parse and validate input
  let question: string;
  try {
    const body = await request.json();
    question = body.question;
  } catch {
    return NextResponse.json(
      { success: false, error: { type: 'invalid_request', message: 'Invalid request body' } },
      { status: 400 }
    );
  }

  if (!question || typeof question !== 'string' || question.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: { type: 'validation', message: 'Question is required' } },
      { status: 400 }
    );
  }

  if (question.length > MAX_PROMPT_LENGTH) {
    return NextResponse.json(
      {
        success: false,
        error: {
          type: 'validation',
          message: `Question must be under ${MAX_PROMPT_LENGTH} characters`,
        },
      },
      { status: 400 }
    );
  }

  // Sanitize input against prompt injection
  let sanitizedQuestion: string;
  try {
    sanitizedQuestion = sanitizeUserInput(question);
  } catch (e) {
    if (e instanceof PromptInjectionError) {
      return NextResponse.json(
        { success: false, error: { type: 'prompt_injection', message: e.message } },
        { status: 400 }
      );
    }
    throw e;
  }

  // Check cache
  const cached = getCached(sanitizedQuestion);
  if (cached) {
    return NextResponse.json(cached, {
      headers: { 'X-RateLimit-Remaining': String(remaining), 'X-Cache': 'HIT' },
    });
  }

  // Process question through agent chain
  const result = await processQuestion(sanitizedQuestion);

  // Cache successful results
  if (result.success) {
    setCached(sanitizedQuestion, result);
  }

  return NextResponse.json(result, {
    status: result.success ? 200 : 500,
    headers: { 'X-RateLimit-Remaining': String(remaining), 'X-Cache': 'MISS' },
  });
}
