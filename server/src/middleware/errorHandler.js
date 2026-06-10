function errorHandler(error, req, res, next) {
  if (res.headersSent) {
    return next(error);
  }

  if (error.status) {
    return res.status(error.status).json({
      success: false,
      message: error.message
    });
  }

  if (error.code === 'ER_DUP_ENTRY') {
    return res.status(400).json({
      success: false,
      message: 'A record with one of these unique values already exists'
    });
  }

  if (error.code === 'ER_NO_REFERENCED_ROW_2') {
    return res.status(400).json({
      success: false,
      message: 'The referenced record does not exist'
    });
  }

  console.error(error);
  return res.status(500).json({
    success: false,
    message: 'Unexpected server error'
  });
}

module.exports = errorHandler;
