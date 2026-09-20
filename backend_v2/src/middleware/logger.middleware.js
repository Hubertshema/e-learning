/**
 * HTTP Request Logger Middleware
 */
export function requestLogger(req, res, next) {
  const start = Date.now();
  const { method, originalUrl, ip } = req;

  res.on('finish', () => {
    const duration = Date.now() - start;
    const status = res.statusCode;

    // Color code status
    let statusColor = '\x1b[32m'; // green
    if (status >= 400 && status < 500) statusColor = '\x1b[33m'; // yellow
    if (status >= 500) statusColor = '\x1b[31m'; // red

    console.log(
      `${statusColor}${method}\x1b[0m ${originalUrl} ${statusColor}${status}\x1b[0m - ${duration}ms (${ip})`
    );
  });

  next();
}
