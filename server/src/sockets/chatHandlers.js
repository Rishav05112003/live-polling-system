export default function chatHandlers(io, socket, prisma) {

  socket.on("send_message", ({ sender, text, roomId }) => {
    io.to(roomId).emit("receive_message", { sender, text });
  });
}
