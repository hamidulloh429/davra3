const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    console.error('Error in request:', err);
  }

  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.status || err.statusCode || 500;
  
  let message = "Serverda xatolik yuz berdi. Iltimos, keyinroq qayta urinib ko'ring.";

  if (statusCode === 400) {
    message = err.message || "Noto'g'ri so'rov.";
  } else if (statusCode === 401) {
    message = "Avtorizatsiya talab qilinadi.";
  } else if (statusCode === 403) {
    message = "Ruxsat berilmagan.";
  } else if (statusCode === 404) {
    message = "So'ralgan resurs topilmadi.";
  } else if (statusCode === 429) {
    message = "Juda ko'p so'rovlar. Iltimos, keyinroq qayta urinib ko'ring.";
  }

  res.status(statusCode).json({
    error: true,
    message: message
  });
};

module.exports = errorHandler;
