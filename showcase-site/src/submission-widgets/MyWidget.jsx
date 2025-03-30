import React, { useState, useEffect, useRef } from "react";
import "./MyWidget.css";
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyBjnsyhrmPv8UsoVi1QcEDckk5Us3T-qww";
const genAI = new GoogleGenerativeAI(API_KEY);

const Chatbox = () => {
    const [messages, setMessages] = useState([
        { text: "Hey there! 💖 What’s on your mind?", sender: "ai" }
    ]);
    const [input, setInput] = useState("");
    const chatEndRef = useRef(null);
    const [darkMode, setDarkMode] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

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
            const model = genAI.getGenerativeModel({ model: "tunedModels/kittenchannormal-5mks2bnict6e" });
            const result = await model.generateContent(input);
            const aiResponse = result.response.text();

            setMessages((prev) => [...prev, { text: aiResponse, sender: "ai" }]);
        } catch (error) {
            console.error("AI Response Error:", error);
            setMessages((prev) => [...prev, { text: "Oops! Something went wrong. 😢", sender: "ai" }]);
        }
    };

    return (
        <div className={`chat-container ${darkMode ? "dark-mode" : ""}`}>
            {/* Sidebar Navigation */}
            <div className="sidebar">
                <h2>KittenChan AI Girlfriend</h2>
                <button className="nav-button" onClick={() => setShowSettings(!showSettings)}>Settings</button>
                <button className="nav-button">Themes</button>
                <button className="nav-button">About</button>
            </div>

            {/* Settings Panel */}
            {showSettings && (
                <div className="settings-panel">
                    <h3>Settings</h3>
                    <label className="switch">
                        <input 
                            type="checkbox" 
                            checked={darkMode} 
                            onChange={() => setDarkMode(!darkMode)} 
                        />
                        <span className="slider round"></span>
                    </label>
                    <span>{darkMode ? "Dark Mode On" : "Dark Mode Off"}</span>
                </div>
            )}

            {/* Chat Window */}
            <div className="chatbox">
                <div className="chat-messages">
                    {messages.map((msg, index) => (
                        <div key={index} className={`message ${msg.sender}`}>
                            {msg.sender === "ai" && <img src="https://w0.peakpx.com/wallpaper/569/719/HD-wallpaper-cute-anime-cat-girl-cat-girl-face-anime.jpg" alt="AI Avatar" className="ai-avatar" />}
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
                        className={darkMode ? "dark-input" : ""}
                    />
                    <button onClick={sendMessage}>Send</button>
                </div>
            </div>
        </div>
    );
};

export default Chatbox;

