'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

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
    article_citations?: Array<{
      source_name: string;
      article_url: string;
      article_title: string;
    }>;
  };
  error?: {
    type: string;
    message: string;
  };
}

interface PromptInterfaceProps {
  onCountriesDetected: (country1: string, country2: string, relationship: string) => void;
}

type UIState = 'hidden' | 'bottom' | 'focused' | 'thinking' | 'expanding' | 'moving' | 'responding' | 'completed';

export default function PromptInterface({ onCountriesDetected }: PromptInterfaceProps) {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string>('');
  const [uiState, setUIState] = useState<UIState>('bottom');
  const [error, setError] = useState<string>('');
  const [isVisible, setIsVisible] = useState(true);
  const [streamedText, setStreamedText] = useState('');
  const [citations, setCitations] = useState<Array<{ 
    source_name: string; 
    article_url: string; 
    article_title: string;
    logo?: string; 
  }>>([]);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const responseRef = useRef<HTMLDivElement>(null);

  // Stream text effect
  const streamText = useCallback((text: string, speed: number = 30) => {
    setStreamedText('');
    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setStreamedText(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
      }
    }, speed);
    return () => clearInterval(timer);
  }, []);

  // Normalize country names
  const normalizeText = useCallback((text: string): string => {
    return text
      .replace(/\b(USA|US|the US|U\.S\.A\.|U\.S\.)\b/g, 'United States')
      .replace(/\bUnited States\b/g, 'United States') // Ensure consistency
      .replace(/\b(UK|England|Scotland|Wales|Britain|Great Britain)\b/g, 'United Kingdom')
      .replace(/\b(Turkey|Türkiye)\b/g, 'Türkiye') // Use official name with diacritic
      .replace(/\bGaza\b/g, 'Palestine');
  }, []);

  // Extract and format citations
  const processTextWithCitations = useCallback((text: string): { processedText: string; citations: Array<{ name: string; logo?: string }> } => {
    // Remove common in-text citation patterns and collect source info
    const citations: Array<{ name: string; logo?: string }> = [];
    
    // Extract publication names from common patterns
    const sourcePatterns = [
      /according to ([A-Za-z\s]+(?:News|Times|Post|Herald|Guardian|Telegraph|BBC|CNN|NPR|Reuters|AP|Bloomberg|WSJ|Financial Times))/gi,
      /reported by ([A-Za-z\s]+(?:News|Times|Post|Herald|Guardian|Telegraph|BBC|CNN|NPR|Reuters|AP|Bloomberg|WSJ|Financial Times))/gi,
      /\(([A-Za-z\s]+(?:News|Times|Post|Herald|Guardian|Telegraph|BBC|CNN|NPR|Reuters|AP|Bloomberg|WSJ|Financial Times))\)/gi
    ];
    
    let processedText = text;
    
    sourcePatterns.forEach(pattern => {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const sourceName = match[1].trim();
        if (!citations.find(c => c.name === sourceName)) {
          citations.push({ name: sourceName });
        }
        // Remove the citation from text
        processedText = processedText.replace(match[0], '');
      }
    });
    
    // Clean up any double spaces or trailing punctuation
    processedText = processedText.replace(/\s+/g, ' ').replace(/\s+([.,;])/g, '$1').trim();
    
    return { processedText, citations };
  }, []);

  // Get publication logo/favicon
  const getPublicationLogo = useCallback((name: string): string => {
    const logoMap: Record<string, string> = {
      'BBC': '🌐', 'BBC News': '🌐',
      'CNN': '📺', 'CNN News': '📺',
      'Reuters': '📰', 
      'Associated Press': '📰', 'AP': '📰',
      'NPR': '📻',
      'The Guardian': '🔵', 'Guardian': '🔵',
      'The New York Times': '📰', 'New York Times': '📰', 'NYT': '📰',
      'Washington Post': '📰',
      'Wall Street Journal': '💼', 'WSJ': '💼',
      'Bloomberg': '💰',
      'Financial Times': '💰', 'FT': '💰',
      'Al Jazeera': '🌍', 'Al Jazeera English': '🌍',
      'Fox News': '📺',
      'NBC': '📺', 'NBC News': '📺',
      'CBS': '📺', 'CBS News': '📺',
      'ABC': '📺', 'ABC News': '📺',
      'CNBC': '💼',
      'Politico': '🏛️',
      'The Hill': '🏛️',
      'Axios': '⚡',
      'Vox': '💭',
      'The Atlantic': '🌊',
      'Time': '⏰',
      'Newsweek': '📖',
      'USA Today': '🇺🇸',
      'PBS': '📺',
      'DW': '🇩🇪', 'Deutsche Welle': '🇩🇪'
    };
    
    return logoMap[name] || '📰';
  }, []);

  // Handle global key press
  useEffect(() => {
    const handleKeyPress = () => {
      if (uiState === 'hidden' || (uiState === 'completed' && !isVisible)) {
        setUIState('bottom');
        setIsVisible(true);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (uiState === 'hidden' || (uiState === 'completed' && !isVisible)) {
        const threshold = window.innerHeight - 100; // Show when cursor near bottom
        if (e.clientY > threshold) {
          setUIState('bottom');
          setIsVisible(true);
        }
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    document.addEventListener('mousemove', handleMouseMove);
    
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [uiState, isVisible]);

  // Handle clicks outside to hide
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current && 
        !containerRef.current.contains(event.target as Node) &&
        (uiState === 'focused' || uiState === 'completed')
      ) {
        setUIState('hidden');
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [uiState]);

  // Handle input focus
  const handleFocus = () => {
    if (uiState === 'bottom') {
      setUIState('focused');
    }
  };

  // Handle click to animate from bottom to center
  const handleClick = () => {
    if (uiState === 'bottom') {
      setUIState('focused');
      // Focus the textarea after animation
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  };


  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || uiState === 'thinking') return;

    setUIState('thinking');
    setError('');

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

        // Use article_citations from backend if available, otherwise fallback to processed citations
        const backendCitations = result.data.article_citations || [];
        const finalCitations = backendCitations.length > 0 ? 
          backendCitations.map(citation => ({
            ...citation,
            logo: getPublicationLogo(citation.source_name)
          })) : 
          processTextWithCitations(normalizeText(result.data.summary)).citations.map(citation => ({
            source_name: citation.name,
            article_url: '', // No URL available from processed citations
            article_title: citation.name,
            logo: citation.logo || getPublicationLogo(citation.name)
          }));

        const finalText = result.data.summary; // Use the edited summary from backend
        
        // Start sophisticated animation sequence
        setResponse(finalText);
        setCitations(finalCitations);
        
        // Animation sequence: thinking -> expanding -> moving -> responding
        setTimeout(() => {
          setUIState('expanding');
          setTimeout(() => {
            setUIState('moving');
            setTimeout(() => {
              setUIState('responding');
              setPrompt('');
              streamText(finalText);
              setTimeout(() => {
                setUIState('completed');
              }, 500);
            }, 600); // Wait for movement
          }, 400); // Wait for expansion
        }, 800); // Wait for thinking to complete

      } else {
        throw new Error(result.error?.message || 'Failed to analyze the question');
      }
    } catch (error) {
      console.error('Error analyzing prompt:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      setUIState('focused');
    }
  };

  // Get container classes based on state
  const getContainerClasses = () => {
    const baseClasses = "fixed z-50";
    
    switch (uiState) {
      case 'hidden':
        return `${baseClasses} top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0 pointer-events-none transition-opacity duration-500 ease-in-out`;
      
      case 'bottom':
        return `${baseClasses} bottom-8 left-1/2 transform -translate-x-1/2 opacity-100`;
      
      case 'focused':
        return `${baseClasses} top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-100`;
      
      case 'thinking':
        return `${baseClasses} top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-100`;
      
      case 'expanding':
        return `${baseClasses} top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-100`;
      
      case 'moving':
        return `${baseClasses} top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-100`;
      
      case 'responding':
      case 'completed':
        return `${baseClasses} bottom-8 left-4 right-4 transform translate-x-0 opacity-100 transition-all duration-300 ease-out`;
      
      default:
        return `${baseClasses} top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-100`;
    }
  };

  // Get input classes based on state
  const getInputClasses = () => {
    const baseClasses = "w-full px-6 py-4 bg-gray-900/80 backdrop-blur-lg border rounded-xl text-white placeholder-gray-400 focus:outline-none transition-all duration-300 text-center";
    
    switch (uiState) {
      case 'bottom':
        return `${baseClasses} border-gray-600 hover:border-gray-400 hover:bg-gray-800/90 cursor-pointer`;
      
      case 'thinking':
        return `${baseClasses} border-transparent shadow-[0_0_30px_rgba(59,130,246,0.5),0_0_60px_rgba(168,85,247,0.3),0_0_90px_rgba(34,197,94,0.2)] animate-pulse`;
      
      case 'expanding':
        return `${baseClasses} border-transparent opacity-50`;
      
      case 'moving':
        return `${baseClasses} border-gray-600 opacity-30`;
      
      case 'responding':
        return `${baseClasses} border-gray-600 opacity-0`;
      
      case 'completed':
        return `${baseClasses} border-gray-600 opacity-0 pointer-events-none`;
      
      case 'focused':
        return `${baseClasses} border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]`;
      
      default:
        return `${baseClasses} border-gray-600 hover:border-gray-500`;
    }
  };

  // Render backdrop blur when focused
  const renderBackdrop = () => {
    if (uiState === 'focused' || uiState === 'thinking') {
      return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 transition-all duration-500" />
      );
    }
    return null;
  };

  // Render thinking border animation
  const renderThinkingBorder = () => {
    if (uiState === 'thinking') {
      return (
        <div className="absolute inset-0 rounded-xl">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 via-purple-500 via-green-500 to-blue-500 opacity-75 animate-spin-slow" 
               style={{ 
                 background: 'linear-gradient(90deg, #3B82F6, #A855F7, #22C55E, #EF4444, #3B82F6)',
                 backgroundSize: '400% 400%',
                 animation: 'gradient 3s ease infinite'
               }} />
          <div className="absolute inset-[2px] rounded-xl bg-gray-900/90 backdrop-blur-lg" />
        </div>
      );
    }
    return null;
  };

  if (!isVisible && uiState === 'hidden') {
    return null;
  }

  return (
    <>
      {renderBackdrop()}
      
      <div ref={containerRef} className={getContainerClasses()}>
      <div className={`relative transition-all duration-400 ${
        uiState === 'expanding' ? 'w-[90%] max-w-none' :
        uiState === 'moving' || uiState === 'responding' || uiState === 'completed' ? 'w-full max-w-none text-center' :
        'w-[60vw] left-1/2 transform -translate-x-1/2 absolute'
      }`}>
          {renderThinkingBorder()}
          
          {/* Input Phase */}
          {(uiState === 'bottom' || uiState === 'focused' || uiState === 'thinking' || uiState === 'expanding' || uiState === 'moving') && (
            <form onSubmit={handleSubmit} className="relative z-10">
              <input
                ref={inputRef}
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onFocus={handleFocus}
                onClick={handleClick}
                placeholder="Ask about current events between countries..."
                className={getInputClasses()}
                disabled={uiState === 'thinking' || uiState === 'expanding' || uiState === 'moving'}
                style={{
                  color: uiState === 'thinking' || uiState === 'expanding' || uiState === 'moving' ? '#9CA3AF' : '#FFFFFF'
                }}
              />
              
              {/* Thinking indicator - just the glowing border animation */}
            </form>
          )}

          {/* Response Phase */}
          {(uiState === 'responding' || uiState === 'completed') && (
            <div 
              ref={responseRef}
              className="bg-gray-900/90 backdrop-blur-lg border border-gray-600 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-blue-400 flex items-center gap-2">
                  <span className="animate-pulse">📊</span>
                  Analysis Complete
                </h3>
                {uiState === 'completed' && (
                  <button
                    onClick={() => {
                      setUIState('hidden');
                      setIsVisible(false);
                      setResponse('');
                      setStreamedText('');
                      setCitations([]);
                    }}
                    className="text-gray-400 hover:text-white text-xl leading-none hover:bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center transition-colors"
                    aria-label="Close response"
                  >
                    ×
                  </button>
                )}
              </div>
              
              <div className="text-gray-100 leading-relaxed">
                {uiState === 'responding' ? (
                  <div className="min-h-[100px]">
                    <span className="whitespace-pre-wrap">{streamedText}</span>
                    <span className="animate-pulse">|</span>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto scrollbar-thin scrollbar-track-gray-800 scrollbar-thumb-gray-600">
                    {response}
                  </div>
                )}
              </div>

              {/* Citations */}
              {citations.length > 0 && uiState === 'completed' && (
                <div className="mt-6 pt-4 border-t border-gray-700">
                  <div className="flex flex-wrap gap-2">
                    {citations.map((citation, index) => (
                      <a
                        key={index}
                        href={citation.article_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-800/60 backdrop-blur-sm border border-gray-600 rounded-full text-sm text-gray-200 hover:bg-gray-700/70 hover:border-gray-500 hover:text-white transition-all duration-200 cursor-pointer transform hover:scale-105"
                        title={citation.article_title}
                      >
                        <span className="text-lg">{citation.logo || getPublicationLogo(citation.source_name)}</span>
                        <span className="font-medium">{citation.source_name}</span>
                        <span className="text-xs text-gray-400">↗</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-red-900/80 backdrop-blur-lg border border-red-600 rounded-xl">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-semibold text-red-400 mb-2">⚠️ Oops!</h3>
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
        </div>
      </div>

      <style jsx>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        
        @keyframes move-to-center {
          0% {
            top: auto;
            bottom: 1rem;
            left: 50%;
            transform: translateX(-50%);
          }
          100% {
            top: 50%;
            bottom: auto;
            left: 50%;
            transform: translate(-50%, -50%);
          }
        }
        
        @keyframes move-to-bottom {
          0% {
            top: 50%;
            bottom: auto;
            left: 50%;
            transform: translate(-50%, -50%);
          }
          100% {
            top: auto;
            bottom: 2rem;
            left: 50%;
            transform: translateX(-50%);
          }
        }
      `}</style>
    </>
  );
}