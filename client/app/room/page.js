"use client";

import { useEffect, useState } from "react";
import { useSocket } from "../../context/SocketContext";
import { useSelector } from "react-redux";
import TeacherView from "../../components/TeacherView";
import StudentView from "../../components/StudentView";

export default function RoomPage() {
  const socket = useSocket();
  const { role, name } = useSelector((state) => state.user);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!socket || !role || !name) return;

    socket.emit("join_room", {
      name,
      role,
    });

    socket.emit("sync_state");

    setReady(true);
  }, [socket, role, name]);

  if (!ready) return <div>Loading...</div>;

  return role === "TEACHER"
    ? <TeacherView socket={socket} />
    : <StudentView socket={socket} />;
}
