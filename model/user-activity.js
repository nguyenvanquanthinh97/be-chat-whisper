const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userActivitySchema = new Schema({
  companyId: Schema.Types.ObjectId,
  userId: Schema.Types.ObjectId,
  isOnline: {
    type: Boolean,
    default: false
  },
  lastActive: Date
}, { collection: 'userActivities' });

module.exports = mongoose.model('UserActivity', userActivitySchema);
