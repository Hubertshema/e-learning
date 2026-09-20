/**
 * Standard Success Response
 */
export function sendSuccess(res, data = null, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

/**
 * Standard Error Response
 */
export function sendError(
  res,
  message = 'An error occurred',
  statusCode = 500,
  code = 'INTERNAL_ERROR',
  details = null
) {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  });
}

/**
 * Standard Paginated Response
 */
export function sendPaginated(res, items = [], total = 0, page = 1, limit = 10, message = 'Success') {
  const totalPages = Math.ceil(total / limit);
  return res.status(200).json({
    success: true,
    message,
    data: items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total: Number(total),
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
}
