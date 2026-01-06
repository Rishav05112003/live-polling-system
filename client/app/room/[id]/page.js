"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation"; // Import useParams
import { useSocket } from "../../../context/SocketContext";
import TeacherView from "../../../components/TeacherView";
import StudentView from "../../../components/StudentView"; // Import the view

export default function RoomPage() {
  const params = useParams(); // Get params via hook
  const id = params?.id;      // Extract Room ID safely

  const socket = useSocket();
  const [role, setRole] = useState(null);

  useEffect(() => {
    // 1. Recover User Info
    const storedRole = localStorage.getItem("u_role");
    const storedName = localStorage.getItem("u_name");
    
    setRole(storedRole);

    // 2. Resilience: Re-join room if socket disconnected (e.g., page refresh)
    if (socket && !socket.connected && id && storedName) {
      socket.connect();
      socket.emit("join_room", { 
        name: storedName, 
        roomId: id, 
        role: storedRole 
      });
    }
  }, [socket, id]);

  // Loading state
  if (!role || !id) return <div className="min-h-screen flex items-center justify-center">Loading Room...</div>;

  return (
    <div>
      {role === 'TEACHER' ? (
        <TeacherView socket={socket} roomId={id} />
      ) : (
        <StudentView socket={socket} roomId={id} /> 
      )}
    </div>
  );
}