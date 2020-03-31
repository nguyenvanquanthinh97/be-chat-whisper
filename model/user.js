const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: String,
  email: String,
  companyId: Schema.Types.ObjectId,
  role: String,
  password: String,
  officeWorkplaceId: Schema.Types.ObjectId,
  departureId: Schema.Types.ObjectId
});

module.exports = mongoose.model('User', userSchema);