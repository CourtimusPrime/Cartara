import { generateObject } from 'ai';
import { z } from 'zod';

import { fastModel } from './config';
import { delimitUserInput } from './sanitize';

const KeywordsSchema = z.object({
  keywords: z
    .array(z.string())
    .min(1)
    .max(5)
    .describe('The most relevant 3-5 keywords for searching current news'),
});

export async function extractKeywords(question: string): Promise<string[]> {
  const { object } = await generateObject({
    model: fastModel,
    schema: KeywordsSchema,
    prompt: `Extract the most important keywords for searching current events and news from the user question below.

${delimitUserInput(question)}

Focus on:
- Country names
- Political figures
- Major events or conflicts
- Economic terms
- International organizations

Return the most relevant 3-5 keywords suitable for news search.

Example:
User: "What's happening with the war in Ukraine?"
Keywords: ["Ukraine", "war", "Russia", "conflict"]`,
  });

  return object.keywords;
}
