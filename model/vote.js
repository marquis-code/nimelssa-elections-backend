const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const voteSchema = new Schema({
  president: { type: String, required: true },
  vice_president: { type: String, required: true },
  academic_secretary: { type: String, required: true },
  general_secretary: { type: String, required: true },
  assistant_general_secretary: { type: String, required: true },
  financial_secretary: { type: String, required: true },
  treasurer: { type: String, required: true },
  public_relations_officer: { type: String, required: true },
  sport_secretary: { type: String, required: true },
  senate_200: { type: String, required: true },
  senate_300: { type: String, required: true },
  senate_400: { type: String, required: true },
  senate_500: { type: String, required: true },
  matricNumber: { type: String, unique: true, required: true },
  deviceId: { type: String, unique: true, required: true }
});

const Vote = mongoose.model('Vote', voteSchema);

module.exports = Vote;
