// src/routes/election.js
const express =  require('express');
const Vote =  require('../model/vote');

const router = express.Router();

router.post('/submitVote', async (req, res) => {
  const { votes, matricNumber, deviceId } = req.body;

  try {
    // Check if the user or the device has already voted
    const existingVote = await Vote.findOne({ $or: [{ matricNumber }, { deviceId }] });
    if (existingVote) {
      return res.status(400).json({ error: 'You have already voted from this matric number or device' });
    }

    const newVote = new Vote({ ...votes, matricNumber, deviceId });
    await newVote.save();
    return res.status(201).json({ message: 'Vote submitted successfully' });
  } catch (err) {
    return res.status(400).json({ error: 'Error submitting vote', details: err });
  }
});

router.get('/submitElectionResults', async (req, res) => {
  try {
    const votes = await Vote.find();
    const results = {};

    // Calculate total votes for each position
    const positions = Object.keys(votes[0].toObject()).filter(key => key !== '_id' && key !== 'matricNumber' && key !== 'deviceId');
    positions.forEach(position => {
      results[position] = votes.reduce((acc, vote) => {
        if (vote[position]) {
          if (!acc[vote[position]]) {
            acc[vote[position]] = {
              count: 0,
              voters: []
            };
          }
          acc[vote[position]].count += 1;
          acc[vote[position]].voters.push(vote.matricNumber);
        }
        return acc;
      }, {});
    });

    return res.status(200).json(results);
  } catch (err) {
    return res.status(400).json({ error: 'Error calculating results', details: err });
  }
});

module.exports = router;
