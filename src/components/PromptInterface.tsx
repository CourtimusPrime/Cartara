'use client';

import { useState, useEffect, useRef } from 'react';

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

interface PromptInterfaceProps {
  onCountriesDetected: (country1: string, country2: string, relationship: string) => void;
}

export default function PromptInterface({ onCountriesDetected }: PromptInterfaceProps) {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Handle typing detection
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPrompt(value);
    setIsTyping(true);

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to detect when user stops typing
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 1000); // 1 second delay after stopping typing
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    // Clear any previous results to prevent contamination
    setResponse('');
    setError('');
    setIsLoading(true);
    setIsTyping(false);

    try {
      const response = await fetch('http://localhost:8000/analyze-news', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: prompt }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result: AgentChainResponse = await response.json();

      if (result.success && result.data) {
        // Extract countries and relationship for globe visualization
        if (result.data.country_1 && result.data.country_2) {
          onCountriesDetected(
            result.data.country_1, 
            result.data.country_2, 
            result.data.relationship || 'diplomatic relations'
          );
        }

        // Set the summary as the response
        setResponse(result.data.summary);
        setError('');
      } else {
        throw new Error(result.error?.message || 'Failed to analyze the question');
      }
    } catch (error) {
      console.error('Error analyzing prompt:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      setResponse('');
    } finally {
      setIsLoading(false);
    }
  };

  // Clear timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  // Show response box when there's content and user is not typing
  const showResponse = response && !isTyping && !isLoading;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Response Box */}
      {showResponse && (
        <div className="mx-4 mb-4 p-6 response-box rounded-lg max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-semibold text-blue-400">📊 Analysis Summary</h3>
            <button
              onClick={() => setResponse('')}
              className="text-gray-400 hover:text-white text-xl leading-none hover:bg-gray-700 rounded px-2 py-1 transition-colors"
              aria-label="Close response"
            >
              ×
            </button>
          </div>
          <div className="text-gray-100 leading-relaxed max-h-60 overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
            {response}
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mx-4 mb-4 p-4 error-box rounded-lg max-w-4xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-lg font-semibold text-red-400 mb-2">⚠️ Error</h3>
              <p className="text-red-100">{error}</p>
            </div>
            <button
              onClick={() => setError('')}
              className="text-red-400 hover:text-white text-xl leading-none hover:bg-red-700 rounded px-2 py-1 transition-colors"
              aria-label="Close error"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Prompt Input */}
      <div className="prompt-interface border-t p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <input
              ref={inputRef}
              type="text"
              value={prompt}
              onChange={handleInputChange}
              placeholder="Ask about current events between countries (e.g., 'What's happening between Ukraine and Russia?')"
              className="flex-1 px-4 py-3 enhanced-input rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={isLoading}
            />
            <button
              type="submit"
              disabled={!prompt.trim() || isLoading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-medium hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Analyzing...</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span>🔍 Analyze</span>
                </div>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}