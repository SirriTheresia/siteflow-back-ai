const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');
const cors = require('cors');
const { createServer } = require('http');
const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');
const { makeExecutableSchema } = require('@graphql-tools/schema');

// Import GraphQL schema and resolvers
const typeDefs = require('./schema/typeDefs');
const { resolvers } = require('./resolvers');
const { getUser } = require('./middleware/auth');
const { Automation } = require('./models');

// Environment variables
require('dotenv').config();

const PORT = process.env.PORT || 4000;
const MONGODB_URI = 'mongodb+srv://terrencechungong:1piqKAw0kiKAVTcC@cluster0.6wxee0a.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
async function startServer() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Create Express app
    const app = express();

    // Parse JSON bodies
    app.use(express.json());

    // Enable CORS
    app.use(cors({
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      credentials: true
    }));

    // Simple auth middleware for version and device control
    const { simpleAuth } = require('./middleware/simpleAuth');
    app.use(simpleAuth);

    // REST endpoint for 2FA webhook
    app.post('/webhook/2fa', async (req, res) => {
      try {
        const { automationId, code } = req.body;
        
        if (!automationId || !code) {
          return res.status(400).json({
            success: false,
            message: 'Missing automationId or code'
          });
        }
        
        // Find and update the automation with the 2FA code
        const automation = await Automation.findById(automationId);
        
        if (!automation) {
          return res.status(404).json({
            success: false,
            message: 'Automation not found'
          });
        }
        
        await automation.save();
        
        res.json({
          success: true,
          message: '2FA code received and saved successfully'
        });
      } catch (error) {
        console.error('2FA webhook error:', error.message);
        res.status(500).json({
          success: false,
          message: 'Internal server error'
        });
      }
    });

    // Create executable schema
    const schema = makeExecutableSchema({
      typeDefs,
      resolvers,
    });

    // Create Apollo Server
    const server = new ApolloServer({
      schema,
      context: async ({ req, connection }) => {
        if (connection) {
          // WebSocket connection for subscriptions
          return connection.context;
        }

        // HTTP request
        const user = await getUser(req);
        return {
          req,
          user,
        };
      },
      introspection: true,
      playground: true,
    });

    await server.start();

    // Apply Apollo GraphQL middleware
    server.applyMiddleware({ 
      app, 
      path: '/graphql',
      cors: false // We handle CORS above
    });

    // Create HTTP server
    const httpServer = createServer(app);

    // Create subscription server
    const subscriptionServer = SubscriptionServer.create(
      {
        schema,
        execute,
        subscribe,
        onConnect: async (connectionParams, webSocket, context) => {
          console.log('WebSocket connected');
          // You can add authentication here for subscriptions
          return {};
        },
        onDisconnect: (webSocket, context) => {
          console.log('WebSocket disconnected');
        },
      },
      {
        server: httpServer,
        path: server.graphqlPath,
      }
    );

    // Health check endpoint
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
      });
    });

    // Start the server
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server ready at http://localhost:${PORT}${server.graphqlPath}`);
      console.log(`🚀 2FA Webhook available at http://localhost:${PORT}/webhook/2fa`);
      console.log(`🚀 Subscriptions ready at ws://localhost:${PORT}${server.graphqlPath}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      console.log('SIGTERM received, shutting down gracefully');
      subscriptionServer.close();
      httpServer.close(() => {
        mongoose.connection.close();
        process.exit(0);
      });
    });

  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Start the server
startServer(); 