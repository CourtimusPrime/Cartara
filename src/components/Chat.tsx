'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  id: string;
}

interface ChatProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
}

export default function Chat({ isOpen, onToggle }: ChatProps) {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load messages from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('cartara-chat-messages');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      } catch (e) {
        console.error('Failed to load saved messages:', e);
      }
    }
  }, []);

  // Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('cartara-chat-messages', JSON.stringify(messages));
    }
  }, [messages]);

  // Handle WebSocket connection
  useEffect(() => {
    if (isOpen && !ws.current) {
      connectWebSocket();
    } else if (!isOpen && ws.current) {
      ws.current.close();
      ws.current = null;
      setIsConnected(false);
    }
    return () => {
      if (ws.current) {
        ws.current.close();
        ws.current = null;
      }
    };
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse]);

  const connectWebSocket = () => {
    ws.current = new WebSocket('ws://localhost:8000/ws');

    ws.current.onopen = () => {
      setIsConnected(true);
    };

    ws.current.onclose = () => {
      setIsConnected(false);
      setIsTyping(false);
    };

    ws.current.onerror = () => {
      setIsConnected(false);
      setIsTyping(false);
    };

    ws.current.onmessage = (event) => {
      const data = event.data; // Don't trim! Spaces are important
      if (data === '[DONE]') {
        // End of stream
        if (currentResponse) {
          setMessages(prev => [
            ...prev,
            {
              role: 'assistant',
              content: currentResponse,
              timestamp: new Date(),
              id: Date.now().toString()
            }
          ]);
          setCurrentResponse('');
        }
        setIsTyping(false);
      } else {
        // Streaming content
        setCurrentResponse(prev => prev + data);
        setIsTyping(true);
      }
    };
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || !ws.current || !isConnected) return;

    // If there's a current streaming response, save it to messages before sending new message
    if (currentResponse.trim()) {
      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: currentResponse.trim(),
          timestamp: new Date(),
          id: `assistant-${Date.now()}-${Math.random()}`
        }
      ]);
    }

    const userMessage: Message = {
      role: 'user',
      content: prompt.trim(),
      timestamp: new Date(),
      id: `user-${Date.now()}-${Math.random()}`
    };

    // Get current messages including any streaming response
    const currentMessages = currentResponse.trim() ? [
      ...messages,
      {
        role: 'assistant' as const,
        content: currentResponse.trim(),
        timestamp: new Date(),
        id: `temp-assistant-${Date.now()}`
      }
    ] : messages;
    
    // Build conversation history for context (last 5 message pairs = 10 messages)
    const conversationHistory = currentMessages.slice(-10).map(msg => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Send the message with full conversation context
    ws.current.send(JSON.stringify({ 
      prompt: prompt.trim(),
      history: conversationHistory
    }));

    // Update UI state
    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setCurrentResponse('');
    setIsTyping(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentResponse('');
    setIsTyping(false);
    localStorage.removeItem('cartara-chat-messages');
  };

  const reconnect = () => {
    if (ws.current) {
      ws.current.close();
    }
    connectWebSocket();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <div className={`fixed top-0 left-0 h-full w-96 bg-gray-900/95 backdrop-blur-sm shadow-2xl transform transition-transform duration-300 z-40 ${
      isOpen ? 'translate-x-0' : '-translate-x-full'
    }`}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <h2 className="text-white font-semibold">ChatGPT-5</h2>
            <span className="text-gray-400 text-sm">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <button
            onClick={() => onToggle(false)}
            className="p-1 text-gray-400 hover:text-white transition-colors"
            aria-label="Close chat"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Action Bar */}
        <div className="flex justify-between items-center px-4 py-2 border-b border-gray-700">
          <div className="flex space-x-2">
            {!isConnected && (
              <button
                onClick={reconnect}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
              >
                Reconnect
              </button>
            )}
            <button
              onClick={clearChat}
              className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 px-4 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-4">🗺️</div>
                <p className="text-lg mb-2">Welcome to Cartara</p>
                <p className="text-sm">Ask me about geopolitics and current events!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                }`}>
                  <div className={`max-w-[70%] rounded-lg px-4 py-2 ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-100'
                  }`}>
                    <div className="whitespace-pre-wrap break-words">
                      {msg.content}
                    </div>
                    <div className={`text-xs mt-1 opacity-70 ${
                      msg.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                    }`}>
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Current streaming response */}
              {currentResponse && (
                <div className="flex justify-start">
                  <div className="max-w-[70%] bg-gray-700 text-gray-100 rounded-lg px-4 py-2">
                    <div className="whitespace-pre-wrap break-words">
                      {currentResponse}
                      <span className="inline-block w-2 h-5 bg-gray-400 ml-1 animate-pulse" />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Typing indicator */}
              {isTyping && !currentResponse && (
                <div className="flex justify-start">
                  <div className="bg-gray-700 rounded-lg px-4 py-2">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-700">
          <div className="flex flex-col space-y-2">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isConnected ? "Type your message here... (Enter to send, Shift+Enter for new line)" : "Disconnected - please reconnect"}
              className="w-full p-3 bg-gray-800 text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 border border-gray-600"
              style={{ minHeight: '44px', maxHeight: '120px' }}
              disabled={!isConnected}
              rows={1}
            />
            <button
              type="submit"
              disabled={!prompt.trim() || !isConnected || isTyping}
              className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isTyping ? (
                <div className="flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Thinking...
                </div>
              ) : (
                'Send Message'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}