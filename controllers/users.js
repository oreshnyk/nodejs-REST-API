const fs = require('fs/promises');
const bcryptjs = require("bcryptjs");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const jimp = require("jimp");

const { User } = require("../models/user");
const { httpError, ctrlWrapper, cloudinary } = require("../utils");
const { SECRET_KEY } = process.env;

const register = async (req, res, next) => {
  const { email, password } = req.body;
  // const { path: oldPath } = req.file;
  // const fileData = await cloudinary.uploader.upload(oldPath, {
  //   folder: "avatars"
  // })
  // await fs.unlink(oldPath);

  const user = await User.findOne({ email });
  if (user) {
    // throw httpError(409, "Email in use");
    res.status(409).json({
      message: "Email in use"
    })
  }

  const hashedPassword = await bcryptjs.hash(password, 10);
  // шаг 3
  const avatarUrl = gravatar.url(email, { s: '200', r: 'pg', d: 'identicon' });
  const normalizedAvatarUrl = avatarUrl.replace(/^\/\//, 'https://');
  // const avatarUrl = fileData.url;

  const newUser = await User.create({ ...req.body, password: hashedPassword, avatarURL: normalizedAvatarUrl });


  res.status(201).json({
    user: {
      email: newUser.email,
      subsription: newUser.subscription,
      avatarURL: normalizedAvatarUrl
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
  updateAvatar: ctrlWrapper(updateAvatar),
  getCurrentUser: ctrlWrapper(getCurrentUser),
  logout: ctrlWrapper(logout),
};