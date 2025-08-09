export interface CountryTooltipData {
  country: string;
  paragraph: string;
  lastUpdated?: string;
  sources?: string[];
}

export interface RelationshipTooltipData {
  country1: string;
  country2: string;
  relationship: string;
  paragraph: string;
  lastUpdated?: string;
  sources?: string[];
}

export interface TooltipState {
  countryData: Record<string, CountryTooltipData>;
  relationshipData: RelationshipTooltipData | null;
  isLoading: boolean;
  error?: string;
}