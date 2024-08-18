const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  president: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: false },
  vice_president: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: false },
  academic_secretary: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: false },
  general_secretary: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: false },
  assistant_general_secretary: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: false },
  financial_secretary: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: false },
  treasurer: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: false },
  public_relations_officer: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: false },
  social_secretary: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: false },
  sport_secretary: { type: mongoose.Schema.Types.ObjectId, ref: 'Candidate', required: false },
  senate_200: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' }],
    validate: {
      validator: function (v) {
        return v.length <= 3;
      },
      message: 'You can vote for up to 3 candidates or withhold your vote for Senate 200',
    },
  },
  senate_300: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' }],
    validate: {
      validator: function (v) {
        return v.length <= 3;
      },
      message: 'You can vote for up to 3 candidates or withhold your vote for Senate 300',
    },
  },
  senate_400: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' }],
    validate: {
      validator: function (v) {
        return v.length <= 3;
      },
      message: 'You can vote for up to 3 candidates or withhold your vote for Senate 400',
    },
  },
  senate_500: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Candidate' }],
    validate: {
      validator: function (v) {
        return v.length <= 3;
      },
      message: 'You can vote for up to 3 candidates or withhold your vote for Senate 500',
    },
  },
  createdAt: { type: Date, default: Date.now },
});

const Vote = mongoose.model('Vote', voteSchema);

module.exports = Vote;
