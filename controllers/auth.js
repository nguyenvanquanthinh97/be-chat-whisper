const { get } = require('lodash');
const Joi = require('@hapi/joi');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const User = require('../model/user');
const BlackList = require('../model/blacklist');

module.exports.login = async (req, res, next) => {

  const email = get(req.body, 'email');
  const password = get(req.body, 'password');

  const schema = Joi.object().keys({
    email: Joi.string().trim().email().required(),
    password: Joi.string().required()
  });

  const { error, value } = schema.validate({ email, password });

  if (error) {
    error.statusCode = 422;
    return next(error);
  }

  try {
    const user = await User.findOne({ email: email });
    if (!user) {
      const error = new Error("Invalid Email");
      error.statusCode = 401;
      throw (error);
    }
    const result = await bcrypt.compare(get(value, 'password'), get(user, 'password'));
    if (!result) {
      const error = new Error("Invalid Password");
      error.statusCode = 401;
      throw (error);
    }
    const token = 'Bearer ' + jwt.sign({ email: email, userId: user._id, username: user.username, companyId: get(user, 'companyId') }, process.env.JWT_SECRET);

    res.status(200).json({ message: "Log in success", token, userId: user._id.toString(), username: user.username, email: email, companyId: get(user, 'companyId') });
  } catch (error) {
    next(error);
  }
};

module.exports.logout = async (req, res, next) => {
  const blackToken = new BlackList({ jwt: get(req, 'token') });
  try {
    await blackToken.save();
    res.status(200).json({ message: "Logout Success" });
  } catch (error) {
    error.statusCode = 500;
    return next(error);
  }
};