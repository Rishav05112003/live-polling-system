import { GLOBAL_ROOM } from "../index.js";

export default function chatHandlers(io, socket) {

  socket.on("send_message", ({ sender, text }) => {
    io.to(GLOBAL_ROOM).emit("receive_message", { sender, text });
  });

}
