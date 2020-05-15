const { get, set } = require('lodash');
const jwt = require('jsonwebtoken');
const moment = require('moment-timezone');
const mongoose = require('mongoose');

const { convertFromObjectIdToTimestamp } = require('../utils/convertTimestamp');
const { fetchRooms } = require('./roomManager');
const BlackList = require('../model/blacklist');
const User = require('../model/user');
const Company = require('../model/company');
const Room = require('../model/room');
const UserActivity = require('../model/user-activity');
const cloudinary = require('../config/cloudinary');

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
          try {
            const userActivity = await UserActivity.findOne({ userId: userId });
            if (userActivity) {
              userActivity.isOnline = true;
              userActivity.lastActive = moment();
              await userActivity.save();
            }
            io.of(`/${companyId}`).emit('userActivityList', { userId, isOnline: true });
          } catch (error) {
            socket.emit("error", error);
          }
        });

        socket.on('disconnect', async () => {
          try {
            userWithSocket[userId] = get(userWithSocket, userId, []).filter(socketId => socketId !== socket.id);
            if (userWithSocket[userId].length === 0) {
              const userActivity = await UserActivity.findOne({ userId: userId });
              userActivity.isOnline = false;
              userActivity.lastActive = moment();
              await userActivity.save();
              io.of(`/${companyId}`).emit('userActivityList', { userId, isOnline: false, lastActiviy: moment() });
            }
          } catch (error) {
            socket.emit("error", error);
          }
        });

        socket.on("joinCompanyChat", async (callback) => {
          try {
            const rooms = await fetchRooms(companyId, userId, email, username);
            // const userActivities = await UserActivity.find({ companyId: companyId }, { userId: 1, isOnline: 1, lastActive: 1 });
            const userActivities = await UserActivity.aggregate([
              {
                $match: { companyId: mongoose.Types.ObjectId(companyId) }
              },
              {
                $lookup: {
                  from: User.collection.name,
                  localField: 'userId',
                  foreignField: '_id',
                  as: 'userInfo'
                }
              },
              {
                $project: {
                  userId: 1,
                  isOnline: 1,
                  lastActive: 1,
                  avatar: '$userInfo.img'
                }
              }
            ]);

            rooms.forEach(room => {
              socket.join(get(room, 'id'));
            });
            callback(rooms, userActivities);
          } catch (error) {
            socket.emit("error", error);
          }
        });

        socket.on("messageFromClient", async (message, roomId) => {
          try {
            const messageType = get(message, 'contentType', 'text');

            const fileTypes = ['image', 'file'];

            if (get(message, 'content') === '' && !fileTypes.includes(messageType)) {
              return;
            }

            const room = await Room.findById(roomId);

            if (fileTypes.includes(messageType)) {
              let file = get(message, 'file');
              const fileName = get(message, 'fileName');
              const result = await cloudinary.uploads(file, fileName, 'conversation');
              const formatImageMessage = {
                senderId: userId,
                content: get(result, 'url'),
                contentType: messageType,
                createdAt: moment()
              };
              room.messages.push(formatImageMessage);

              const receiveUnread = room.unread.find(item => item.userId.toString() !== userId);
              receiveUnread.total += 1;
              await room.save();
              const clientFormatMessage = { ...formatImageMessage, username: get(message, 'username'), avatar: get(message, 'avatar') };
              io.of(`/${companyId}`).to(roomId).emit("messageFromServer", clientFormatMessage, roomId, receiveUnread.total);
            }

            if (get(message, 'content', '') === '') {
              return;
            }

            const formatMessage = {
              senderId: userId,
              content: get(message, 'content'),
              contentType: 'text',
              createdAt: moment()
            };
            room.messages.push(formatMessage);

            const receiveUnread = room.unread.find(item => item.userId.toString() !== userId);
            receiveUnread.total += 1;
            await room.save();
            if (messageType !== 'text') {
              const formatTextMessage = {
                ...formatMessage,
                username: get(message, 'username'),
                avatar: get(message, 'avatar'),
                contentType: 'text'
              };
              socket.to(roomId).emit("messageFromServer", formatTextMessage, roomId, receiveUnread.total);
              return;
            }
            socket.to(roomId).emit("messageFromServer", formatMessage, roomId, receiveUnread.total);
          } catch (error) {
            socket.emit("error", error);
          }
        });

        socket.on("readMessagesFromRoom", async (roomId) => {
          try {
            const room = await Room.findById(roomId);
            const userUnread = room.unread.find(item => item.userId.toString() === userId);
            userUnread.total = 0;
            await room.save();
          } catch (error) {
            socket.emit("error", error);
          }
        });
      });
    });
  } catch (error) {
    socket.on('error', error);
    socket.disconnect();
  }
};
