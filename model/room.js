const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const roomSchema = new Schema({
  companyId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  clients: [
    {
      _id: false,
      userId: { type: Schema.Types.ObjectId, required: true },
      username: { type: String, required: true },
    }
  ],
  messages: [
    {
      type: mongoose.Schema({
        senderId: Schema.Types.ObjectId,
        content: String,
        contentType: String,
        createdAt: Date
      })
    }
  ],
  unread: [
    {
      type: mongoose.Schema({
        _id: false,
        userId: Schema.Types.ObjectId,
        total: {
          type: Number,
          default: 0
        }
      })
    }
  ]
});

module.exports = mongoose.model('Room', roomSchema);