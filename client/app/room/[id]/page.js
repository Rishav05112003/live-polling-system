"use client";

import { useEffect, useState } from "react";
import { useSocket } from "../../../context/SocketContext";
import TeacherView from "../../../components/TeacherView";
// import StudentView from "../../../components/StudentView"; // We will build this next

export default function RoomPage({ params }) {
  const { id } = params;
  const socket = useSocket();
  const [role, setRole] = useState(null);

  useEffect(() => {
    const storedRole = localStorage.getItem("u_role");
    setRole(storedRole);

    // Re-join logic for refresh (Resilience)
    const storedName = localStorage.getItem("u_name");
    if (socket && !socket.connected) {
      socket.connect();
      socket.emit("join_room", { name: storedName, roomId: id, role: storedRole });
    }
  }, [socket, id]);

  if (!role) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div>
      {role === 'TEACHER' ? (
        <TeacherView socket={socket} roomId={id} />
      ) : (
        /* Placeholder for Student View */
        <div className="p-10 text-center">
            <h1 className="text-2xl font-bold">Student View</h1>
            <p>Welcome to Room {id}. Waiting for teacher...</p>
        </div>
      )}
    </div>
  );
}