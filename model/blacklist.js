const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const blacklistSchema = new Schema({
  jwt: {
    type: String,
    required: true
  }
},
{
  collection: 'black_lists'
});

module.exports = mongoose.model('BlackList', blacklistSchema);