const Notification = require('../models/Notification');
const socket = require('./socket');

const logNotification = async (userId, type, message, relatedEntity = null) => {
  try {
    const notification = await Notification.create({
      userId,
      type,
      message,
      relatedEntity
    });
    
    try {
      const io = socket.getIo();
      const socketId = socket.getUserSocketId(userId);
      if (socketId) {
        io.to(socketId).emit('newNotification', notification);
      }
    } catch (socketError) {
      console.error('Socket error in notification logger:', socketError);
    }
    
    return notification;
  } catch (error) {
    console.error('Error logging notification:', error);
  }
};

module.exports = logNotification;
