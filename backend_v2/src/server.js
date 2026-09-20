import http from 'http';
import os from 'os';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, pool } from './config/database.js';
import { initSocket } from './config/socket.js';
import { setupSockets } from './sockets/index.js';

function getLocalIpAddress() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

async function startServer() {
  // 1. Connect to PostgreSQL
  await connectDatabase();

  // 2. Create Express app
  const app = createApp();

  // 3. Create HTTP server
  const httpServer = http.createServer(app);

  // 4. Initialize Socket.IO and attach handlers
  const io = initSocket(httpServer);
  setupSockets(io);

  // 5. Start listening
  const server = httpServer.listen(env.PORT, '0.0.0.0', () => {
    const lanIp = getLocalIpAddress();
    console.log('\n\x1b[1m\x1b[32m%s\x1b[0m', '🚀 FluentEdge Backend V2 (Node.js + Express + Socket.IO) is running:');
    console.log(`   - Local:   \x1b[36mhttp://localhost:${env.PORT}\x1b[0m`);
    if (lanIp) {
      console.log(`   - Network: \x1b[1m\x1b[36mhttp://${lanIp}:${env.PORT}\x1b[0m`);
    }
    console.log(`   - Health:  http://localhost:${env.PORT}/api/v1/health`);
    console.log(`   - DB Mode: Direct SQL (pg.Pool, No ORM)`);
    console.log(`   - Realtime: Socket.IO Enabled\n`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`💥 Port ${env.PORT} is already in use. Please stop the existing process or change PORT in backend_v2/.env`);
    } else {
      console.error('💥 Server startup error:', error);
    }
    process.exit(1);
  });

  // Graceful shutdown
  const shutdown = async (signal) => {
    console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
    server.close(async () => {
      console.log('🚪 HTTP & Socket server closed.');
      await pool.end();
      console.log('🐘 PostgreSQL pool drained.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

startServer().catch((err) => {
  console.error('💥 Fatal error during server startup:', err);
  process.exit(1);
});
