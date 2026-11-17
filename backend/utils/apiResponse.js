/**
 * Standardized API Response Utilities
 */

export const sendSuccess = (res, data = null, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data
  });
};

export const sendError = (res, message = 'An error occurred', statusCode = 400, errors = null) => {
  const payload = {
    success: false,
    message
  };

  if (errors) {
    payload.errors = errors;
  }

  return res.status(statusCode).json(payload);
};

export const sendPaginated = (res, items = [], total = 0, page = 1, limit = 20, message = 'Data fetched successfully') => {
  const numericPage = parseInt(page) || 1;
  const numericLimit = parseInt(limit) || 20;

  return res.status(200).json({
    success: true,
    message,
    data: {
      items,
      total,
      page: numericPage,
      limit: numericLimit,
      pages: Math.ceil(total / numericLimit) || 1
    }
  });
};
