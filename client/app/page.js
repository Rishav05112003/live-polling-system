"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "../context/SocketContext";
import { useSelector, useDispatch } from "react-redux";
import { setUser } from "@/store/userSlice";

export default function LandingPage() {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState("STUDENT");
  const [name, setName] = useState("");

  const router = useRouter();
  const socket = useSocket();

  const user = useSelector((state) => state.user);
  const dispatch = useDispatch();

  // Reconnect & Sync if redux already has user
  useEffect(() => {
    if (!socket) return;
    if (!user.joined) return;

    socket.emit("join_room", {
      name: user.name,
      role: user.role
    });

    socket.emit("sync_state");
  }, [socket, user.joined]);

  const handleContinue = (e) => {
    e?.preventDefault();

    if (step === 1) {
      setStep(2);
      return;
    }

    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }

    // Save to Redux
    dispatch(
      setUser({
        name,
        role
      })
    );

    // Join Global Room
    if (socket) {
      socket.emit("join_room", { name, role });
    }

    router.push("/room");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white p-4 font-sans">

      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-block px-4 py-1 mb-4 rounded-full bg-brand-purple text-white text-xs font-bold uppercase tracking-wider">
          Intervue Poll
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {step === 1
            ? "Welcome to the Live Polling System"
            : "Let's Get Started"}
        </h1>
        <p className="text-gray-500">
          {step === 1
            ? "Please select the role that best describes you"
            : `Enter your details to join as a ${role.toLowerCase()}`}
        </p>
      </div>

      {/* STEP 1 — Role Select */}
      {step === 1 && (
        <div className="flex flex-col md:flex-row gap-6 w-full max-w-3xl">
          {["STUDENT", "TEACHER"].map((r) => (
            <div
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 p-8 border-2 rounded-2xl cursor-pointer transition-all ${
                role === r
                  ? "border-brand-purple bg-purple-50 shadow-md"
                  : "border-gray-100 hover:border-brand-light"
              }`}
            >
              <h3 className="font-bold text-xl mb-2 capitalize text-gray-900">
                I'm a {r.toLowerCase()}
              </h3>
              <p className="text-sm text-gray-500">
                {r === "STUDENT"
                  ? "Vote in polls and see live results."
                  : "Create polls and manage students."}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* STEP 2 — Enter Name */}
      {step === 2 && (
        <form onSubmit={handleContinue} className="w-full max-w-md space-y-5">
          <div>
            <label className="block text-sm font-bold text-gray-900 mb-2">
              Display Name
            </label>
            <input
              type="text"
              required
              autoComplete="off"
              className="w-full p-4 border border-gray-300 rounded-lg text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-brand-purple"
              placeholder="Ex: Rahul Bajaj"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="w-full mt-6 px-10 py-4 bg-brand-purple text-white font-bold rounded-full hover:bg-brand-dark transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Continue
          </button>
        </form>
      )}

      {/* STEP 1 Continue Button */}
      {step === 1 && (
        <button
          onClick={handleContinue}
          className="mt-8 px-16 py-4 bg-brand-purple text-white font-bold rounded-full hover:bg-brand-dark transition-all shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
        >
          Continue
        </button>
      )}
    </div>
  );
}
