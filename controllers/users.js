const fs = require('fs/promises');
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const jimp = require("jimp");

const { User } = require("../models/user");
const { httpError, ctrlWrapper, cloudinary } = require("../utils");
const { SECRET_KEY } = process.env;
const { sendVerificationEmail } = require("../utils/sendEmail");
const { nanoid } = require('nanoid');

const register = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (user) {
    res.status(409).json({
      message: "Email in use"
    })
  }

  const hashedPassword = await bcryptjs.hash(password, 10);
  // шаг 3
  const avatarUrl = gravatar.url(email, { s: '200', r: 'pg', d: 'identicon' });
  const normalizedAvatarUrl = avatarUrl.replace(/^\/\//, 'https://');
  const verificationToken = nanoid();

  const newUser = await User.create({ ...req.body, password: hashedPassword, avatarURL: normalizedAvatarUrl, verificationToken });

  try {
    await sendVerificationEmail(email, verificationToken);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send verification email' });
    return;
  }


  res.status(201).json({
    user: {
      email: newUser.email,
      subscription: newUser.subscription,
      avatarURL: normalizedAvatarUrl
    }
  });
};

const verifyEmail = async (req, res) => {
  const { verificationToken } = req.params;

  try {
    const user = await User.findOne({ verificationToken });
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    await User.findByIdAndUpdate(user._id, { verify: true, verificationToken: '' });

    res.status(200).json({ message: 'Verification successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

const resendVerificationEmail = async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  if (!user) {
    const error = httpError(400, 'Email not found');
    return res.status(error.status).json({ message: error.message });
  }

  if (user.verify) {
    const error = httpError(400, 'Verification has already been passed');
    return res.status(error.status).json({ message: error.message });
  }

  let verificationToken = user.verificationToken;

  if (!verificationToken) {
    verificationToken = nanoid();
    user.verificationToken = verificationToken;
    await user.save();
  }

  try {
    await sendVerificationEmail(email, verificationToken);
    res.status(200).json({ message: 'Verification email sent' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to send verification email' });
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) {
    // throw httpError(401, "Email or password is wrong");
    res.status(401).json({
      message: "Email or password is wrong"
    });
    return;
  }

  if (!user.verify) {
    res.status(401).json({ message: "Email is not verified"});
    return;
  }

  const comparePassword = await bcryptjs.compare(password, user.password);
  if (!comparePassword) {
    // throw httpError(401, "Email or password is wrong");
    return res.status(401).json({
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
      subscription: user.subscription
    }
  });
};

const updateAvatar = async (req, res, next) => {
  try {
    const { path: tempFilePath, mimetype } = req.file;
    const { _id } = req.user;

    if (!tempFilePath) {
      throw httpError(400, "No file uploaded");
    }

    const fileData = await cloudinary.uploader.upload(tempFilePath, {
      folder: "avatars"
    });

    await fs.unlink(tempFilePath);

    const image = await jimp.read(fileData.secure_url);
    image.resize(250, 250).quality(80);

    const processedAvatarPath = `temp/${_id}_avatar.jpg`;
    await image.writeAsync(processedAvatarPath);

    const uniqueFilename = `${_id}_${Date.now()}${mimetype.replace("image/", ".")}`;
    const avatarPath = `public/avatars/${uniqueFilename}`;
    await fs.rename(processedAvatarPath, avatarPath);

    const updatedUser = await User.findByIdAndUpdate(
      _id,
      { avatarURL: `/avatars/${uniqueFilename}` },
      { new: true }
    );

    res.status(200).json({
      avatarURL: updatedUser.avatarURL
    });
  } catch (error) {
    next(error);
  }
};

const getCurrentUser = async (req, res, next) => {
  const { email, subscription } = req.user;
  const user = await User.findOne({ email });

  res.status(200).json({
    email: user.email,
    subscription: user.subscription,
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
  verifyEmail: ctrlWrapper(verifyEmail),
  resendVerificationEmail: ctrlWrapper(resendVerificationEmail),
  login: ctrlWrapper(login),
  updateAvatar: ctrlWrapper(updateAvatar),
  getCurrentUser: ctrlWrapper(getCurrentUser),
  logout: ctrlWrapper(logout),
};