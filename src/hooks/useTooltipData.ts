import { useState, useCallback } from 'react';
import { CountryTooltipData, RelationshipTooltipData, TooltipState } from '@/types/tooltip';
import { sampleCountryData, sampleRelationshipData } from '@/data/sampleTooltips';

interface AgentChainResponse {
  success: boolean;
  data: {
    country_1: string;
    country_2: string;
    relationship: string;
    country_1_paragraph: string;
    country_2_paragraph: string;
    relationship_paragraph: string;
    summary: string;
  };
  error?: {
    type: string;
    message: string;
  };
}

export const useTooltipData = () => {
  const [tooltipState, setTooltipState] = useState<TooltipState>({
    countryData: {},
    relationshipData: null,
    isLoading: false,
    error: undefined,
  });

  const fetchTooltipData = useCallback(async (country1: string, country2: string) => {
    if (!country1 || !country2) return;

    setTooltipState(prev => ({
      ...prev,
      isLoading: true,
      error: undefined,
    }));

    try {
      const question = `What's the current situation between ${country1} and ${country2}?`;
      
      const response = await fetch('http://localhost:8000/analyze-news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: AgentChainResponse = await response.json();

      if (result.success && result.data) {
        const countryData: Record<string, CountryTooltipData> = {};
        
        // Add country 1 data
        if (result.data.country_1 && result.data.country_1_paragraph) {
          countryData[result.data.country_1.toLowerCase()] = {
            country: result.data.country_1,
            paragraph: result.data.country_1_paragraph,
            lastUpdated: new Date().toISOString(),
          };
        }

        // Add country 2 data
        if (result.data.country_2 && result.data.country_2_paragraph) {
          countryData[result.data.country_2.toLowerCase()] = {
            country: result.data.country_2,
            paragraph: result.data.country_2_paragraph,
            lastUpdated: new Date().toISOString(),
          };
        }

        // Add relationship data
        const relationshipData: RelationshipTooltipData = {
          country1: result.data.country_1,
          country2: result.data.country_2,
          relationship: result.data.relationship,
          paragraph: result.data.relationship_paragraph,
          lastUpdated: new Date().toISOString(),
        };

        setTooltipState({
          countryData,
          relationshipData,
          isLoading: false,
          error: undefined,
        });
      } else {
        throw new Error(result.error?.message || 'Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching tooltip data:', error);
      
      // Fallback to sample data when API is not available
      const key1 = country1.toLowerCase();
      const key2 = country2.toLowerCase();
      const relationshipKey = `${key1}-${key2}` in sampleRelationshipData ? 
        `${key1}-${key2}` : `${key2}-${key1}`;
      
      const fallbackCountryData: Record<string, CountryTooltipData> = {};
      
      if (sampleCountryData[key1]) {
        fallbackCountryData[key1] = sampleCountryData[key1];
      }
      if (sampleCountryData[key2]) {
        fallbackCountryData[key2] = sampleCountryData[key2];
      }
      
      const fallbackRelationshipData = sampleRelationshipData[relationshipKey] || null;
      
      if (Object.keys(fallbackCountryData).length > 0 || fallbackRelationshipData) {
        setTooltipState({
          countryData: fallbackCountryData,
          relationshipData: fallbackRelationshipData,
          isLoading: false,
          error: 'Using sample data - API unavailable',
        });
      } else {
        setTooltipState(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error occurred',
        }));
      }
    }
  }, []);

  const getCountryTooltip = useCallback((countryName: string): CountryTooltipData | null => {
    const key = countryName.toLowerCase();
    return tooltipState.countryData[key] || null;
  }, [tooltipState.countryData]);

  const getRelationshipTooltip = useCallback((): RelationshipTooltipData | null => {
    return tooltipState.relationshipData;
  }, [tooltipState.relationshipData]);

  return {
    ...tooltipState,
    fetchTooltipData,
    getCountryTooltip,
    getRelationshipTooltip,
  };
};