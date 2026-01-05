"use client";

import { useState, useEffect } from "react";
import ChatModal from "./ChatModel";

export default function TeacherView({ socket, roomId }) {
  const [question, setQuestion] = useState("");
  // Options now include 'isCorrect' state for the radio buttons
  const [options, setOptions] = useState([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false }
  ]);
  const [timer, setTimer] = useState(60);
  const [isPollActive, setIsPollActive] = useState(false);
  const [liveResults, setLiveResults] = useState([]);
  const [showChat, setShowChat] = useState(false);

  // --- LISTENERS ---
  useEffect(() => {
    if (!socket) return;

    socket.on("update_results", (results) => {
      setLiveResults(results);
    });

    socket.on("poll_ended", () => {
      setIsPollActive(false);
    });

    return () => {
      socket.off("update_results");
      socket.off("poll_ended");
    };
  }, [socket]);

  // --- HANDLERS ---
  const handleAddOption = () => {
    setOptions([...options, { text: "", isCorrect: false }]);
  };

  const handleOptionTextChange = (index, val) => {
    const newOptions = [...options];
    newOptions[index].text = val;
    setOptions(newOptions);
  };

  const handleCorrectSelect = (index, isCorrect) => {
    const newOptions = [...options];
    // Reset others if you only want single correct answer (Optional, here we allow multiple)
    // newOptions.forEach(o => o.isCorrect = false); 
    newOptions[index].isCorrect = isCorrect;
    setOptions(newOptions);
  };

  const handleCreatePoll = () => {
    const validOptions = options.filter(opt => opt.text.trim() !== "");
    if (!question || validOptions.length < 2) return alert("Please add a question and at least 2 options.");

    socket.emit("create_poll", {
      question,
      options: validOptions.map(o => o.text), // Backend expects array of strings
      timer,
      roomId
    });
    
    setIsPollActive(true);
    setLiveResults([]);
  };

  return (
    <div className="min-h-screen bg-white font-sans text-brand-text relative pb-24">
      
      {/* --- TOP HEADER --- */}
      <div className="max-w-4xl mx-auto pt-10 px-6">
        <div className="inline-flex items-center gap-1 px-3 py-1 mb-4 rounded-full bg-brand-purple text-white text-[10px] font-bold uppercase tracking-wider">
          <span>✨</span> Intervue Poll
        </div>
        
        {!isPollActive ? (
          <>
            <h1 className="text-3xl font-bold mb-2 text-black">Let's Get Started</h1>
            <p className="text-gray-500 mb-8 max-w-lg">
              You'll have the ability to create and manage polls, ask questions, and monitor your students' responses in real-time.
            </p>

            {/* --- QUESTION SECTION --- */}
            <div className="mb-8">
              <div className="flex justify-between items-end mb-2">
                <label className="font-bold text-black text-sm">Enter your question</label>
                
                {/* Timer Dropdown */}
                <select 
                  value={timer}
                  onChange={(e) => setTimer(Number(e.target.value))}
                  className="bg-gray-100 border-none rounded-md px-3 py-1 text-sm font-medium text-gray-700 cursor-pointer hover:bg-gray-200"
                >
                  <option value={30}>30 seconds</option>
                  <option value={60}>60 seconds</option>
                  <option value={120}>2 minutes</option>
                </select>
              </div>
              
              <div className="relative">
                <textarea
                  className="w-full bg-gray-100 p-4 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-brand-purple resize-none"
                  placeholder="Type your question here..."
                  rows={4}
                  maxLength={100}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
                <span className="absolute bottom-3 right-4 text-xs text-gray-400 font-medium">
                  {question.length}/100
                </span>
              </div>
            </div>

            {/* --- OPTIONS SECTION --- */}
            <div className="mb-8">
              <div className="grid grid-cols-12 gap-4 mb-2">
                <div className="col-span-8 font-bold text-black text-sm">Edit Options</div>
                <div className="col-span-4 font-bold text-black text-sm pl-2">Is it Correct?</div>
              </div>

              <div className="space-y-4">
                {options.map((opt, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-4 items-center">
                    
                    {/* Option Input */}
                    <div className="col-span-8 flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-brand-purple text-white flex items-center justify-center text-xs font-bold shrink-0">
                        {idx + 1}
                      </div>
                      <input
                        type="text"
                        className="w-full bg-gray-100 p-3 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-brand-purple"
                        placeholder={`Option ${idx + 1}`}
                        value={opt.text}
                        onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                      />
                    </div>

                    {/* Yes/No Toggles */}
                    <div className="col-span-4 flex items-center gap-4 pl-2">
                      <label className="flex items-center cursor-pointer gap-2">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${opt.isCorrect ? 'border-brand-purple' : 'border-gray-300'}`}>
                          {opt.isCorrect && <div className="w-2 h-2 rounded-full bg-brand-purple" />}
                        </div>
                        <span className="text-sm font-medium text-black">Yes</span>
                        <input 
                          type="radio" 
                          name={`correct-${idx}`} 
                          className="hidden" 
                          checked={opt.isCorrect} 
                          onChange={() => handleCorrectSelect(idx, true)}
                        />
                      </label>

                      <label className="flex items-center cursor-pointer gap-2">
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${!opt.isCorrect ? 'border-gray-400' : 'border-gray-300'}`}>
                          {!opt.isCorrect && <div className="w-2 h-2 rounded-full bg-gray-400" />}
                        </div>
                        <span className="text-sm font-medium text-black">No</span>
                        <input 
                          type="radio" 
                          name={`correct-${idx}`} 
                          className="hidden" 
                          checked={!opt.isCorrect} 
                          onChange={() => handleCorrectSelect(idx, false)}
                        />
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Option Button */}
              <button 
                onClick={handleAddOption}
                className="mt-6 px-4 py-2 border border-brand-purple text-brand-purple text-sm font-bold rounded-lg hover:bg-purple-50 transition-colors"
              >
                + Add More option
              </button>
            </div>
            
            {/* --- FOOTER ACTION --- */}
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-gray-100 p-4 flex justify-end items-center gap-4 z-10">
               {/* Chat Toggle (Teacher needs to monitor chat) */}
               <button 
                onClick={() => setShowChat(!showChat)}
                className="mr-auto text-brand-purple font-bold hover:underline"
              >
                {showChat ? "Hide Chat" : "Show Chat"}
              </button>

              <button 
                onClick={handleCreatePoll}
                className="px-10 py-3 bg-brand-purple text-white font-bold rounded-full hover:bg-brand-dark shadow-lg transition-transform hover:-translate-y-0.5"
              >
                Ask Question
              </button>
            </div>
          </>
        ) : (
          
          /* --- ACTIVE POLL VIEW (LIVE RESULTS) --- */
          <div className="mt-10 bg-white border border-gray-200 rounded-xl p-8 shadow-sm text-center max-w-3xl mx-auto">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
              <h3 className="font-bold text-xl text-left text-black">{question}</h3>
              <div className="flex items-center gap-2 text-red-500 font-bold bg-red-50 px-3 py-1 rounded-full text-sm animate-pulse">
                 ⏱ Live
              </div>
            </div>

            <div className="space-y-4">
              {liveResults.length === 0 && (
                 <div className="py-12 flex flex-col items-center justify-center text-gray-400">
                    <div className="loader mb-4 border-4 border-brand-purple border-t-transparent w-8 h-8 rounded-full animate-spin"></div>
                    <p>Waiting for students to vote...</p>
                 </div>
              )}

              {liveResults.map((res, i) => (
                <div key={res.optionId} className="relative w-full h-14 bg-gray-50 rounded-lg overflow-hidden flex items-center px-4 border border-gray-100">
                  {/* Progress Bar */}
                  <div 
                    className="absolute left-0 top-0 h-full bg-brand-light/20 transition-all duration-700 ease-out"
                    style={{ width: `${res.percentage}%` }}
                  />
                  <div 
                    className="absolute left-0 top-0 h-full bg-brand-purple w-1.5"
                    style={{ width: `${res.percentage}%` }}
                  />
                  
                  {/* Text Content */}
                  <div className="flex justify-between w-full relative z-10 items-center">
                    <div className="flex items-center gap-3">
                       <span className="w-6 h-6 rounded-full bg-brand-purple text-white text-xs flex items-center justify-center font-bold">
                         {i + 1}
                       </span>
                       <span className="font-semibold text-gray-800">Option {res.optionId}</span>
                    </div>
                    <span className="font-bold text-brand-purple text-lg">{Math.round(res.percentage)}%</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex justify-end">
              <button 
                onClick={() => setIsPollActive(false)}
                className="px-6 py-2 border-2 border-brand-purple text-brand-purple rounded-full font-bold hover:bg-purple-50"
              >
                End Poll & Ask New
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Chat Modal */}
      <ChatModal 
        isOpen={showChat} 
        onClose={() => setShowChat(false)} 
        socket={socket} 
        roomId={roomId} 
        role="TEACHER"
      />
    </div>
  );
}