const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, required: true },
  level: { type: String, required: false },
  position: {
    type: String,
    enum: ['PRESIDENT', 'VICE_PRESIDENT', 'ACADEMIC_SECRETARY', 'GENERAL_SECRETARY', 'WELFARE_SECRETARY', 'ASSISTANT_GENERAL_SECRETARY', 'FINANCIAL_SECRETARY', 'TREASURER', 'PUBLIC_RELATIONS_OFFICER', 'SOCIAL_SECRETARY', 'SPORT_SECRETARY', 'SENATE_200', 'SENATE_300', 'SENATE_400', 'SENATE_500'],
},
  quote: { type: String, required: false },
  cloudinary_id: {
    type: String,
  },
});

const Candidate = mongoose.model('Candidate', candidateSchema);

module.exports = Candidate;
