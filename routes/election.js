const express = require('express');
const Vote = require('../model/vote');
const { User } = require('../model/user'); 
const mongoose = require('mongoose');
const Candidate = require('../model/candidate');
const userAuthenticateToken = require('../middlewares/userAuth');
const adminAuthenticateToken = require('../middlewares/adminAuth');

const router = express.Router();

router.post('/submitVote', userAuthenticateToken, async (req, res) => {
  const { votes, deviceId } = req.body;

  try {
    // Check if the user or the device has already voted
    const existingVote = await Vote.findOne({ $or: [{ userId: req.user.id }, { deviceId }] });
    if (existingVote) {
      return res.status(400).json({ error: 'You have already voted from this account or device' });
    }

    if (!votes || typeof votes !== 'object') {
      return res.status(400).json({ error: 'Invalid votes data' });
    }

    const filteredVotes = {};
    for (const [position, candidateIds] of Object.entries(votes)) {
      if (!candidateIds || (Array.isArray(candidateIds) && candidateIds.length === 0)) {
        continue; // Skip empty arrays (withheld vote)
      }

      if (typeof candidateIds === 'string' && candidateIds === "") {
        continue; // Skip empty strings (withheld vote)
      }

      const candidates = Array.isArray(candidateIds) ? candidateIds : [candidateIds];
      for (const candidateId of candidates) {
        if (!candidateId) continue; // Skip invalid candidate IDs

        const candidateExists = await Candidate.exists({ _id: candidateId });
        if (!candidateExists) {
          return res.status(400).json({ error: `Invalid candidate selected for ${position}: ${candidateId}` });
        }
      }

      // Assign valid candidate IDs to the filteredVotes object
      filteredVotes[position] = candidateIds;
    }

    // Create the new vote document with filtered votes
    const newVote = new Vote({
      userId: req.user.id, // Assuming req.user is populated by userAuthenticateToken middleware
      ...filteredVotes,
      deviceId,
    });

    await newVote.save();
    return res.status(201).json({ message: 'Thanks for voting. Your vote was submitted successfully.' });
  } catch (err) {
    console.log(err);
    return res.status(400).json({ error: 'Error submitting vote', details: err.message || err });
  }
});


router.get('/election-results', adminAuthenticateToken, async (req, res) => {
  try {
    // Get the total number of users with isMatricApproved = true
    const totalVoters = await User.countDocuments({ isMatricApproved: true });

    // Fetch all the votes
    const votes = await Vote.find().populate('userId');

    const results = {};

    // Initialize the results structure
    votes.forEach(vote => {
      for (const position in vote.toObject()) {
        if (position !== '_id' && position !== 'userId' && position !== 'deviceId' && position !== 'createdAt') {
          if (!results[position]) {
            results[position] = {};
          }

          if (Array.isArray(vote[position])) {
            // For senate positions (arrays)
            vote[position].forEach(candidateId => {
              if (!results[position][candidateId]) {
                results[position][candidateId] = {
                  count: 0,
                  voters: []
                };
              }
              results[position][candidateId].count += 1;
              results[position][candidateId].voters.push(vote.userId._id);
            });
          } else {
            // For other positions (single selections)
            if (vote[position]) {
              if (!results[position][vote[position]]) {
                results[position][vote[position]] = {
                  count: 0,
                  voters: []
                };
              }
              results[position][vote[position]].count += 1;
              results[position][vote[position]].voters.push(vote.userId._id);
            }
          }
        }
      }
    });

    // Determine the winner for each position and calculate the percentage of votes
    const winners = {};
    
    for (const position in results) {
      let maxVotes = 0;
      let winner = null;

      for (const candidate in results[position]) {
        const candidateVotes = results[position][candidate].count;
        const percentage = (candidateVotes / totalVoters) * 100; // Calculate based on total approved users

        // Determine if the candidate wins by at least 75% of the total approved users
        if (percentage >= 75) {
          winners[position] = {
            candidate: candidate,
            votes: candidateVotes,
            percentage: percentage.toFixed(2),
            status: 'Winner'
          };
        } else {
          // Track the candidate with the maximum votes
          if (candidateVotes > maxVotes) {
            maxVotes = candidateVotes;
            winner = candidate;
          }
        }
      }

      // If no candidate wins by 75%, determine the one with the most votes
      if (!winners[position] && winner) {
        winners[position] = {
          candidate: winner,
          votes: maxVotes,
          percentage: ((maxVotes / totalVoters) * 100).toFixed(2), // Percentage based on total approved users
          status: 'Not Enough Votes to Win'
        };
      }
    }

    return res.status(200).json({ winners, results });
  } catch (err) {
    return res.status(400).json({ error: 'Error calculating results', details: err });
  }
});


module.exports = router;
