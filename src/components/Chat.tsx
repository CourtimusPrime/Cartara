
'use client';

import { useState } from 'react';

export default function Chat() {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt) return;

    const newMessages = [...messages, { role: 'user', content: prompt }];
    setMessages(newMessages);
    setPrompt('');
    setIsThinking(true);

    // Simulate API call and streaming response
    setTimeout(() => {
      setIsThinking(false);
      const response = "This is a simulated response from the LLM. I am streaming the output to this text window. What else can I help you with?";
      let i = 0;
      const interval = setInterval(() => {
        if (i < response.length) {
          setMessages(prev => {
            const lastMessage = prev[prev.length - 1];
            if (lastMessage.role === 'assistant') {
              return [
                ...prev.slice(0, -1),
                { role: 'assistant', content: lastMessage.content + response[i] }
              ];
            } else {
              return [
                ...prev,
                { role: 'assistant', content: response[i] }
              ];
            }
          });
          i++;
        } else {
          clearInterval(interval);
        }
      }, 50);
    }, 2000);
  };

  return (
    <div className="absolute bottom-0 left-0 w-full p-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-4 h-64 overflow-y-auto mb-4">
          {messages.map((msg, index) => (
            <div key={index} className={`mb-2 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
              <span className={`inline-block p-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
                {msg.content}
              </span>
            </div>
          ))}
          {isThinking && (
            <div className="flex items-center justify-center">
              <div className="bouncing-loader">
                <div></div>
                <div></div>
                <div></div>
              </div>
            </div>
          )}
        </div>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Type your prompt here..."
            className="w-full p-2 rounded-lg bg-gray-700 text-white"
          />
        </form>
      </div>
    </div>
  );
}
