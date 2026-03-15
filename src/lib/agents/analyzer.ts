import { generateObject } from 'ai';
import { z } from 'zod';

import { fastModel } from './config';

const AnalysisSchema = z.object({
  country_1: z.string().describe('The primary country mentioned in the summary'),
  country_2: z
    .string()
    .describe('The secondary country, or empty string if only one country is prominent'),
  relationship: z
    .string()
    .describe(
      'Brief description of relationship (e.g., war, diplomatic talks, trade dispute, alliance, conflict)'
    ),
  country_1_paragraph: z
    .string()
    .describe('2-4 sentence paragraph about developments in country 1'),
  country_2_paragraph: z
    .string()
    .describe(
      '2-4 sentence paragraph about country 2 developments or international relations context'
    ),
  relationship_paragraph: z
    .string()
    .describe('2-4 sentence paragraph describing the relationship between the countries'),
});

export type AnalysisOutput = z.infer<typeof AnalysisSchema>;

export async function analyze(summary: string): Promise<AnalysisOutput> {
  try {
    const { object } = await generateObject({
      model: fastModel,
      schema: AnalysisSchema,
      prompt: `Analyze the following news summary and extract country information and structured paragraphs.

Summary:
${summary}

Instructions:
1. Identify the TWO main countries mentioned. If only one country is prominent, leave country_2 as an empty string.
2. Determine the type of relationship between them (e.g., "war", "diplomatic talks", "trade dispute", "alliance", "conflict", "domestic issues")
3. Create three focused paragraphs:
   - country_1_paragraph: About developments in the primary country (2-4 sentences)
   - country_2_paragraph: About the secondary country, or about international relations context if only one country (2-4 sentences)
   - relationship_paragraph: About the relationship/interaction between them, or broader implications (2-4 sentences)

Each paragraph should be factual, concise, and based only on information in the summary.`,
    });

    return object;
  } catch {
    return fallbackAnalysis(summary);
  }
}

function fallbackAnalysis(summary: string): AnalysisOutput {
  const countryPatterns: [RegExp, string][] = [
    [/\b(United States|USA|America)\b/i, 'United States'],
    [/\b(Russia|Russian Federation)\b/i, 'Russia'],
    [/\b(China|People's Republic of China)\b/i, 'China'],
    [/\b(Ukraine|Ukrainian)\b/i, 'Ukraine'],
    [/\b(Israel|Israeli)\b/i, 'Israel'],
    [/\b(Palestine|Palestinian)\b/i, 'Palestine'],
    [/\b(Iran|Iranian)\b/i, 'Iran'],
    [/\b(North Korea|DPRK)\b/i, 'North Korea'],
    [/\b(South Korea|Republic of Korea)\b/i, 'South Korea'],
    [/\b(United Kingdom|UK|Britain)\b/i, 'United Kingdom'],
    [/\b(France|French)\b/i, 'France'],
    [/\b(Germany|German)\b/i, 'Germany'],
    [/\b(Japan|Japanese)\b/i, 'Japan'],
    [/\b(India|Indian)\b/i, 'India'],
    [/\b(Pakistan|Pakistani)\b/i, 'Pakistan'],
    [/\b(Turkey|Turkish)\b/i, 'Turkey'],
    [/\b(Saudi Arabia|Saudi)\b/i, 'Saudi Arabia'],
  ];

  const found: string[] = [];
  for (const [pattern, name] of countryPatterns) {
    if (pattern.test(summary) && !found.includes(name)) {
      found.push(name);
      if (found.length >= 2) break;
    }
  }

  const relationshipKeywords = [
    'war',
    'conflict',
    'dispute',
    'negotiations',
    'talks',
    'alliance',
    'trade',
    'sanctions',
    'diplomatic',
  ];
  const relationship =
    relationshipKeywords.find(kw => summary.toLowerCase().includes(kw)) ||
    'international relations';

  const sentences = summary.split(/\.\s+/);
  const third = Math.ceil(sentences.length / 3);

  return {
    country_1: found[0] || 'Unknown',
    country_2: found[1] || '',
    relationship,
    country_1_paragraph: sentences.slice(0, third).join('. ') + '.',
    country_2_paragraph: sentences.slice(third, third * 2).join('. ') + '.',
    relationship_paragraph: sentences.slice(third * 2).join('. ') + '.',
  };
}
