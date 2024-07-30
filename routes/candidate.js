const express = require('express');
const cloudinary = require('../utils/cloudinary');
const mongoose = require('mongoose');
const Candidate = require('../model/candidate');
const upload = require('../utils/multer')
const adminAuthenticateToken = require('../middlewares/adminAuth');

const router = express.Router();

const allowedPositions = [
  'PRESIDENT', 'VICE_PRESIDENT', 'ACADEMIC_SECRETARY', 'GENERAL_SECRETARY', 
  'ASSISTANT_GENERAL_SECRETARY', 'FINANCIAL_SECRETARY', 'TREASURER', 
  'PUBLIC_RELATIONS_OFFICER', 'SOCIAL_SECRETARY', 'SPORT_SECRETARY', 
  'SENATE_200', 'SENATE_300', 'SENATE_400', 'SENATE_500'
];

// Create a candidate
router.post('/create', adminAuthenticateToken, upload.single('image'), async (req, res) => {
  console.log(req.body, 'here ')
  const { name, position, level, quote } = req.body;

  if (!name) {
    return res.status(400).json({ errorMessage: 'Name is required' });
  }

  if (!level) {
    return res.status(400).json({ errorMessage: 'Level is required' });
  }

  if (!quote) {
    return res.status(400).json({ errorMessage: 'Quote is required' });
  }

  if (position && !allowedPositions.includes(position)) {
    return res.status(400).json({ errorMessage: 'Invalid position value' });
  }

  if (!req.file) {
    return res.status(400).json({ errorMessage: "Please upload candidate profile picture." });
  }

  try {
    const upload_response = await cloudinary.uploader.upload(req.file.path);

    const candidate = new Candidate({
      ...req.body,
      image: upload_response.secure_url,
      cloudinary_id: upload_response.public_id,
    });
    await candidate.save();
    res.status(201).send(candidate);
  } catch (error) {
    console.log(error, 'here again')
    // res.status(400).send(error);
  }
});

// Read all candidates
router.get('/all-candidates', async (req, res) => {
  try {
    const candidates = await Candidate.find();
    res.status(200).send(candidates);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Read a single candidate by ID
router.get('/candidates/:id', async (req, res) => {
  try {
    const candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).send();
    }
    res.status(200).send(candidate);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Update a candidate by ID
router.patch('/candidates/:id', adminAuthenticateToken, upload.single('image'), async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ errorMessage: "Invalid candidate ID" });
  }


  if (req.body.position && !allowedPositions.includes(req.body.position)) {
    return res.status(400).json({ errorMessage: 'Invalid position value' });
  }

  try {
    let candidate = await Candidate.findById(req.params.id);
    if (!candidate) {
      return res.status(404).send();
    }

    if (req.file) {
      await cloudinary.uploader.destroy(candidate.cloudinary_id);
      const result = await cloudinary.uploader.upload(req.file.path);
      req.body.image = result.secure_url;
      req.body.cloudinary_id = result.public_id;
    }

    candidate = await Candidate.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).send(candidate);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Delete a candidate by ID
router.delete('/candidates/:id', adminAuthenticateToken, async (req, res) => {
  try {
    const candidate = await Candidate.findByIdAndDelete(req.params.id);
    if (!candidate) {
      return res.status(404).send();
    }
    await cloudinary.uploader.destroy(candidate.cloudinary_id);
    res.status(200).send(candidate);
  } catch (error) {
    res.status(500).send(error);
  }
});

module.exports = router;
