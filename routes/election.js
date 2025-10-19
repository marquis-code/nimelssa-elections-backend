const express = require('express');
const Vote = require('../model/vote');
const { User, getUserById } = require('../model/user'); 
const mongoose = require('mongoose');
const Candidate = require('../model/candidate');
const userAuthenticateToken = require('../middlewares/userAuth');
const adminAuthenticateToken = require('../middlewares/adminAuth');

const router = express.Router();

router.post('/submitVote', userAuthenticateToken, async (req, res) => {
  const { votes } = req.body;

  try {
    // Check if the user has already voted (this is redundant but good to double-check)
    const existingUser = await getUserById(req.user.id)
   
    if (!existingUser) {
      return res.status(400).json({ error: 'User does not exist' });
    }

    const existingVote = await Vote.findOne({ userId: req.user.id });
    if (existingVote) {
      return res.status(400).json({ error: 'You have already voted from this account' });
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
      matricNumber: existingUser.matric, // Ensure this is not null
      ...filteredVotes
    });

    await newVote.save();
    return res.status(201).json({ message: 'Thanks for voting. Your vote was submitted successfully.' });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: 'You have already voted from this account' });
    }
    return res.status(400).json({ error: 'Error submitting vote', details: err.message || err });
  }
});

router.get('/election-results', async (req, res) => {
  try {
    // Get the total number of users with isMatricApproved = true
    const users = await User.find({ isMatricApproved: true });
    
    // Create a Set to track unique voter IDs
    const uniqueVoterIds = new Set();

    // Fetch all the votes and populate candidate details
    const votes = await Vote.find()
      .populate('userId')
      .populate('president')
      .populate('vice_president')
      .populate('academic_secretary')
      .populate('general_secretary')
      .populate('assistant_general_secretary')
      .populate('financial_secretary')
      .populate('treasurer')
      .populate('public_relations_officer')
      .populate('social_secretary')
      .populate('welfare_secretary')
      .populate('assistant_welfare_secretary')
      .populate('sport_secretary')
      .populate('senate_200')
      .populate('senate_300')
      .populate('senate_400')
      .populate('senate_500');

    const results = {};

    // Initialize the results structure
    votes.forEach(vote => {
      if (vote.userId && users.some(user => user._id.equals(vote.userId._id))) {
        uniqueVoterIds.add(vote.userId._id.toString()); // Add voter ID to the Set

        for (const position in vote.toObject()) {
          if (position !== '_id' && position !== 'userId' && position !== 'createdAt' && vote[position]) {
            if (!results[position]) {
              results[position] = {};
            }

            if (Array.isArray(vote[position])) {
              // For senate positions (arrays)
              vote[position].forEach(candidateObj => {
                if (!results[position][candidateObj._id]) {
                  results[position][candidateObj._id] = {
                    candidate: candidateObj,
                    count: 0,
                    voters: []
                  };
                }
                results[position][candidateObj._id].count += 1;
                results[position][candidateObj._id].voters.push(vote.userId._id);
              });
            } else {
              // For other positions (single selections)
              if (vote[position]) {
                if (!results[position][vote[position]._id]) {
                  results[position][vote[position]._id] = {
                    candidate: vote[position],
                    count: 0,
                    voters: []
                  };
                }
                results[position][vote[position]._id].count += 1;
                results[position][vote[position]._id].voters.push(vote.userId._id);
              }
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
      let positionResults = [];

      for (const candidateId in results[position]) {
        const candidateVotes = results[position][candidateId].count;
        const percentage = (candidateVotes / uniqueVoterIds.size) * 100; // Calculate based on unique voters

        // Track all candidates' results
        positionResults.push({
          candidate: results[position][candidateId].candidate,
          votes: candidateVotes,
          percentage: percentage.toFixed(2),
          status: percentage >= 75 ? 'Winner' : 'Not Enough Votes to Win'
        });

        // Track the candidate with the maximum votes
        if (candidateVotes > maxVotes) {
          maxVotes = candidateVotes;
          winner = candidateId;
        }
      }

      // Sort candidates by votes in descending order
      positionResults.sort((a, b) => b.votes - a.votes);

      // If no candidate wins by 75%, assign the one with the most votes as the winner
      if (!positionResults.some(candidate => candidate.status === 'Winner') && winner) {
        positionResults[0].status = 'Winner';
      }

      winners[position] = positionResults;
    }

    // Return the winners, results, and total unique voters
    return res.status(200).json({ totalVoters: uniqueVoterIds.size, winners, results });
  } catch (err) {
    return res.status(400).json({ error: 'Error calculating results', details: err.message });
  }
});

router.get('/votes-by-level', async (req, res) => {
  try {
      // Aggregation pipeline to group votes by level
      const votesByLevel = await Vote.aggregate([
          {
              // Join Vote collection with User collection based on userId
              $lookup: {
                  from: 'users',
                  localField: 'userId',
                  foreignField: '_id',
                  as: 'user'
              }
          },
          {
              // Unwind the joined user array (since each vote should correspond to one user)
              $unwind: '$user'
          },
          {
              // Group by the user's level and collect the votes in an array
              $group: {
                  _id: '$user.level',
                  votes: {
                      $push: {
                          userId: '$userId',
                          matricNumber: '$matricNumber',
                          president: '$president',
                          vice_president: '$vice_president',
                          academic_secretary: '$academic_secretary',
                          general_secretary: '$general_secretary',
                          assistant_general_secretary: '$assistant_general_secretary',
                          financial_secretary: '$financial_secretary',
                          treasurer: '$treasurer',
                          public_relations_officer: '$public_relations_officer',
                          social_secretary: '$social_secretary',
                          sport_secretary: '$sport_secretary',
                          welfare_secretary: '$welfare_secretary',
                          assistant_welfare_secretary: '$assistant_welfare_secretary',
                          senate_200: '$senate_200',
                          senate_300: '$senate_300',
                          senate_400: '$senate_400',
                          senate_500: '$senate_500',
                          createdAt: '$createdAt'
                      }
                  },
                  voteCount: { $sum: 1 } // Count the number of votes in each group
              }
          },
          {
              // Sort by academic level
              $sort: { _id: 1 }
          }
      ]);

      // Format the response to use academic level as keys
      const formattedResult = {};
      votesByLevel.forEach(group => {
          formattedResult[group._id] = {
              count: group.voteCount,
              votes: group.votes
          };
      });

      res.status(200).json(formattedResult);
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'An error occurred while grouping votes by level' });
  }
});


module.exports = router;
