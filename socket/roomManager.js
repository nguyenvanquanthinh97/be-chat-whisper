const { get } = require('lodash');
const moment = require('moment-timezone');

const User = require('../model/user');
const Room = require('../model/room');
const UserActivity = require('../model/user-activity');

const fetchRooms = async (companyId, userId, email, username) => {
  let rooms;
  try {
    const userActivity = await UserActivity.findOne({ companyId: companyId, userId: userId });
    if (!userActivity) {
      const userActivity = new UserActivity({
        companyId,
        userId,
        isOnline: true,
        lastActive: moment()
      });
      await userActivity.save();
      await createRoomForNewUser(companyId, userId, email, username);
    }
    rooms = await Room.find({ companyId: companyId, "clients.userId": userId }, { name: 1, clients: 1, messages: 1 });
    return rooms;
  }
  catch (error) {
    throw error;
  }
};

const createRoomForNewUser = async (companyId, userId, emailUser, username) => {
  try {
    let users = await User.find({ companyId: companyId }, { _id: 1, email: 1, username: 1 });
    const existedRooms = await Room.find({ companyId: companyId, "clients.userId": userId }, { name: 1, clients: 1 });
    const alreadyConnectedUser = existedRooms.map(room => {
      return room.name.split('|').find(email => email !== emailUser);
    });

    users = users.filter(user => alreadyConnectedUser.every(otherUserEmail => otherUserEmail !== user.email));

    const rooms = [];
    users.forEach((user) => {
      rooms.push({
        companyId: companyId,
        name: `${emailUser}|${get(user, 'email')}`,
        clients: [
          {
            userId: userId,
            username: username
          },
          {
            userId: get(user, '_id'),
            username: get(user, 'username')
          }
        ],
        messages: []
      });
    });

    const roomResponse = await Room.insertMany(rooms);
    return roomResponse;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  fetchRooms
};