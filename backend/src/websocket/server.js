const { Server } = require('socket.io');
const { verifyAccessToken } = require('../utils/jwt');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Initialize WebSocket server
 */
const initializeWebSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: config.frontendUrl,
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });
  
  // Authentication middleware
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error'));
    }
    
    const decoded = verifyAccessToken(token);
    
    if (!decoded) {
      return next(new Error('Invalid token'));
    }
    
    socket.user = {
      id: decoded.userId,
      organizationId: decoded.organizationId,
      role: decoded.role,
    };
    
    next();
  });
  
  // Connection handler
  io.on('connection', (socket) => {
    logger.info(`WebSocket client connected: ${socket.user.id}`);
    
    // Join organization room
    const orgRoom = `org:${socket.user.organizationId}`;
    socket.join(orgRoom);
    
    // Join user-specific room
    const userRoom = `user:${socket.user.id}`;
    socket.join(userRoom);
    
    // Subscribe to channels
    socket.on('subscribe', (data) => {
      const { channel, filters } = data;
      
      switch (channel) {
        case 'deployments':
          socket.join(`${orgRoom}:deployments`);
          break;
        case 'pull_requests':
          socket.join(`${orgRoom}:pull_requests`);
          if (filters?.repoId) {
            socket.join(`${orgRoom}:pull_requests:${filters.repoId}`);
          }
          break;
        case 'agent_tasks':
          socket.join(`${orgRoom}:agent_tasks`);
          break;
        case 'events':
          socket.join(`${orgRoom}:events`);
          break;
        default:
          logger.warn(`Unknown subscription channel: ${channel}`);
      }
      
      logger.debug(`Socket ${socket.id} subscribed to ${channel}`);
    });
    
    // Unsubscribe from channels
    socket.on('unsubscribe', (data) => {
      const { channel } = data;
      socket.leave(`${orgRoom}:${channel}`);
      logger.debug(`Socket ${socket.id} unsubscribed from ${channel}`);
    });
    
    // Handle disconnection
    socket.on('disconnect', () => {
      logger.info(`WebSocket client disconnected: ${socket.user.id}`);
    });
    
    // Error handling
    socket.on('error', (error) => {
      logger.error('WebSocket error:', error);
    });
  });
  
  logger.info('WebSocket server initialized');
  
  return io;
};

/**
 * Emit event to organization room
 */
const emitToOrganization = (io, organizationId, event, data) => {
  io.to(`org:${organizationId}`).emit(event, data);
};

/**
 * Emit event to specific channel
 */
const emitToChannel = (io, organizationId, channel, event, data) => {
  io.to(`org:${organizationId}:${channel}`).emit(event, data);
};

/**
 * Emit event to specific user
 */
const emitToUser = (io, userId, event, data) => {
  io.to(`user:${userId}`).emit(event, data);
};

module.exports = {
  initializeWebSocket,
  emitToOrganization,
  emitToChannel,
  emitToUser,
};
