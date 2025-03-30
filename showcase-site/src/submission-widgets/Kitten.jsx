// AIChatWidget.jsx
// Save this file in your ./widgets/ folder

import React, { useState, useRef, useEffect } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import Draggable from "react-draggable";

// Simple store to save widget state
const useWidgetStore = create(
  persist(
    (set) => ({
      position: { x: 0, y: 0 },
      messages: [],
      personality: "cheerful",
      addMessage: (message) => set((state) => ({ 
        messages: [...state.messages, message] 
      })),
      setPosition: (position) => set({ position }),
      setPersonality: (personality) => set({ personality }),
    }),
    { name: "ai-chat-storage" }
  )
);

// This is a minimal version of the AI Chat Widget
const AIChatWidget = () => {
  // Local state
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  // Store state
  const { position, messages, personality, addMessage, setPosition, setPersonality } = useWidgetStore();
  
  // Refs
  const messagesEndRef = useRef(null);
  const dragNodeRef = useRef(null);
  
  // Scroll to bottom of messages
  useEffect(() => {
    if (messagesEndRef.current && isOpen) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);
  
  // Toggle chat open/closed
  const toggleChat = () => setIsOpen(!isOpen);
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    // Create user message
    const userMessage = {
      role: "user",
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString()
    };
    
    // Add to messages
    addMessage(userMessage);
    setInputMessage("");
    setIsLoading(true);
    
    // Simulate AI response
    setTimeout(() => {
      const aiMessage = {
        role: "assistant",
        content: `Thanks for your message about "${inputMessage}"! How else can I help you today?`,
        timestamp: new Date().toLocaleTimeString()
      };
      
      addMessage(aiMessage);
      setIsLoading(false);
    }, 1000);
  };
  
  // Handle drag stop
  const handleDragStop = (e, ui) => {
    setPosition({ x: ui.x, y: ui.y });
  };
  
  return (
    <Draggable
      handle=".handle"
      defaultPosition={position}
      onStop={handleDragStop}
      nodeRef={dragNodeRef}
    >
      <div className="relative z-50" ref={dragNodeRef}>
        {/* Chat Toggle Button */}
        <button 
          className="fixed bottom-5 right-5 w-14 h-14 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
          onClick={toggleChat}
        >
          {isOpen ? "×" : "💬"}
        </button>
        
        {/* Chat Window */}
        {isOpen && (
          <div className="w-80 h-96 rounded-lg overflow-hidden shadow-xl flex flex-col bg-white absolute bottom-20 right-5">
            {/* Header (drag handle) */}
            <div className="handle bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-3 cursor-move">
              <h3 className="font-medium">AI Chat Assistant</h3>
            </div>
            
            {/* Messages */}
            <div className="flex-1 p-3 overflow-y-auto bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center py-10 text-gray-500">
                  <p>How can I help you today?</p>
                </div>
              ) : (
                messages.map((msg, index) => (
                  <div 
                    key={index}
                    className={`mb-3 ${msg.role === "user" ? "text-right" : ""}`}
                  >
                    <div 
                      className={`inline-block p-2 rounded-lg ${
                        msg.role === "user" ? "bg-indigo-600 text-white" : "bg-gray-200"
                      }`}
                    >
                      {msg.content}
                      <div className="text-xs mt-1 opacity-70">{msg.timestamp}</div>
                    </div>
                  </div>
                ))
              )}
              {isLoading && (
                <div className="mb-3">
                  <div className="inline-block p-2 rounded-lg bg-gray-200">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.2s" }}></div>
                      <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0.4s" }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input Area */}
            <div className="p-3 border-t border-gray-200 flex">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
                placeholder="Type a message..."
                className="flex-1 border border-gray-300 rounded-l-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={handleSendMessage}
                disabled={isLoading || !inputMessage.trim()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-r-md hover:bg-indigo-700 transition disabled:bg-gray-400"
              >
                Send
              </button>
            </div>
            
            {/* Personality Selector */}
            <div className="p-2 border-t border-gray-200 bg-gray-50 flex justify-center space-x-2">
              <button
                onClick={() => setPersonality("cheerful")}
                className={`px-2 py-1 text-xs rounded ${personality === "cheerful" ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
              >
                Cheerful
              </button>
              <button
                onClick={() => setPersonality("professional")}
                className={`px-2 py-1 text-xs rounded ${personality === "professional" ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
              >
                Professional
              </button>
              <button
                onClick={() => setPersonality("witty")}
                className={`px-2 py-1 text-xs rounded ${personality === "witty" ? "bg-indigo-600 text-white" : "bg-gray-200"}`}
              >
                Witty
              </button>
            </div>
          </div>
        )}
      </div>
    </Draggable>
  );
};

export default AIChatWidget;