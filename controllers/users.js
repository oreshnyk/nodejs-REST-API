const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { User } = require("../models/user");
const { httpError, ctrlWrapper, sendEmail } = require("../utils");
const { SECRET_KEY } = process.env;
// const SECRET_KEY = "parolb";
const gravatar = require("gravatar");
const path = require("path");
const fs = require("fs/promises");
const Jimp = require("jimp");
const {nanoid} = require("nanoid");

const register = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user) {
    throw httpError(409, "Email in use");
  }

  const hashedPassword = await bcryptjs.hash(password, 10);
  const avatarURL = gravatar.url(email);
  const verificationToken = nanoid();
  const newUser = await User.create({
    ...req.body,
    password: hashedPassword,
    avatarURL,
    verificationToken,
  });

  const verifyEmail = {
    to: email,
    subject: "Verify email",
    html: `<a target="_blank" href="${BASE_URL}/api/users/verify/${verificationToken}">Click to verify email</a>`

  }

  await sendEmail(verifyEmail);

  res.status(201).json({
    password: newUser.password,
    email: newUser.email,
    subsription: newUser.subscription,
  });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    throw httpError(401, "Email or password is wrong");
  }

  if (!user.verify) {
    throw httpError(401, "Email is not verificated");
  }

  const comparePassword = await bcryptjs.compare(password, user.password);
  if (!comparePassword) {
    throw httpError(401, "Email or password is wrong");
  }

  const payload = {
    id: user._id,
  };
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });
  await User.findByIdAndUpdate(user._id, { token });
  res.status(201).json({ token });
};

const getCurrentUser = async (req, res, next) => {
  const { email, password } = req.user;

  res.status(200).json({
    email,
    password,
  });
};

const logout = async (req, res, next) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });

  register.json({ message: "Logout success" });
};

const avatarsDir = path.join(__dirname, "../", "public", "avatars");

const updateAvatar = async (req, res, next) => {
  const { _id } = req.user;
  const { path: tempUpload, originalname } = req.file;
  const filename = `${_id}_${originalname}`;
  const resultUpload = path.join(avatarsDir, filename);
  await fs.rename(tempUpload, resultUpload);
  const avatarURL = path.join("public", "avatars", filename);

  const image = await Jimp.read(avatarURL);
  const resizedAvatarURL = image.resize(250, 250);
  console.log(avatarURL);

  await User.findByIdAndUpdate(_id, { avatarURL: resizedAvatarURL });

  res.status(200).json({
    avatarURL,
  });
};

const verifyEmail = async (req, res, next) => {
    const { verificationToken } = req.params;
    const user = await User.findOne({verificationToken});
    if (!user) {
      throw httpError(404, 'User not found');
    }
  
    await User.findByIdAndUpdate(user._id, { verify: true, verificationToken: "" });
  
    res.status(200).json({
      message: "Verified email"
    })
  }
  
  const resendVerification = async (req, res, next) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      throw httpError(400, "missing required field email")
    }
      if (user.verify) {
      throw httpError(400, "Verification has already been passed")
    }
  
    const verifyEmail = {
      to: email,
      subject: "Verify email",
      html: `<a target="_blank" href="${BASE_URL}/api/users/verify/${verificationToken}">Click to verify email</a>`
  
    }
    await sendEmail(verifyEmail);
  
    res.status(200).json({ message: "Verification email sent"})
  }

module.exports = {
  register: ctrlWrapper(register),
  login: ctrlWrapper(login),
  getCurrentUser: ctrlWrapper(getCurrentUser),
  logout: ctrlWrapper(logout),
  updateAvatar: ctrlWrapper(updateAvatar),
  verifyEmail: ctrlWrapper(verifyEmail),
  resendVerification: ctrlWrapper(resendVerification),
};