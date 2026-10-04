import express from 'express';
import mongoose from 'mongoose';
import Idea from '../models/idea.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// @route   GET /api/ideas
// @desc    Get all ideas
// @access  Public
router.get('/', async (req, res, next) => {
  try {
    const ideas = await Idea.find().sort({ createdAt: -1 });
    if (!ideas) {
      res.status(404)
      throw new Error('No ideas found');
    }
    res.json(ideas);
  } catch (error) {
    console.error('Failed to fetch ideas from database', error);
    next(error);
  }
});

// @route   GET /api/ideas/:id
// @desc    Get a single idea by ID
// @access  Public
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error('Invalid idea ID');
    }
    const idea = await Idea.findById(req.params.id);
    if (!idea) {
      res.status(404)
      throw new Error('Idea not found');
    }
    res.json(idea);
  } catch (error) {
    console.error('Failed to fetch idea from database', error);
    next(error);
  }
});

// @route   POST /api/ideas
// @desc    Create a new idea
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { title, summary, description, tags, createdAt } = req.body;
    if (!title?.trim() || !summary?.trim() || !description?.trim()) {
      res.status(400);
      throw new Error('Title, summary, and description are required');
    }
    const newIdea = new Idea({
      user : req.user._id ? req.user._id : {},
      title : title?.trim(),
      summary : summary?.trim(),
      description : description?.trim(),
      tags : typeof tags === 'string' ? 
        tags
          .split(',')
          .map(tag => tag.trim())
          .filter(Boolean) //trick to remove empty strings
        : Array.isArray(tags) ? tags : [],
      createdAt : createdAt ? new Date(createdAt) : new Date()
    });

    const savedIdea = await newIdea.save();
    res.status(201).json(savedIdea);
  } catch (error) {
    if (error instanceof mongoose.Error.ValidationError) {
      return res.status(400).json({ message: error.message });
    }
    console.error('Failed to save idea to database', error);
    next(error);
  }
});

// @route   DELETE /api/ideas/:id
// @desc    Delete a single idea by ID
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error('Invalid idea ID');
    }
    const idea = await Idea.findById(req.params.id);
    if (!idea) {
      res.status(404)
      throw new Error('Idea not found');
    }
    if(idea.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to delete this idea');
    }
    await idea.deleteOne();
    res.json({ message: 'Idea deleted successfully' });
  } catch (error) {
    console.error('Failed to delete idea from database', error);
    next(error);
  }
});

// @route   PUT /api/ideas/:id
// @desc    Update a single idea by ID
// @access  Private
router.put('/:id', protect, async (req, res, next) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400);
      throw new Error('Invalid idea ID');
    }
    const { title, summary, description, tags, createdAt } = req.body || {};
    
    if (!title?.trim() || !summary?.trim() || !description?.trim()) {
      res.status(400);
      throw new Error('Title, summary, and description are required');
    }

    const idea = await Idea.findById(req.params.id);
    if (!idea) {
      res.status(404)
      throw new Error('Idea not found');
    }
    if(idea.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to update this idea');
    }
    Object.assign(idea, {
      title: title?.trim(),
      summary: summary?.trim(),
      description: description?.trim(),
      tags: typeof tags === 'string' ? 
        tags
          .split(',')
          .map(tag => tag.trim())
          .filter(Boolean) //trick to remove empty strings
        : Array.isArray(tags) ? tags : [],
      createdAt: createdAt ? new Date(createdAt) : idea.createdAt
    });
    const updatedIdea = await idea.save();
    res.json(updatedIdea);
  } catch (error) {
    console.error('Failed to update idea in database', error);
    next(error);
  }
});

export default router;
