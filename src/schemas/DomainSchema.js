
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const DomainSchema = new Schema({
  "_id": { type: String, required: true },
  "parentExternalId": { type: String, required: false },
  "name": { type: String, required: true },
  "tenantId": { type: String, required: false },
  "isGlobalScope": { type: Boolean, default: true }
});

const model = mongoose.model('discipline', DomainSchema);

module.exports = model;