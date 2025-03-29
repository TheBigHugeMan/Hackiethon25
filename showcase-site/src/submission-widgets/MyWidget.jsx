import React, { useState, useEffect, useRef } from "react";
import "./MyWidget.css";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyDMiaCwB6nOMoJmIK3nDVuyMMjHixK1dv8"
const genAI = new GoogleGenerativeAI(API_KEY);

const Chatbox = () => {
    const [messages, setMessages] = useState([
        { text: "Hey there! 💖 What’s on your mind?", sender: "ai" }
    ]);
    const [input, setInput] = useState("");
    const chatEndRef = useRef(null);

    // Scroll to latest message
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Handle user input and fetch AI response
    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = { text: input, sender: "user" };
        setMessages((prev) => [...prev, userMessage]);
        setInput("");

        try {
            const model = genAI.getGenerativeModel({ model: "tunedModels/kittenchanaivaried-ixs6om8ymgd6" });
            const result = await model.generateContent(input);
            const aiResponse = result.response.text();

            setMessages((prev) => [...prev, { text: aiResponse, sender: "ai" }]);
        } catch (error) {
            console.error("AI Response Error:", error);
            setMessages((prev) => [...prev, { text: "Oops! Something went wrong. 😢", sender: "ai" }]);
        }
    };

    return (
        <div className="chat-container">
            {/* Sidebar Navigation */}
            <div className="sidebar">
                <h2>💖 AI Girlfriend</h2>
                <button className="nav-button">Settings</button>
                <button className="nav-button">Themes</button>
                <button className="nav-button">About</button>
            </div>

            {/* Chat Window */}
            <div className="chatbox">
                <div className="chat-messages">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.sender}`}>
                            {msg.sender === "ai" && <img src="https://via.placeholder.com/40" alt="AI Avatar" className="ai-avatar" />}
                            <p>{msg.text}</p>
                        </div>
                    ))}
                    <div ref={chatEndRef} />
                </div>

                {/* Chat Input */}
                <div className="chat-input">
                    <input 
                        type="text" 
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        placeholder="Type a message..."
                    />
                    <button onClick={sendMessage}>Send</button>
                </div>
            </div>
        </div>
    );
};

export default Chatbox;
