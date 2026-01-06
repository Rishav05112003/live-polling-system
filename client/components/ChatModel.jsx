"use client";

import { useState, useEffect, useRef } from "react";

export default function ChatModal({ socket, role, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("Chat"); // 'Chat' or 'Participants'
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [participants, setParticipants] = useState([]);
  
  const messagesEndRef = useRef(null);
  // Safe access to localStorage (checks if window exists)
  const myName = typeof window !== 'undefined' ? localStorage.getItem("u_name") : "Me";

  // 1. Listen for real-time events
  useEffect(() => {
    if (!socket) return;

    // Receive Message
    socket.on("receive_message", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    // Update Participants List
    socket.on("update_members", (members) => {
      setParticipants(members);
    });

    return () => {
      socket.off("receive_message");
      socket.off("update_members");
    };
  }, [socket]);

  // 2. Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab]);

  // 3. Send Message
  const sendMessage = (e) => {
    e.preventDefault();
    if (input.trim()) {
      socket.emit("send_message", { sender: myName, text: input });
      setInput("");
    }
  };

  // 4. Kick User (Teacher Only)
  const kickUser = (userId) => {
    if(confirm("Are you sure you want to remove this user?")) {
      socket.emit("kick_student", { studentId: userId });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-80 bg-white shadow-2xl rounded-xl border border-gray-200 overflow-hidden z-50 flex flex-col font-sans">
      
      {/* Header Tabs */}
      <div className="flex border-b border-gray-100 bg-white">
        <button
          className={`flex-1 py-3 text-sm font-bold ${activeTab === 'Chat' ? 'text-brand-purple border-b-2 border-brand-purple' : 'text-gray-400'}`}
          onClick={() => setActiveTab("Chat")}
        >
          Chat
        </button>
        <button
          className={`flex-1 py-3 text-sm font-bold ${activeTab === 'Participants' ? 'text-brand-purple border-b-2 border-brand-purple' : 'text-gray-400'}`}
          onClick={() => setActiveTab("Participants")}
        >
          Participants ({participants.length})
        </button>
        {/* Close Button */}
        <button onClick={onClose} className="px-4 text-gray-400 hover:text-gray-600">
          ✕
        </button>
      </div>

      {/* Content Area */}
      <div className="h-80 bg-gray-50 relative flex flex-col">
        
        {/* --- CHAT TAB --- */}
        {activeTab === "Chat" && (
          <>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && <p className="text-xs text-center text-gray-400 mt-4">No messages yet.</p>}
              
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.sender === myName ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] text-gray-400 mb-1">{msg.sender}</span>
                  <div className={`px-3 py-2 rounded-lg text-sm max-w-[85%] break-words shadow-sm ${
                    msg.sender === myName 
                      ? 'bg-brand-purple text-white rounded-br-none' 
                      : 'bg-white border border-gray-100 text-gray-700 rounded-bl-none'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input Area */}
            <form onSubmit={sendMessage} className="p-3 bg-white border-t border-gray-100">
              <input
                className="w-full text-sm p-3 border border-gray-200 rounded-full focus:outline-none focus:border-brand-purple bg-gray-50 text-gray-900"
                placeholder="Type a message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />
            </form>
          </>
        )}

        {/* --- PARTICIPANTS TAB --- */}
        {activeTab === "Participants" && (
          <div className="h-full overflow-y-auto p-2">
            <div className="flex justify-between px-3 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
              <span>Name</span>
              <span>Role</span>
            </div>
            {participants.map((user) => (
              <div key={user.id} className="flex justify-between items-center bg-white p-3 mb-2 rounded-lg border border-gray-100 shadow-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${user.role === 'TEACHER' ? 'bg-brand-purple' : 'bg-green-400'}`} />
                  <span className="text-sm font-medium text-gray-700 truncate max-w-30">{user.name}</span>
                </div>
                
                {/* Kick Button (Only for Teachers, and cannot kick self) */}
                {role === "TEACHER" && user.role !== "TEACHER" ? (
                  <button 
                    onClick={() => kickUser(user.id)}
                    className="text-xs text-red-500 hover:text-red-700 font-bold bg-red-50 px-2 py-1 rounded"
                  >
                    Kick
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">{user.role}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}