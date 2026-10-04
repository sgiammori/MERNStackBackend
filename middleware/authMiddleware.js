import { jwtVerify } from 'jose';
import dotenv from 'dotenv';
dotenv.config();
import User from '../models/user.js';
import { JWTSecret } from '../utils/jwtSecret.js';

export const protect = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401);
      throw new Error('Not authorized, token missing');
    }
    const token = authHeader.split(' ')[1];

    if (!token) {
      res.status(401);
      throw new Error('Not authorized, token missing');
    }

    const { payload } = await jwtVerify(token, JWTSecret);
    const user = await User.findById(payload.id);

    if (!user) {
      res.status(401);
      throw new Error('Not authorized, user not found');
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Authentication failed', error);
    res.status(401);
    next(new Error('Not authorized, token invalid'));
  }
};