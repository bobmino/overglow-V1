/**
 * [TASK-7] Wrapper async Express — capture les rejections et les passe à next().
 * Évite les unhandled promise rejection sur Vercel serverless.
 *
 * @param {Function} fn - async (req, res, next) => ...
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch((err) => {
    if (!err.statusCode && res.statusCode && res.statusCode !== 200) {
      err.statusCode = res.statusCode;
    }
    return next(err);
  });
};

export default asyncHandler;
