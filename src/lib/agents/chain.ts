import type { AgentChainResponse, ProgressCallback } from './types';
import { extractKeywords } from './transformer';
import { fetchArticles } from './researcher';
import { filterRelevantArticles } from './relevance-filter';
import { synthesize } from './synthesizer';
import { analyze } from './analyzer';

export async function processQuestion(
  question: string,
  onProgress?: ProgressCallback
): Promise<AgentChainResponse> {
  try {
    // Step 1: Extract keywords
    onProgress?.('Extracting keywords...', 'active');
    const keywords = await extractKeywords(question);
    onProgress?.('Extracting keywords...', 'complete');

    if (keywords.length === 0) {
      return createError('keyword_extraction', 'Failed to extract keywords from question');
    }

    // Step 2: Fetch articles
    onProgress?.('Searching news sources...', 'active');
    const articles = await fetchArticles(keywords);
    onProgress?.('Searching news sources...', 'complete');

    if (articles.length === 0) {
      return createError('research', 'No relevant articles found from news sources');
    }

    // Step 3: Filter for relevance
    onProgress?.('Filtering relevant articles...', 'active');
    const relevantArticles = await filterRelevantArticles(articles, question);
    onProgress?.('Filtering relevant articles...', 'complete');

    if (relevantArticles.length === 0) {
      return createError('relevance_filter', 'No articles matched the question after filtering');
    }

    // Step 4 & 5: Synthesize and Analyze in parallel
    onProgress?.('Analyzing and summarizing...', 'active');
    const [synthesis, analysis] = await Promise.all([
      synthesize(relevantArticles, question),
      synthesize(relevantArticles, question).then(s => analyze(s.summary)),
    ]);
    onProgress?.('Analyzing and summarizing...', 'complete');

    return {
      success: true,
      data: {
        country_1: analysis.country_1,
        country_2: analysis.country_2,
        relationship: analysis.relationship,
        country_1_paragraph: analysis.country_1_paragraph,
        country_2_paragraph: analysis.country_2_paragraph,
        relationship_paragraph: analysis.relationship_paragraph,
        summary: synthesis.summary,
        article_citations: synthesis.citations,
      },
      metadata: {
        original_question: question,
        keywords_extracted: keywords,
        articles_found: articles.length,
        articles_filtered: relevantArticles.length,
        processing_steps_completed: 5,
      },
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return createError('processing_error', message);
  }
}

function createError(type: string, message: string): AgentChainResponse {
  return {
    success: false,
    data: null,
    error: { type, message },
  };
}
