const { get, set } = require('lodash');
const jwt = require('jsonwebtoken');
const moment = require('moment-timezone');

const { convertFromObjectIdToTimestamp } = require('../utils/convertTimestamp');
const { fetchRooms } = require('./roomManager');
const BlackList = require('../model/blacklist');
const User = require('../model/user');
const Company = require('../model/company');
const Room = require('../model/room');
const UserActivity = require('../model/user-activity');

const userWithSocket = {};

module.exports.mainSocket = async (io) => {
  try {
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
        const companyId = get(socket, 'companyId');
        const userId = get(socket, 'userId');
        const username = get(socket, 'username');
        const email = get(socket, 'email');

        socket.on('login', async () => {
          if (get(userWithSocket, userId, '') === '') {
            set(userWithSocket, userId, []);
          }
          userWithSocket[userId].push(socket.id);
          const userActivity = await UserActivity.findOne({ userId: userId });
          userActivity.isOnline = true;
          userActivity.lastActive = moment();
          await userActivity.save();
          io.of(`/${companyId}`).emit('userActivityList', { userId, isOnline: true });
        });

        socket.on('disconnect', async () => {
          userWithSocket[userId] = get(userWithSocket, userId, []).filter(socketId => socketId !== socket.id);
          if (userWithSocket[userId].length === 0) {
            const userActivity = await UserActivity.findOne({ userId: userId });
            userActivity.isOnline = false;
            userActivity.lastActive = moment();
            await userActivity.save();
            io.of(`/${companyId}`).emit('userActivityList', { userId, isOnline: false });
          }
        });

        socket.on("joinCompanyChat", async (callback) => {
          const rooms = await fetchRooms(companyId, userId, email, username);
          const userActivities = await UserActivity.find({ companyId: companyId }, { userId: 1, isOnline: 1, lastActive: 1 });
          rooms.forEach(room => {
            socket.join(get(room, 'id'));
          });
          callback(rooms, userActivities);
        });

        socket.on("messageFromClient", async (message, roomId) => {
          if (get(message, 'content') === '') {
            return;
          }
          const room = await Room.findById(roomId);
          const formatMessage = {
            senderId: userId,
            content: get(message, 'content'),
            contentType: get(message, 'contentType'),
            createdAt: moment()
          };
          room.messages.push(formatMessage);
          await room.save();
          socket.to(roomId).emit("messageFromServer", message, roomId);
        });
      });
    });
  } catch (error) {
    socket.on('error', error);
    socket.disconnect();
  }
};
