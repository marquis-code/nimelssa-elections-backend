// // src/routes/election.js
// const express =  require('express');
// const Vote =  require('../model/vote');
// const mongoose = require('mongoose');

// const router = express.Router();

// router.post('/submitVote', async (req, res) => {
//   // const { votes, matricNumber, deviceId } = req.body;

//   // try {
//   //   // Check if the user or the device has already voted
//   //   const existingVote = await Vote.findOne({ $or: [{ matricNumber }, { deviceId }] });
//   //   if (existingVote) {
//   //     return res.status(400).json({ error: 'You have already voted from this matric number or device' });
//   //   }

//   //   const newVote = new Vote({ ...votes, matricNumber, deviceId });
//   //   await newVote.save();
//   //   return res.status(201).json({ message: 'Vote submitted successfully' });
//   // } catch (err) {
//   //   return res.status(400).json({ error: 'Error submitting vote', details: err });
//   // }
//   const voteData = {
//     president: mongoose.Types.ObjectId('candidate_id_1'),
//     vice_president: mongoose.Types.ObjectId('candidate_id_2'),
//     academic_secretary: mongoose.Types.ObjectId('candidate_id_3'),
//     general_secretary: mongoose.Types.ObjectId('candidate_id_4'),
//     assistant_general_secretary: mongoose.Types.ObjectId('candidate_id_5'),
//     financial_secretary: mongoose.Types.ObjectId('candidate_id_6'),
//     treasurer: mongoose.Types.ObjectId('candidate_id_7'),
//     public_relations_officer: mongoose.Types.ObjectId('candidate_id_8'),
//     sport_secretary: mongoose.Types.ObjectId('candidate_id_9'),
//     senate_200: [
//       mongoose.Types.ObjectId('candidate_id_10'),
//       mongoose.Types.ObjectId('candidate_id_11'),
//       mongoose.Types.ObjectId('candidate_id_12')
//     ],
//     senate_300: [
//       mongoose.Types.ObjectId('candidate_id_13'),
//       mongoose.Types.ObjectId('candidate_id_14'),
//       mongoose.Types.ObjectId('candidate_id_15')
//     ],
//     senate_400: [
//       mongoose.Types.ObjectId('candidate_id_16'),
//       mongoose.Types.ObjectId('candidate_id_17'),
//       mongoose.Types.ObjectId('candidate_id_18')
//     ],
//     senate_500: [
//       mongoose.Types.ObjectId('candidate_id_19'),
//       mongoose.Types.ObjectId('candidate_id_20'),
//       mongoose.Types.ObjectId('candidate_id_21')
//     ],
//     matricNumber: '20210001',
//     deviceId: 'device123'
//   };

//   const existingVote = await Vote.findOne({ $or: [{ matricNumber }, { deviceId }] });
//   if (existingVote) {
//     return res.status(400).json({ error: 'You have already voted from this matric number or device' });
//   }

//   try {
//     const vote = new Vote(voteData);
//     await vote.save();
//     console.log('Vote saved successfully:', vote);
//   } catch (error) {
//     console.error('Error saving vote:', error);
//   }
// });

// // router.get('/submitElectionResults', async (req, res) => {
// //   try {
// //     const votes = await Vote.find();
// //     const results = {};

// //     // Calculate total votes for each position
// //     const positions = Object.keys(votes[0].toObject()).filter(key => key !== '_id' && key !== 'matricNumber' && key !== 'deviceId');
// //     positions.forEach(position => {
// //       results[position] = votes.reduce((acc, vote) => {
// //         if (vote[position]) {
// //           if (!acc[vote[position]]) {
// //             acc[vote[position]] = {
// //               count: 0,
// //               voters: []
// //             };
// //           }
// //           acc[vote[position]].count += 1;
// //           acc[vote[position]].voters.push(vote.matricNumber);
// //         }
// //         return acc;
// //       }, {});
// //     });

// //     return res.status(200).json(results);
// //   } catch (err) {
// //     return res.status(400).json({ error: 'Error calculating results', details: err });
// //   }
// // });

// module.exports = router;

// src/routes/election.js
const express = require('express');
const Vote = require('../model/vote');
const userAuthenticateToken = require('../middlewares/userAuth');
const adminAuthenticateToken = require('../middlewares/adminAuth');

const router = express.Router();

// Endpoint to submit a vote
router.post('/submitVote', userAuthenticateToken, async (req, res) => {
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

// Endpoint to get election results
router.get('/submitElectionResults', adminAuthenticateToken, async (req, res) => {
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

    // Determine the winner for each position and calculate the percentage of votes
    const winners = {};
    positions.forEach(position => {
      let maxVotes = 0;
      let winner = null;

      for (const candidate in results[position]) {
        if (results[position][candidate].count > maxVotes) {
          maxVotes = results[position][candidate].count;
          winner = candidate;
        }
      }

      if (winner) {
        const totalVotes = Object.values(results[position]).reduce((sum, candidate) => sum + candidate.count, 0);
        const percentage = ((maxVotes / totalVotes) * 100).toFixed(2);
        winners[position] = {
          candidate: winner,
          votes: maxVotes,
          percentage
        };
      }
    });

    return res.status(200).json(winners);
  } catch (err) {
    return res.status(400).json({ error: 'Error calculating results', details: err });
  }
});

module.exports = router;
