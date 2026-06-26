export default function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  if (process.env.NODE_ENV !== "test") {
    console.error(`[ERROR] ${status} - ${message}`);
    if (err.stack) console.error(err.stack);
  }

  return res.status(status).json({ success: false, message });
}
