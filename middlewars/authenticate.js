const { httpError } = require("../utils");
const jwt = require("jsonwebtoken");
// const SECRET_KEY = "secret";
const { SECRET_KEY } = process.env;
const { User } = require("../models/user");

// const authenticate = async (req, res, next) => {
//   const { authorization = "" } = req.headers;
//   const [bearer, token] = authorization.split(" ");
//   if (bearer !== "Bearer" || !token) {
//     next(
//       // httpError(401)
//       res.status(401).json({ message: "Not authorized"})
//       );
//   }
//   try {
//     const { id } = jwt.verify(token, SECRET_KEY);
//     const user = await User.findById(id);
//     if (!user || !user.token || user.token !== token) {
//       next(
//         // httpError(401)
//         res.status(401).json({ message: "Not authorized"})
//         );
//     }
//     req.user = user;
//     next();
//   } catch {
//     next(res.status(401).json({ message: "Not authorized"}));
//   }
// };

// module.exports = authenticate;
////////////////////////////////
const authenticate = async (req, res, next) => {
  const { authorization = "" } = req.headers;
  const [bearer, token] = authorization.split(" ");
  if (bearer !== "Bearer") {
    return next(res.status(401).json({ message: "Not authorized" }));
  }
  try {
    const { id } = jwt.verify(token, SECRET_KEY);
    const user = await User.findById(id);
    if (!user || !user.token || user.token !== token) {
      return next(res.status(401).json({ message: "Not authorized" }));
    }
    req.user = user;
    next();
  } catch (error) {
    return next(error); // Pass the error to the error handling middleware
  }
};

module.exports = authenticate;