const crypto = require("node:crypto");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const gravatar = require("gravatar");
const path = require("path");
const fs = require("fs/promises");
const Jimp = require("jimp");

const { User } = require("../models/user");

const { HttpError, ctrlWrapper, sendEmail } = require("../helpers");

const { SECRET_KEY, BASE_URL } = process.env;

const register = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });

  if (user) {
    throw HttpError(409, "Email in use");
  }

  const hashPassword = await bcrypt.hash(password, 10);
  const avatarURL = gravatar.url(email);
  const verificationToken = crypto.randomUUID();

  await sendEmail({
    to: email,
    subject: "Verify email",
    html: `To confirm your registration please click on the <a href="${BASE_URL}/users/verify/${verificationToken}">link</a>`,
    text: `To confirm your registration please open the link ${BASE_URL}/users/verify/${verificationToken}`,
  });

  const newUser = await User.create({
    ...req.body,
    password: hashPassword,
    avatarURL,
    verificationToken,
  });

  res.status(201).json({
    user: {
      email: newUser.email,
      subscription: newUser.subscription,
    },
  });
};

async function verify(req, res, next) {
  const { verificationToken } = req.params;

  const user = await User.findOne({ verificationToken }).exec();

  if (user === null) {
    throw HttpError(404);
  }

  await User.findByIdAndUpdate(user._id, {
    verify: true,
    verificationToken: null,
  });

  res.send({ message: "Verification successful" });
}

const resendVerifyEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw HttpError(400, "Missing required field email");
  }

  const { verificationToken } = await User.findOne({ email });

  if (!verificationToken) {
    throw HttpError(400, "Verification has already been passed");
  }

  const verifyEmail = {
    to: email,
    subject: "Verify email",
    html: `To confirm your registration please click on the <a target="_blank" href="${BASE_URL}/users/verify/${verificationToken}">Click verify email</a>`,
    text: `To confirm your registration please open the link ${BASE_URL}/users/verify/${verificationToken}`,
  };

  await sendEmail(verifyEmail);

  res.json({
    message: "Verification email sent",
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    throw HttpError(401, "Email or password invalid");
  }
  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, "Email or password is wrong");
  }

  const payload = {
    id: user._id,
  };

  if (user.verify !== true) {
    return res.status(401).send({ message: "Your account is not verified" });
  }

  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: "23h" });
  await User.findByIdAndUpdate(user._id, { token });

  res.json({
    token,
    user: {
      email: user.email,
      subscription: user.subscription,
    },
  });
};

const getCurrent = async (req, res) => {
  const { email, subscription } = req.user;

  res.json({
    email,
    subscription,
  });
};

const logout = async (req, res) => {
  const { _id } = req.user;
  await User.findByIdAndUpdate(_id, { token: "" });

  res.status(204).json();
};

const updateSubscription = async (req, res) => {
  const { _id, email } = req.user;
  const { subscription } = req.body;
  await User.findByIdAndUpdate(_id, { subscription: subscription });

  res.json({
    message: "updated",
    user: {
      email,
      subscription,
    },
  });
};

const uploadAvatar = async (req, res, next) => {
  const image = await Jimp.read(req.file.path);
  image.resize(250, 250).write(req.file.path);

  await fs.rename(
    req.file.path,
    path.join(__dirname, "..", "public/avatars", req.file.filename)
  );

  const user = await User.findByIdAndUpdate(
    req.user.id,
    { avatarURL: req.file.filename },
    { new: true }
  ).exec();
  if (user === null) {
    return res.status(404).send({ massege: "User not found" });
  }

  res.send(user);
};

module.exports = {
  register: ctrlWrapper(register),
  verify: ctrlWrapper(verify),
  resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
  login: ctrlWrapper(login),
  getCurrent: ctrlWrapper(getCurrent),
  logout: ctrlWrapper(logout),
  updateSubscription: ctrlWrapper(updateSubscription),
  uploadAvatar: ctrlWrapper(uploadAvatar),
};
