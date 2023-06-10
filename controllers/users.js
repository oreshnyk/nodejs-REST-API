const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models/user");
const { httpError, ctrlWrapper } = require("../utils");
const { SECRET_KEY } = process.env;

const register = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user) {
    // throw httpError(409, "Email in use");
    res.status(409).json({
      message: "Email in use"
    })
  }

  const hashedPassword = await bcryptjs.hash(password, 10);
  const newUser = await User.create({ ...req.body, password: hashedPassword });

  res.status(201).json({
    user: {
      email: newUser.email,
      subsription: newUser.subscription
    }
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // throw httpError(401, "Email or password is wrong");
    res.status(401).json({
      message: "Email or password is wrong"
    })
  }

  const comparePassword = await bcryptjs.compare(password, user.password);
  if (!comparePassword) {
    // throw httpError(401, "Email or password is wrong");
    res.status(401).json({
      message: "Email or password is wrong"
    })
  }

  const payload = {
    id: user._id,
  };
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });
  await User.findByIdAndUpdate(user._id, { token });
  res.status(201).json({
    token,
    user: {
      email: user.email,
      subsription: user.subscription
    }
  });
};

const getCurrentUser = async (req, res, next) => {
  const { email, subscription } = req.user;
  const user = await User.findOne({ email });

  res.status(200).json({
    email: user.email,
    subsription: user.subscription,
  });
};

const logout = async (req, res, next) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });

  // res.status(204);
  // res.json({ message: "Logout success" });
  res.status(204).json();
};

module.exports = {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  getCurrentUser: ctrlWrapper(getCurrentUser),
  logout: ctrlWrapper(logout),
};