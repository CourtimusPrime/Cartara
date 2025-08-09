import { CountryTooltipData, RelationshipTooltipData } from '@/types/tooltip';

export const sampleCountryData: Record<string, CountryTooltipData> = {
  'ukraine': {
    country: 'Ukraine',
    paragraph: 'Ukraine continues to defend its sovereignty amid ongoing challenges, with significant international support flowing in. The country has shown remarkable resilience while working to maintain democratic institutions and rebuild critical infrastructure. Recent developments include continued efforts toward EU integration and strengthening ties with Western allies.',
    lastUpdated: '2024-01-15T00:00:00Z',
    sources: ['Reuters', 'BBC News', 'Associated Press']
  },
  'russia': {
    country: 'Russia',
    paragraph: 'Russia maintains its current policies while facing various international sanctions and diplomatic pressures. The country continues to develop relationships with non-Western partners and has been focusing on domestic economic resilience. Recent diplomatic activities include strengthening ties with China and other BRICS nations.',
    lastUpdated: '2024-01-15T00:00:00Z',
    sources: ['Reuters', 'Financial Times', 'Associated Press']
  },
  'china': {
    country: 'China',
    paragraph: 'China continues its economic development focus while maintaining its global diplomatic presence. The country has been investing heavily in Belt and Road Initiative projects and strengthening trade relationships across Asia, Africa, and Latin America. Recent developments include technological advancement initiatives and climate commitments.',
    lastUpdated: '2024-01-15T00:00:00Z',
    sources: ['Reuters', 'South China Morning Post', 'Bloomberg']
  },
  'united states': {
    country: 'United States',
    paragraph: 'The United States remains actively engaged in international affairs with a focus on strengthening alliances and democratic partnerships. The country continues to provide humanitarian aid and support to various regions while addressing domestic priorities. Recent policy focuses include climate initiatives and technological competitiveness.',
    lastUpdated: '2024-01-15T00:00:00Z',
    sources: ['Associated Press', 'Reuters', 'Wall Street Journal']
  }
};

export const sampleRelationshipData: Record<string, RelationshipTooltipData> = {
  'ukraine-russia': {
    country1: 'Ukraine',
    country2: 'Russia',
    relationship: 'conflict',
    paragraph: 'The relationship between Ukraine and Russia remains complex and tense, with ongoing diplomatic efforts by the international community to seek peaceful resolutions. Both countries have historical and cultural ties, but current circumstances have strained relations significantly. International observers continue to monitor the situation closely.',
    lastUpdated: '2024-01-15T00:00:00Z',
    sources: ['UN News', 'Reuters', 'BBC News']
  },
  'china-united states': {
    country1: 'China',
    country2: 'United States',
    relationship: 'strategic competition',
    paragraph: 'US-China relations involve a complex mix of cooperation and competition across economic, technological, and diplomatic spheres. Both nations maintain significant trade relationships while navigating strategic differences. Recent diplomatic engagements have focused on climate cooperation, trade discussions, and regional security concerns.',
    lastUpdated: '2024-01-15T00:00:00Z',
    sources: ['Reuters', 'Financial Times', 'Associated Press']
  }
};