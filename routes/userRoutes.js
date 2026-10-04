import express from 'express';
import mongoose from 'mongoose';
import User from '../models/user.js';
import { jwtVerify } from 'jose';
import generateJWT from '../utils/generateToken.js';
import { JWTSecret } from '../utils/jwtSecret.js';

const router = express.Router();

// @route   POST /api/auth/login
// @desc    Login a user
// @access  Public
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      res.status(400);
      throw new Error('Email and password are required');
    }

    const user = await User.findOne({ email });
    if (!user) {
      res.status(400);
      throw new Error('Invalid email or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(400);
      throw new Error('Invalid email or password');
    }

    //create tokens
    const payload = { id: user._id.toString() };
    const accessToken = await generateJWT(payload,'15m');
    const refreshToken = await generateJWT(payload, '7d');

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      accessToken: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      } 
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Failed to login user', error);
    next(error);
  }
});

  // @route   POST /api/auth/register
  // @desc    Create a new user
  // @access  Public
router.post('/register', async (req, res, next) => {
  try {
    const { name, email, password } = req.body || {};

    if (!name || !email || !password) {
      res.status(400)
      throw new Error('Username, email, and password are required');
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400);
      throw new Error('User with this email already exists');
    }
    const user = await User.create({ name, email, password });
    //create tokens
    const payload = { id: user._id.toString() };
    const accessToken = await generateJWT(payload,'15m');
    const refreshToken = await generateJWT(payload, '7d');

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    res.status(201).json({
      accessToken: accessToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      } 
    });
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Failed to save user to database', error);
    next(error);
  }
});

// @route   POST /api/auth/refresh
// @desc    Refresh the JWT token
// @access  Public
router.post('/refresh', async (req, res, next) => {
  try {
    const token = req.cookies?.refreshToken;

    if (!token) {
      res.status(401);
      throw new Error('Token is required');
    }

    let payload;
    try {
      ({ payload } = await jwtVerify(token, JWTSecret));
    } catch {
      res.status(401);
      throw new Error('Invalid or expired refresh token');
    }
    const user = await User.findById(payload.id);
    if (!user) {
      res.status(401);
      throw new Error('User not found');
    }
    const newToken = await generateJWT({ id: payload.id }, '15m');

    res.status(200).json({ accessToken: newToken, user: {
      id: user._id,
      name: user.name,
      email: user.email
    } });
  } catch (error) {
    console.error('Failed to refresh token', error);
    next(error);
  }
});

  // @route   POST /api/auth/logout
  // @desc    Logout the user by invalidating the token
  // @access  Public
router.post('/logout', async (req, res, next) => {
  try {
    // Invalidate the token on the client side by simply not using it anymore
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'None'
    });
    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Failed to logout user', error);
    next(error);
  }
});

export default router;