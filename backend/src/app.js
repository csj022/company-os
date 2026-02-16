const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const { ApolloServerPluginDrainHttpServer } = require('@apollo/server/plugin/drainHttpServer');
const config = require('./config');
const logger = require('./utils/logger');
const corsMiddleware = require('./middleware/cors');
const { standardLimiter } = require('./middleware/rateLimiter');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const routes = require('./routes');
const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const { verifyAccessToken } = require('./utils/jwt');

const createApp = async (httpServer) => {
  const app = express();
  
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: config.env === 'production',
    crossOriginEmbedderPolicy: false,
  }));
  
  // Compression
  app.use(compression());
  
  // Request logging
  if (config.env === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined', {
      stream: {
        write: (message) => logger.info(message.trim()),
      },
    }));
  }
  
  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  
  // CORS
  app.use(corsMiddleware);
  
  // Rate limiting
  app.use('/api/', standardLimiter);
  
  // REST API routes
  app.use('/api', routes);
  
  // GraphQL Server
  const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    plugins: [
      ApolloServerPluginDrainHttpServer({ httpServer }),
    ],
    formatError: (formattedError, error) => {
      logger.error('GraphQL Error:', error);
      return formattedError;
    },
  });
  
  await apolloServer.start();
  
  app.use(
    '/graphql',
    corsMiddleware,
    express.json(),
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        // Extract user from JWT token
        const authHeader = req.headers.authorization;
        let user = null;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
          const token = authHeader.substring(7);
          const decoded = verifyAccessToken(token);
          
          if (decoded) {
            user = {
              id: decoded.userId,
              organizationId: decoded.organizationId,
              role: decoded.role,
            };
          }
        }
        
        return { user };
      },
    })
  );
  
  // 404 handler
  app.use(notFoundHandler);
  
  // Error handler
  app.use(errorHandler);
  
  logger.info('Express app created successfully');
  
  return app;
};

module.exports = createApp;
