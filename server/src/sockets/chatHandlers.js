const registerChatHandlers = (io, socket) => {
  socket.on('send_message', ({ sender, text, roomId }) => {
    const message = {
      sender,
      text,
      time: new Date().toLocaleTimeString()
    };
    
    // Broadcast to everyone in the room
    io.to(roomId).emit('receive_message', message);
  });
};

// This line is critical for ES Modules
export default registerChatHandlers;