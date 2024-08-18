// src/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authenticateToken = require('../middlewares/admin');
const { getUserByEmail, createUser, User, getUsers } = require('../model/user');

// Function to generate a 4-digit OTP
const generateOTP = () => {
  return Math.floor(1000 + Math.random() * 9000).toString();
};


const router = express.Router();

const allowedMatricNumbers = ["190708015", "180708004", "160708004"];

router.post('/register', async (req, res, next) => {
  try {
    const { firstname, lastname, email, matric, password, level, role } = req.body;

    if (!firstname || !lastname || !email || !matric || !password || !level) {
      return res.status(400).json({ errorMessage: 'Incomplete request data' });
    }

    const existingUser = await getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ errorMessage: 'User already exists' });
    }

    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(password, salt);

    const userPayload = {
      firstname,
      lastname,
      level,
      role,
      email,
      matric,
      authentication: {
        salt,
        password: hashedPassword
      }
    };

    const newUser = await createUser(userPayload);

    return res.status(200).json({ successMessage: 'User was successfully created', user: newUser });
  } catch (error) {
    return res.status(500).json({ errorMessage: 'Something went wrong' });
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { matric, password } = req.body;

    if (!matric || !password) {
      return res.status(400).json({ errorMessage: 'Incomplete request data' });
    }

    const user = await User.findOne({ matric }).populate('authentication');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.isMatricApproved) {
      return res.status(404).json({ message: 'Matric Number not approved. Contact Academic team to get your matric approved.' });
    }

    const { authentication } = user;
    const passwordMatch = await bcrypt.compare(password, authentication.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const maxAge = 3 * 24 * 60 * 60;
    const payload = {
      id: user._id,
      role: user.role
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: maxAge
    });

    user.authentication.sessionToken = accessToken;
    await user.save();

    res.cookie('ELECTION_AUTH_TOKEN', accessToken, {
      path: '/',
      maxAge: maxAge * 1000,
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV !== 'development'
    });

    return res.status(200).json({ user, token: accessToken });
  } catch (error) {
    return res.status(500).json({ errorMessage: 'Something went wrong' });
  }
});

router.post('/forgot-password', async (req, res) => {
  try {
    const { matric } = req.body;

    if (!matric) {
      return res.status(400).json({ errorMessage: 'Matric number is required' });
    }

    const user = await User.findOne({ matric });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const otp = generateOTP();
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = Date.now() + 3600000; // OTP expires in 1 hour
    await user.save();

    return res.status(200).json({ otp, message: '4 digit OTP has been sent. Use the OTP to reset your password.' });
  } catch (error) {
    return res.status(500).json({ errorMessage: 'Something went wrong' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { matric, otp, newPassword } = req.body;

    if (!matric || !otp || !newPassword) {
      return res.status(400).json({ errorMessage: 'Incomplete request data' });
    }

    const user = await User.findOne({ matric });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.resetPasswordOTP !== otp || user.resetPasswordExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    // Reset the password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.authentication.password = hashedPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    return res.status(500).json({ errorMessage: 'Something went wrong' });
  }
});

router.post('/logout', (req, res) => {
  res.cookie('QUIZ_AUTH_TOKEN', '', {
    httpOnly: true,
    expires: new Date(0)
  });

  return res.status(200).json({ message: 'Successfully logged out' });
});

router.get('/users', async (req, res) => {
  try {
    const users = await getUsers()
    res.status(200).json(users)
} catch (error) {
    res.status(500).json({errorMessage: 'Something went wrong'})
}
});

router.put('/users/:id/approve-matric', authenticateToken, async (req, res) => {
  const _id = req.params.id;

  try {
    const user = await User.findOne({ _id });
    if (!user) {
      return res.status(400).json({ errorMessage: 'User does not exist' });
    }
    user.isMatricApproved = true;
    await user.save();
    res.status(200).json({ successMessage: 'User Matric has been approved successfully' });
  } catch (error) {
    res.status(500).json({ errorMessage: 'Something went wrong. Please try again.' });
  }
});

router.put('/users/:id/disapprove-matric', authenticateToken, async (req, res) => {
  const _id = req.params.id
  try {
    const user = await User.findOne({_id});
    if (!user) {
     return res.status(400).json({ errorMessage: 'User does not exist' });
    }
    user.isMatricApproved = false;
    await user.save()
    res.status(200).json({successMessage : 'User Matric had been disapproved successfully'});
  } catch (error) {
    res.status(500).json({errorMessage : 'Something went wrong, Please try again.'});
  }
});

router.post('/admin-login', async (req, res, next) => {
  try {
    const { matric, password } = req.body;

    if (!matric || !password) {
      return res.status(400).json({ errorMessage: 'Incomplete request data' });
    }

    if (!allowedMatricNumbers.includes(matric)) {
      return res.status(403).json({ message: 'Access denied. Matric number not allowed.' });
    }

    const user = await User.findOne({ matric }).populate('authentication');
    if (!user) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    const { authentication } = user;
    const passwordMatch = await bcrypt.compare(password, authentication.password);

    if (!passwordMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const maxAge = 3 * 24 * 60 * 60; // 3 days
    const payload = {
      id: user._id,
      role: user.role
    };

    const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: maxAge
    });

    user.authentication.sessionToken = accessToken;
    await user.save();

    return res.status(200).json({ user, token: accessToken });
  } catch (error) {
    return res.status(500).json({ errorMessage: 'Something went wrong' });
  }
});


module.exports = router;
