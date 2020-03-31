const { get } = require('lodash');
const jwt = require('jsonwebtoken');
const moment = require('moment-timezone');

const { convertFromObjectIdToTimestamp } = require('../utils/convertTimestamp');
const { fetchRooms } = require('./roomManager');
const BlackList = require('../model/blacklist');
const User = require('../model/user');
const Company = require('../model/company');
const Room = require('../model/room');
const UserActivity = require('../model/user-activity');

module.exports.mainSocket = async (io) => {
  const companies = await Company.find({}, { _id: 1 });
  const companyIds = companies.map(company => get(company, '_id'));
  companyIds.map((companyId) => {
    io.of(`/${companyId}`).use(async (socket, next) => {
      const token = get(socket, 'handshake.query.token').split(' ')[1];
      let decoded;
      if (!token) {
        return next(new Error("Token doesn't exist"));
      }

      const blackJWT = await BlackList.findOne({ jwt: token });

      if (blackJWT) {
        return next(new Error("Invalid Token"));
      }

      try {
        decoded = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        return next(new Error(err));
      }

      socket.companyId = get(decoded, 'companyId');
      socket.userId = get(decoded, 'userId');
      socket.username = get(decoded, 'username');
      socket.email = get(decoded, 'email');
      return next();
    }).on('connect', async (socket) => {
      console.log(socket.id + " has connected to Server");
  
      const companyId = get(socket, 'companyId');
      const userId = get(socket, 'userId');
      const username = get(socket, 'username');
      const email = get(socket, 'email');
  
      socket.emit("roomList", await fetchRooms(companyId, userId, email, username));
    });
  })
};
