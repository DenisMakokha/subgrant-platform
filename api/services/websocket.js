const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * WebSocket Service for Real-time Updates
 * 
 * Features:
 * - Real-time dashboard updates
 * - Widget data refresh
 * - User notifications
 * - Connection management
 */

let io = null;

function initializeWebSocket(server) {
  io = new Server(server, {
    cors: {
      origin: process.env.WEB_URL || 'http://localhost:3001',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling']
  });

  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.sub || decoded.user_id;
      socket.userRole = decoded.role;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    logger.info(`WebSocket client connected: ${socket.userId}`);

    // Join user-specific room
    socket.join(`user:${socket.userId}`);

    // Dashboard subscription
    socket.on('dashboard:subscribe', (data) => {
      const { widgetIds } = data;
      logger.info(`User ${socket.userId} subscribed to widgets:`, widgetIds);
      
      // Join widget-specific rooms
      widgetIds.forEach(widgetId => {
        socket.join(`widget:${widgetId}`);
      });
    });

    // Dashboard unsubscribe
    socket.on('dashboard:unsubscribe', (data) => {
      const { widgetIds } = data;
      logger.info(`User ${socket.userId} unsubscribed from widgets:`, widgetIds);
      
      // Leave widget-specific rooms
      widgetIds.forEach(widgetId => {
        socket.leave(`widget:${widgetId}`);
      });
    });

    // Widget refresh request
    socket.on('widget:refresh', async (data) => {
      const { widgetId } = data;
      logger.info(`Refresh requested for widget ${widgetId} by user ${socket.userId}`);
      
      // Emit refresh event to trigger data reload
      socket.emit(`widget:${widgetId}:update`, {
        timestamp: new Date().toISOString(),
        trigger: 'manual_refresh'
      });
    });

    // Dashboard refresh request
    socket.on('dashboard:refresh', async (data) => {
      const { widgetIds } = data;
      logger.info(`Dashboard refresh requested by user ${socket.userId}`);
      
      // Emit refresh for all widgets
      widgetIds.forEach(widgetId => {
        socket.emit(`widget:${widgetId}:update`, {
          timestamp: new Date().toISOString(),
          trigger: 'dashboard_refresh'
        });
      });
    });

    // Disconnect handler
    socket.on('disconnect', () => {
      logger.info(`WebSocket client disconnected: ${socket.userId}`);
    });
  });

  logger.info('WebSocket server initialized');
  return io;
}

/**
 * Broadcast widget update to all subscribers
 */
function broadcastWidgetUpdate(widgetId, data) {
  if (!io) return;
  
  io.to(`widget:${widgetId}`).emit(`widget:${widgetId}:update`, {
    ...data,
    timestamp: new Date().toISOString()
  });
}

/**
 * Send update to specific user
 */
function sendToUser(userId, event, data) {
  if (!io) return;
  
  io.to(`user:${userId}`).emit(event, {
    ...data,
    timestamp: new Date().toISOString()
  });
}

/**
 * Broadcast dashboard update
 */
function broadcastDashboardUpdate(data) {
  if (!io) return;
  
  io.emit('dashboard:update', {
    ...data,
    timestamp: new Date().toISOString()
  });
}

/**
 * Send notification to user
 */
function sendNotification(userId, notification) {
  if (!io) return;
  
  io.to(`user:${userId}`).emit('notification', {
    ...notification,
    timestamp: new Date().toISOString()
  });
}

/**
 * Get connected clients count
 */
function getConnectedClientsCount() {
  if (!io) return 0;
  return io.sockets.sockets.size;
}

/**
 * Get user connection status
 */
function isUserConnected(userId) {
  if (!io) return false;
  
  const room = io.sockets.adapter.rooms.get(`user:${userId}`);
  return room && room.size > 0;
}

module.exports = {
  initializeWebSocket,
  broadcastWidgetUpdate,
  sendToUser,
  broadcastDashboardUpdate,
  sendNotification,
  getConnectedClientsCount,
  isUserConnected
};
