const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const companySchema = new Schema({
  name: String,
  userRegisteredId: Schema.Types.ObjectId,
  officeWorkplaces: [
    {
      type: mongoose.Schema({
        _id: false,
        officeId: Schema.Types.ObjectId,
        name: String,
        location: {
          type: {
            type: String
          },
          coordinates: [Schema.Types.Decimal128]
        }
      })
    }
  ]
}, { collection: 'companies' });

module.exports = mongoose.model('company', companySchema);
