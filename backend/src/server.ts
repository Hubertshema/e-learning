import { createApp } from './app.js';
import { env } from './config/env.js';
import { connectDatabase } from './config/database.js';

import { cronService } from './services/cron.service.js';

async function startServer(): Promise<void> {
  // 1. Connect to PostgreSQL via Prisma
  await connectDatabase();

  // 2. Instantiate Express application
  const app = createApp();

  // 3. Start background cron workers
  cronService.startScheduledJobs();

  // 4. Start listening on configured port
  const server = app.listen(env.PORT, () => {
    console.log(`🚀 E-Learning Backend API is running on http://localhost:${env.PORT}`);
    console.log(`🌐 Health check available at http://localhost:${env.PORT}/api/v1/health`);
    console.log(`📖 Swagger API Docs: http://localhost:${env.PORT}/api/docs`);
    console.log(`🔒 Environment: ${env.NODE_ENV}`);
  });

  server.on('error', (error: any) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`💥 Port ${env.PORT} is already in use. Please kill the process using port ${env.PORT} or change PORT in .env`);
    } else {
      console.error('💥 Server error:', error);
    }
    process.exit(1);
  });

  // Graceful shutdown handling
  const shutdown = (signal: string) => {
    console.log(`\n🛑 ${signal} received. Shutting down gracefully...`);
    server.close(() => {
      console.log('🚪 HTTP server closed.');
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
