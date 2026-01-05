"use client";

import { useState, useEffect } from "react";
import ChatModal from "./ChatModal";

export default function StudentView({ socket, roomId }) {
  const [viewState, setViewState] = useState("WAITING"); // WAITING | VOTING | RESULTS | KICKED
  const [poll, setPoll] = useState(null);
  const [timer, setTimer] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [liveResults, setLiveResults] = useState([]);
  const [showChat, setShowChat] = useState(false);
  
  // --- 1. LISTENERS ---
  useEffect(() => {
    if (!socket) return;

    // A. New Poll Created
    socket.on("new_poll", (newPoll) => {
      setPoll(newPoll);
      setTimer(newPoll.timer);
      setViewState("VOTING");
      setSelectedOption(null);
      setLiveResults([]);
    });

    // B. Sync State (Late join/Refresh)
    socket.on("sync_poll_state", (state) => {
      setPoll(state);
      setTimer(state.remainingTime);
      setViewState("VOTING");
    });

    // C. Poll Ended
    socket.on("poll_ended", () => {
      // If user hasn't voted, they just see results (or waiting)
      // Usually we transition to results view or waiting view
      // For this design, we stay on results if available, else waiting.
      if (viewState !== "RESULTS") {
          setViewState("WAITING");
          alert("Poll ended!");
      }
    });

    // D. Live Results
    socket.on("update_results", (results) => {
      setLiveResults(results);
    });

    // E. Kicked
    socket.on("kicked", () => {
      setViewState("KICKED");
      socket.disconnect(); // Cut connection
    });

    return () => {
      socket.off("new_poll");
      socket.off("sync_poll_state");
      socket.off("poll_ended");
      socket.off("update_results");
      socket.off("kicked");
    };
  }, [socket, viewState]);

  // --- 2. TIMER LOGIC ---
  useEffect(() => {
    if (timer > 0 && viewState === "VOTING") {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else if (timer === 0 && viewState === "VOTING") {
       // Auto-submit or just show waiting? 
       // Design implies we wait for teacher if we didn't submit.
       setViewState("WAITING");
    }
  }, [timer, viewState]);

  // --- 3. SUBMIT VOTE ---
  const handleVote = () => {
    if (!selectedOption) return;

    // Optimistic Update
    setViewState("RESULTS");

    socket.emit("submit_vote", {
      pollId: poll.id,
      optionId: selectedOption.id,
      userId: 0, // Backend handles mapping
      roomId
    });
  };

  // --- KICKED SCREEN ---
  if (viewState === "KICKED") {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 text-center">
         <div className="inline-block px-3 py-1 mb-6 rounded-full bg-brand-purple text-white text-[10px] font-bold uppercase tracking-wider">
            Intervue Poll
         </div>
         <h1 className="text-3xl font-bold text-black mb-2">You've been Kicked out !</h1>
         <p className="text-gray-400 max-w-md">
           Looks like the teacher had removed you from the poll system. Please try again sometime.
         </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-brand-text relative p-6 flex flex-col items-center">
      
      {/* --- VIEW 1: WAITING --- */}
      {viewState === "WAITING" && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
           <div className="inline-flex items-center gap-1 px-3 py-1 mb-8 rounded-full bg-brand-purple text-white text-[10px] font-bold uppercase tracking-wider">
              <span>✨</span> Intervue Poll
           </div>
           
           <div className="w-12 h-12 border-4 border-brand-purple border-t-transparent rounded-full animate-spin mb-8"></div>
           
           <h2 className="text-2xl font-bold text-black">Wait for the teacher to ask questions..</h2>
        </div>
      )}

      {/* --- VIEW 2 & 3: VOTING or RESULTS --- */}
      {(viewState === "VOTING" || viewState === "RESULTS") && poll && (
        <div className="w-full max-w-3xl mt-10">
          
          {/* Header Row: "Question 1" and Timer */}
          <div className="flex justify-between items-center mb-4">
             <h3 className="font-bold text-xl text-black">Question 1</h3>
             <div className="flex items-center gap-2 font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full text-sm">
                ⏱ 00:{timer < 10 ? `0${timer}` : timer}
             </div>
          </div>

          {/* Question Box (Dark Grey Header) */}
          <div className="bg-[#595959] text-white p-5 rounded-t-lg">
             <h2 className="text-lg font-medium">{poll.question}</h2>
          </div>

          {/* Options Container */}
          <div className="border border-gray-200 border-t-0 rounded-b-lg p-6 space-y-4 shadow-sm bg-white">
             
             {/* --- VOTING STATE OPTIONS --- */}
             {viewState === "VOTING" && poll.options.map((opt, index) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedOption(opt)}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all flex items-center gap-4 bg-gray-50 ${
                    selectedOption?.id === opt.id 
                      ? "border-brand-purple bg-purple-50" 
                      : "border-gray-100 hover:border-gray-200"
                  }`}
                >
                   {/* Number Circle */}
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                      selectedOption?.id === opt.id ? "bg-brand-purple text-white" : "bg-brand-purple text-white"
                   }`}>
                      {index + 1}
                   </div>
                   <span className="font-medium text-gray-800 text-lg">
                      {opt.text}
                   </span>
                </button>
             ))}

             {/* --- RESULTS STATE OPTIONS (Progress Bars) --- */}
             {viewState === "RESULTS" && liveResults.map((res, index) => {
                // Find option text from poll data
                const optText = poll.options.find(o => o.id === res.optionId)?.text || "Option";
                return (
                  <div key={res.optionId} className="relative w-full h-16 bg-white rounded-lg border border-gray-200 overflow-hidden flex items-center px-4">
                    {/* Progress Fill */}
                    <div 
                      className="absolute left-0 top-0 h-full bg-brand-purple opacity-20 transition-all duration-700"
                      style={{ width: `${res.percentage}%` }}
                    />
                    <div 
                      className="absolute left-0 top-0 h-full bg-brand-purple w-1.5"
                      style={{ width: `${res.percentage}%` }}
                    />
                    
                    {/* Content */}
                    <div className="flex justify-between w-full relative z-10 items-center">
                      <div className="flex items-center gap-4">
                        <span className="w-8 h-8 rounded-full bg-brand-purple text-white text-sm flex items-center justify-center font-bold">
                          {index + 1}
                        </span>
                        <span className="font-medium text-gray-800 text-lg">{optText}</span>
                      </div>
                      <span className="font-bold text-brand-purple text-lg">{Math.round(res.percentage)}%</span>
                    </div>
                  </div>
                );
             })}
          </div>

          {/* Footer Area */}
          <div className="mt-6 flex justify-end">
             {viewState === "VOTING" ? (
               <button
                  onClick={handleVote}
                  disabled={!selectedOption}
                  className={`px-12 py-3 rounded-full font-bold text-white shadow-lg transition-transform ${
                     !selectedOption 
                        ? "bg-brand-purple opacity-50 cursor-not-allowed" 
                        : "bg-brand-purple hover:bg-brand-dark hover:-translate-y-0.5"
                  }`}
               >
                  Submit
               </button>
             ) : (
               <p className="w-full text-center text-gray-800 font-medium">
                 Wait for the teacher to ask a new question..
               </p>
             )}
          </div>

        </div>
      )}

      {/* --- Chat Button (Bottom Right) --- */}
      <button 
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-brand-purple text-white rounded-full shadow-lg flex items-center justify-center hover:bg-brand-dark transition-transform hover:scale-110 z-50"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.76c0 1.6 1.123 2.994 2.707 3.227 1.068.157 2.148.279 3.238.364.466.037.893.281 1.153.671L12 21l2.652-3.978c.26-.39.687-.634 1.153-.67 1.09-.086 2.17-.208 3.238-.365 1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
        </svg>
      </button>

      {/* Chat Modal */}
      <ChatModal 
        isOpen={showChat} 
        onClose={() => setShowChat(false)} 
        socket={socket} 
        roomId={roomId} 
        role="STUDENT"
      />
    </div>
  );
}