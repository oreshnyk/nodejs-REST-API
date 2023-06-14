// const { httpError } = require('../utils');

// const validateBody = schema => {
//     const func = (req, res, next) => {
//         const { error } = schema.validate(req.body);
//         if (error) {
//            next(httpError(400, error.message))
//         }
//         next()
//     }
//     return func;
// }

// module.exports = validateBody;

////////////////////////////////////////////////////////////////

const { httpError } = require('../utils');

const validateBody = schema => {
  const func = (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      const errorMessage = error.details[0].message.replace(/['"]/g, ''); // Extract the error message and remove quotes
      next(httpError(400, { message: errorMessage }));
    }
    next();
  };
  return func;
};

module.exports = validateBody;
