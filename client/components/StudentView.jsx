"use client";

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  setActivePoll,
  updateResults,
  setTimer,
  endPoll,
  markSubmitted,
} from "@/store/pollSlice";

import ChatModal from "./ChatModel";

export default function StudentView({ socket }) {
  const dispatch = useDispatch();

  const { poll, viewState, timer, liveResults, hasSubmitted } = useSelector(
    (state) => state.poll
  );

  const [selectedOption, setSelectedOption] = useState(null);
  const [showChat, setShowChat] = useState(false);

  // 🚨 NEW — local kicked state
  const [isKicked, setIsKicked] = useState(false);

  // ---------- LISTENERS ----------
  useEffect(() => {
    if (!socket) return;

    socket.on("new_poll", (newPoll) => {
      dispatch(
        setActivePoll({
          poll: newPoll,
          timer: newPoll.timer,
        })
      );
      setSelectedOption(null);
      setShowChat(true);
    });

    socket.on("sync_poll_state", (state) => {
      dispatch(
        setActivePoll({
          poll: state,
          timer: state.remainingTime,
        })
      );
      setShowChat(true);
    });

    socket.on("poll_ended", () => {
      dispatch(endPoll());
      alert("Poll ended!");
      setShowChat(false);
    });

    socket.on("update_results", (results) => {
      dispatch(updateResults(results));
    });

    // 🚨 Kicked Handler
    socket.on("kicked", () => {
      dispatch(endPoll());
      setShowChat(false);
      setIsKicked(true);      // <-- local state controls UI
      socket.disconnect();
    });

    return () => {
      socket.off("new_poll");
      socket.off("sync_poll_state");
      socket.off("poll_ended");
      socket.off("update_results");
      socket.off("kicked");
    };
  }, [socket, dispatch]);

  // ---------- TIMER ----------
  useEffect(() => {
    if (timer > 0 && viewState === "VOTING" && !hasSubmitted) {
      const interval = setInterval(() => {
        dispatch(setTimer(timer - 1));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [timer, viewState, hasSubmitted, dispatch]);

  // ---------- SUBMIT ----------
  const handleVote = () => {
    if (!selectedOption || hasSubmitted) return;

    socket.emit("submit_vote", {
      pollId: poll.id,
      optionId: selectedOption.id,
    });

    dispatch(markSubmitted());
  };

  // ---------- UI ----------

  // 🚨 FINAL — KICK UI
  if (isKicked) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 text-center">
        <div className="inline-block px-3 py-1 mb-6 rounded-full bg-brand-purple text-white text-[10px] font-bold uppercase tracking-wider">
          Intervue Poll
        </div>

        <h1 className="text-3xl font-bold text-black mb-2">
          You've been Kicked out !
        </h1>

        <p className="text-gray-400 max-w-md">
          Looks like the teacher had removed you from the poll system.
          Please try again sometime.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans text-brand-text relative p-6 flex flex-col items-center">
      
      {/* WAITING */}
      {viewState === "WAITING" && (
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <div className="inline-flex items-center gap-1 px-3 py-1 mb-8 rounded-full bg-brand-purple text-white text-[10px] font-bold uppercase tracking-wider">
            <span>✨</span> Intervue Poll
          </div>
          <div className="w-12 h-12 border-4 border-brand-purple border-t-transparent rounded-full animate-spin mb-8" />
          <h2 className="text-2xl font-bold text-black">
            Wait for the teacher to ask questions..
          </h2>
        </div>
      )}

      {/* VOTING + RESULTS */}
      {(viewState === "VOTING" || viewState === "RESULTS") && poll && (
        <div className="w-full max-w-3xl mt-10">
          
          {/* HEADER */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-xl text-black">Question</h3>

            <div className="flex items-center gap-2 font-bold text-red-500 bg-red-50 px-3 py-1 rounded-full text-sm">
              ⏱ 00:{timer < 10 ? `0${timer}` : timer}
            </div>
          </div>

          {/* QUESTION */}
          <div className="bg-[#595959] text-white p-5 rounded-t-lg">
            <h2 className="text-lg font-medium">{poll.question}</h2>
          </div>

          {/* BODY */}
          <div className="border border-gray-200 border-t-0 rounded-b-lg p-6 space-y-4 shadow-sm bg-white">

            {/* Voting Options */}
            {viewState === "VOTING" &&
              poll.options.map((opt, index) => (
                <button
                  key={opt.id}
                  disabled={hasSubmitted}
                  onClick={() => setSelectedOption(opt)}
                  className={`w-full text-left p-4 rounded-lg border-2 flex gap-4 ${
                    selectedOption?.id === opt.id
                      ? "border-brand-purple bg-purple-50"
                      : "border-gray-200"
                  } ${hasSubmitted && "opacity-50 cursor-not-allowed"}`}
                >
                  <div className="w-8 h-8 rounded-full bg-brand-purple text-white flex justify-center items-center">
                    {index + 1}
                  </div>
                  <span className="text-lg">{opt.text}</span>
                </button>
              ))}

            {/* RESULTS */}
            {viewState === "RESULTS" &&
              liveResults.map((res, index) => {
                const optText =
                  poll.options.find((o) => o.id === res.optionId)?.text ||
                  "Option";

                return (
                  <div
                    key={res.optionId}
                    className="relative w-full h-16 border rounded-lg overflow-hidden flex items-center px-4"
                  >
                    <div
                      className="absolute left-0 top-0 h-full bg-brand-purple opacity-20"
                      style={{ width: `${res.percentage}%` }}
                    />
                    <div className="relative flex justify-between w-full">
                      <span>
                        {index + 1}. {optText}
                      </span>
                      <strong>{Math.round(res.percentage)}%</strong>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* FOOTER */}
          <div className="mt-6 flex justify-end">
            {viewState === "VOTING" ? (
              <button
                onClick={handleVote}
                disabled={!selectedOption || hasSubmitted}
                className={`px-12 py-3 rounded-full text-white font-bold ${
                  !selectedOption || hasSubmitted
                    ? "bg-purple-300 cursor-not-allowed"
                    : "bg-brand-purple"
                }`}
              >
                {hasSubmitted ? "Submitted" : "Submit"}
              </button>
            ) : (
              <div className="w-full flex justify-center mt-6">
                <div className="px-6 py-3 bg-gray-50 border border-gray-200 rounded-full shadow-sm">
                  <span className="text-gray-600 font-semibold">
                    Wait for the teacher to ask a new question..
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHAT */}
      <button
        onClick={() => setShowChat(!showChat)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-brand-purple text-white rounded-full"
      >
        💬
      </button>

      <ChatModal
        isOpen={showChat}
        onClose={() => setShowChat(false)}
        socket={socket}
        role="STUDENT"
      />
    </div>
  );
}
