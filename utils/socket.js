const socketIo = require('socket.io');

let io;
const userSockets = new Map(); // userId -> socketId map

module.exports = {
  init: (httpServer) => {
    io = socketIo(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true
      }
    });

    io.on('connection', (socket) => {
      console.log('New client connected:', socket.id);

      socket.on('register', (userId) => {
        userSockets.set(userId, socket.id);
        console.log(`User ${userId} registered with socket ${socket.id}`);
      });

      socket.on('disconnect', () => {
        // Remove socket from map on disconnect
        for (const [userId, socketId] of userSockets.entries()) {
          if (socketId === socket.id) {
            userSockets.delete(userId);
            console.log(`User ${userId} disconnected`);
            break;
          }
        }
      });
    });

    return io;
  },
  getIo: () => {
    if (!io) {
      throw new Error('Socket.io not initialized!');
    }
    return io;
  },
  getUserSocketId: (userId) => {
    return userSockets.get(userId.toString());
  }
};
