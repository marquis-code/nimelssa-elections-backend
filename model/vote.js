const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Import the Candidate model to reference it in the voteSchema
const Candidate = require('../model/candidate');

const voteSchema = new Schema({
  president: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
  vice_president: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
  academic_secretary: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
  general_secretary: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
  assistant_general_secretary: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
  financial_secretary: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
  treasurer: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
  public_relations_officer: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
  sport_secretary: { type: Schema.Types.ObjectId, ref: 'Candidate', required: true },
  senate_200: [{ type: Schema.Types.ObjectId, ref: 'Candidate', required: true, validate: [arrayLimit, 'Exceeds the limit of 3 candidates'] }],
  senate_300: [{ type: Schema.Types.ObjectId, ref: 'Candidate', required: true, validate: [arrayLimit, 'Exceeds the limit of 3 candidates'] }],
  senate_400: [{ type: Schema.Types.ObjectId, ref: 'Candidate', required: true, validate: [arrayLimit, 'Exceeds the limit of 3 candidates'] }],
  senate_500: [{ type: Schema.Types.ObjectId, ref: 'Candidate', required: true, validate: [arrayLimit, 'Exceeds the limit of 3 candidates'] }],
  matricNumber: { type: String, unique: true, required: true },
  deviceId: { type: String, unique: true, required: true }
});

// Validator function to check array length
function arrayLimit(val) {
  return val.length <= 3;
}

const Vote = mongoose.model('Vote', voteSchema);

module.exports = Vote;
