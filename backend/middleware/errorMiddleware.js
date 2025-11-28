const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

const errorHandler = (err, req, res, next) => {
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode);
  
  // Log error details for debugging
  console.error('Error Handler:', {
    message: err.message,
    stack: err.stack,
    name: err.name,
    statusCode,
    path: req.path,
    method: req.method,
  });
  
  res.json({
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    ...(process.env.NODE_ENV === 'development' && { 
      name: err.name,
      path: req.path,
      method: req.method,
    }),
  });
};

export { notFound, errorHandler };
