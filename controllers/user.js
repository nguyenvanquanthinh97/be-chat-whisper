const { get } = require('lodash');

const User = require('../model/user');

module.exports.getUserDetail = async (req, res, next) => {
  const userId = get(req.params, 'userId');
  const companyId = req.companyId;

  try {
    const user = await User.findById(userId);
    if (!user) {
      const error = new Error('UserID is not valid');
      error.statusCode = 404;
      throw error;
    }
    if (get(user, 'companyId').toString() !== companyId.toString()) {
      const error = new Error('Invalid companyId');
      error.statusCode = 401;
      throw error;
    }

    res.status(200).json({ message: "Log in success", userId: user._id.toString(), username: user.username, email: get(user, 'email'), companyId: get(user, 'companyId'), img: get(user._doc, 'img') });
  } catch (error) {
    next(error);
  }
};