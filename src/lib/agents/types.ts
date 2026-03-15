import { z } from 'zod';

// Shared schemas
export const ArticleCitationSchema = z.object({
  source_name: z.string(),
  article_url: z.string(),
  article_title: z.string(),
});

export const AnalysisResultSchema = z.object({
  country_1: z.string(),
  country_2: z.string(),
  relationship: z.string(),
  country_1_paragraph: z.string(),
  country_2_paragraph: z.string(),
  relationship_paragraph: z.string(),
  summary: z.string(),
  article_citations: z.array(ArticleCitationSchema),
});

export type ArticleCitation = z.infer<typeof ArticleCitationSchema>;
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;

export interface Article {
  title: string;
  content: string;
  url: string;
  source: string;
  published_at: string;
  description: string;
}

export interface AgentChainResponse {
  success: boolean;
  data: AnalysisResult | null;
  error?: {
    type: string;
    message: string;
  };
  metadata?: {
    original_question: string;
    keywords_extracted: string[];
    articles_found: number;
    articles_filtered: number;
    processing_steps_completed: number;
  };
}

export type ProgressCallback = (step: string, status: 'active' | 'complete') => void;
