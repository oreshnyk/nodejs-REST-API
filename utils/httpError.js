const errorMessageList = {
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  409: "Conflict",
};

const httpError = (status, message = errorMessageList[status]) => {
  const error = new Error();
  error.status = status;
  error.message = message || errorMessageList[status] || 'Server Error';
  return error;
};

module.exports = httpError;
