class Errorhandler extends Error {
  constructor(message, statusCode) {
    super(message); // Correct usage of 'super'
    this.statusCode = statusCode;
  }
}

export const errorMiddelware = (err, req, res, next) => {
  err.message = err.message || "Internal server Error";
  err.statusCode = err.statusCode || 500;

  if (err.code === 11000) {
    const statusCode = 400;
    const message = `Duplicate field values Entered`;
    err = new Errorhandler(message, statusCode);
  }
  if (err.name === "JsonWebTokenError") {
    const statusCode = 400;
    const message = `JWT id invalid`;
    err = new Errorhandler(message, statusCode);
  }
  if (err.name === "TokenExpiredError") {
    const statusCode = 400;
    const message = `Login again`;
    err = new Errorhandler(message, statusCode);
  }
  if (err.name === "CastError") {
    const statusCode = 400;
    const message = `resouce not found`;
    err = new Errorhandler(message, statusCode);
  }
  const errorMessage = err.errors
    ? Object.values(err.errors)
        .map((error) => error.message)
        .join(" ")
    : err.message;

    return res.status(err.statusCode).json({
        success:false,
        message:errorMessage
    })
};

export default Errorhandler
