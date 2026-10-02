import http from 'http';
import os from 'os';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase, pool } from './config/database.js';
import { initSocket } from './config/socket.js';
import { setupSockets } from './sockets/index.js';
import { runComprehensiveSeed } from './seeds/comprehensive_seeder.js';
import { ensureInteractiveVideoSchema } from './config/interactive-video-schema.js';
import { initAdmissionSchema } from './config/init-admission-schema.js';
import { ensureLiveSessionSchema } from './config/live-session-schema.js';
import { ensureEmailSchema } from './config/email-schema.js';

// Live session schema and routes active

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
  await ensureInteractiveVideoSchema();
  await initAdmissionSchema();
  await ensureLiveSessionSchema();
  await ensureEmailSchema();

  // 1.1 Run Comprehensive Super Admin Seeder in background (only if requested or in development)
  if (process.env.RUN_SEEDER === 'true' || env.NODE_ENV === 'development') {
    runComprehensiveSeed().catch((seedErr) => {
      console.warn('⚠️ Seeding warning (non-fatal):', seedErr.message);
    });
  }

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
