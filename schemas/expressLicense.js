
import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const ExpressLicense = new Schema({
  "_id": { type: String },
  "owner": { type: String, required: true, index: true },
  "requestId": { type: String, required: true, index: true },
  "researchExternalId": { type: String, required: true, index: true },
  "researchGroupExternalId": { type: String, required: true, index: true },
  "licencePlan": { type: Object, required: true }
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });


const model = mongoose.model('express-license', ExpressLicense);

module.exports = model;