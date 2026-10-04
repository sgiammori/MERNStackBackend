import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import ideaRoutes from './routes/ideaRoutes.js';
import userRoutes from './routes/userRoutes.js';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler.js';
import connectDB from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
//middleware setup for seeing JSON in terminal
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.use('/api/ideas', ideaRoutes);
app.use('/api/auth', userRoutes);

//404 fallback
app.use((req, res, next) => {
  const err = new Error(`Not found - ${req.originalUrl}`);
  err.status = 404;
  next(err);
});
app.use(errorHandler);

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();