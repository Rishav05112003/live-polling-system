"use client";

import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { updateResults, endPoll } from "@/store/pollSlice";

import ChatModal from "./ChatModel";

export default function TeacherView({ socket, roomId }) {
  const dispatch = useDispatch();

  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState([
    { text: "", isCorrect: false },
    { text: "", isCorrect: false },
  ]);
  const [timer, setTimer] = useState(60);
  const [isPollActive, setIsPollActive] = useState(false);
  const [liveResults, setLiveResults] = useState([]);
  const [showChat, setShowChat] = useState(false);

  // ---------------- LISTENERS ----------------
  useEffect(() => {
    if (!socket) return;

    socket.on("update_results", (results) => {
      dispatch(updateResults(results));
      setLiveResults(results);
    });

    socket.on("poll_ended", () => {
      setIsPollActive(false);
      dispatch(endPoll());
    });

    return () => {
      socket.off("update_results");
      socket.off("poll_ended");
    };
  }, [socket, dispatch]);

  // ---------------- HANDLERS ----------------
  const handleAddOption = () => {
    setOptions([...options, { text: "", isCorrect: false }]);
  };

  const handleOptionTextChange = (i, val) => {
    const newOptions = [...options];
    newOptions[i].text = val;
    setOptions(newOptions);
  };

  const handleCorrectSelect = (i, isCorrect) => {
    const newOptions = [...options];
    newOptions[i].isCorrect = isCorrect;
    setOptions(newOptions);
  };

  const handleCreatePoll = () => {
    const validOptions = options.filter((o) => o.text.trim() !== "");
    if (!question || validOptions.length < 2)
      return alert("Please add a question and at least 2 options.");

    socket.emit("create_poll", {
      question,
      options: validOptions.map((o) => o.text),
      timer,
      roomId,
    });

    setIsPollActive(true);
    setLiveResults([]);
  };

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen bg-white font-sans text-brand-text relative pb-24">
      <div className="max-w-4xl mx-auto pt-10 px-6">

        <div className="inline-flex items-center gap-1 px-3 py-1 mb-4 rounded-full bg-brand-purple text-white text-[10px] font-bold uppercase tracking-wider">
          <span>✨</span> Intervue Poll
        </div>

        {!isPollActive ? (
          <>
            <h1 className="text-3xl font-bold mb-2 text-black">
              Let's Get Started
            </h1>
            <p className="text-gray-500 mb-8 max-w-lg">
              Create & manage polls in real-time.
            </p>

            {/* QUESTION */}
            <div className="mb-8">
              <div className="flex justify-between items-end mb-2">
                <label className="font-bold text-black text-sm">
                  Enter your question
                </label>

                <select
                  value={timer}
                  onChange={(e) => setTimer(Number(e.target.value))}
                  className="bg-gray-100 rounded-md px-3 py-1"
                >
                  <option value={30}>30 seconds</option>
                  <option value={60}>60 seconds</option>
                  <option value={120}>2 minutes</option>
                </select>
              </div>

              <textarea
                className="w-full bg-gray-100 p-4 rounded-lg"
                placeholder="Type your question..."
                rows={4}
                maxLength={100}
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
              />
            </div>

            {/* OPTIONS */}
            <div className="mb-8">
              <div className="grid grid-cols-12 gap-4 mb-2">
                <div className="col-span-8 font-bold text-sm">Edit Options</div>
                <div className="col-span-4 font-bold text-sm">Correct?</div>
              </div>

              <div className="space-y-4">
                {options.map((opt, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-4 items-center">
                    <div className="col-span-8 flex gap-3">
                      <div className="w-6 h-6 bg-brand-purple text-white flex items-center justify-center rounded-full">
                        {idx + 1}
                      </div>
                      <input
                        className="w-full bg-gray-100 p-3 rounded-lg"
                        value={opt.text}
                        onChange={(e) => handleOptionTextChange(idx, e.target.value)}
                      />
                    </div>

                    <div className="col-span-4 flex gap-4">
                      <label>
                        <input
                          type="radio"
                          checked={opt.isCorrect}
                          onChange={() => handleCorrectSelect(idx, true)}
                        />
                        Yes
                      </label>

                      <label>
                        <input
                          type="radio"
                          checked={!opt.isCorrect}
                          onChange={() => handleCorrectSelect(idx, false)}
                        />
                        No
                      </label>
                    </div>
                  </div>
                ))}
              </div>

              <button onClick={handleAddOption} className="mt-4 text-brand-purple">
                + Add More Option
              </button>
            </div>

            <div className="fixed bottom-0 w-full p-4 flex justify-end">
              <button
                onClick={handleCreatePoll}
                className="px-10 py-3 bg-brand-purple text-white rounded-full"
              >
                Ask Question
              </button>
            </div>
          </>
        ) : (
          <>
            <h3 className="font-bold text-xl mb-4">{question}</h3>

            <div className="space-y-4">
              {liveResults.map((res) => (
                <div
                  key={res.optionId}
                  className="relative h-14 bg-gray-50 rounded-lg overflow-hidden"
                >
                  <div
                    className="absolute left-0 top-0 h-full bg-brand-purple opacity-20"
                    style={{ width: `${res.percentage}%` }}
                  />

                  <div className="absolute left-0 top-0 bg-brand-purple h-full w-1.5" />

                  <div className="relative flex justify-between px-4 items-center h-full">
                    <span>Option {res.optionId}</span>
                    <span className="font-bold text-brand-purple">
                      {Math.round(res.percentage)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setIsPollActive(false)}
              className="mt-6 px-6 py-2 border border-brand-purple rounded-full"
            >
              End Poll & Ask New
            </button>
          </>
        )}
      </div>

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
