const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    // Ensure errors are passed to Express's error handling middleware
    next(err);
  });
};

export { asyncHandler };
