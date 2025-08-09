'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  id: string;
}

export default function Chat() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentResponse, setCurrentResponse] = useState('');
  const ws = useRef<WebSocket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (ws.current) {
        ws.current.close();
      }
    };
  }, []);

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
      console.log('Received chunk:', JSON.stringify(data)); // Debug log
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

    const userMessage: Message = {
      role: 'user',
      content: prompt.trim(),
      timestamp: new Date(),
      id: Date.now().toString()
    };

    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setCurrentResponse('');
    setIsTyping(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    ws.current.send(JSON.stringify({ prompt: prompt.trim() }));
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
    <div className="fixed bottom-0 left-0 w-full h-2/3">
      <div className="max-w-4xl mx-auto h-full flex flex-col p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4 bg-gray-800/80 rounded-t-lg px-4 py-2 backdrop-blur-3xl">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <h2 className="text-white font-semibold">AI Assistant</h2>
            <span className="text-gray-400 text-sm">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
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
        <div className="flex-1 bg-gray-800/80 rounded-none px-4 py-2 overflow-y-auto backdrop-blur-sm scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-4">💬</div>
                <p className="text-lg mb-2">Start a conversation</p>
                <p className="text-sm">Ask me anything about the globe or any other topic!</p>
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
        <form onSubmit={handleSubmit} className="bg-gray-800/80 rounded-b-lg p-4 backdrop-blur-sm">
          <div className="flex space-x-2">
            <textarea
              ref={textareaRef}
              value={prompt}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={isConnected ? "Type your message here... (Enter to send, Shift+Enter for new line)" : "Disconnected - please reconnect"}
              className="flex-1 p-3 bg-gray-700 text-white rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              style={{ minHeight: '44px', maxHeight: '120px' }}
              disabled={!isConnected}
              rows={1}
            />
            <button
              type="submit"
              disabled={!prompt.trim() || !isConnected || isTyping}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isTyping ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                'Send'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}