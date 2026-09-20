import { query } from '../config/database.js';
import { getIO } from '../config/socket.js';
import { sendSuccess } from '../utils/response.util.js';

export class HealthController {
  /**
   * GET /api/v1/health
   */
  static async check(_req, res, next) {
    try {
      let dbStatus = 'CONNECTED';
      let dbTimestamp = null;

      try {
        const dbRes = await query('SELECT NOW() AS now');
        dbTimestamp = dbRes.rows[0].now;
      } catch (err) {
        dbStatus = `DISCONNECTED: ${err.message}`;
      }

      let socketConnected = 0;
      try {
        const io = getIO();
        socketConnected = io.sockets.sockets.size;
      } catch {
        socketConnected = 0;
      }

      return sendSuccess(res, {
        status: dbStatus === 'CONNECTED' ? 'UP' : 'DEGRADED',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: {
          status: dbStatus,
          timestamp: dbTimestamp,
        },
        socket: {
          connectedClients: socketConnected,
        },
        version: '2.0.0',
        architecture: 'Node.js + Express.js + Socket.IO (Direct SQL)',
      });
    } catch (err) {
      next(err);
    }
  }
}
