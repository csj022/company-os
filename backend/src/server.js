require('dotenv').config();
const http = require('http');
const createApp = require('./app');
const { initializeWebSocket } = require('./websocket/server');
const { initializeWebSocketHandlers } = require('./websocket/handlers');
const { initializeGitHubHandlers } = require('./events/handlers/github');
const { initializeVercelHandlers } = require('./events/handlers/vercel');
const { pool } = require('./config/database');
const { redisClient } = require('./config/redis');
const config = require('./config');
const logger = require('./utils/logger');

const startServer = async () => {
  try {
    // Create HTTP server
    const httpServer = http.createServer();
    
    // Create Express app
    const app = await createApp(httpServer);
    
    // Attach Express to HTTP server
    httpServer.on('request', app);
    
    // Initialize WebSocket server
    const io = initializeWebSocket(httpServer);
    
    // Initialize event handlers
    initializeGitHubHandlers();
    initializeVercelHandlers();
    initializeWebSocketHandlers(io);
    
    // Test database connection
    await pool.query('SELECT NOW()');
    logger.info('Database connected successfully');
    
    // Test Redis connection
    await redisClient.ping();
    logger.info('Redis connected successfully');
    
    // Start server
    httpServer.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📡 REST API: http://localhost:${config.port}/api`);
      logger.info(`🔮 GraphQL: http://localhost:${config.port}/graphql`);
      logger.info(`⚡ WebSocket: ws://localhost:${config.port}`);
      logger.info(`🌍 Environment: ${config.env}`);
    });
    
    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      
      httpServer.close(async () => {
        logger.info('HTTP server closed');
        
        // Close database connections
        await pool.end();
        logger.info('Database pool closed');
        
        // Close Redis connections
        await redisClient.quit();
        logger.info('Redis client closed');
        
        process.exit(0);
      });
      
      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown');
        process.exit(1);
      }, 10000);
    };
    
    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();
