// One-off migration: turns the single { ideas: [...] } document into
// one document per idea so the Idea model can read them. The original
// document is kept in the ideas_backup collection.
import mongoose from 'mongoose';
import connectDB from '../config/db.js';
import Idea from '../models/idea.js';

await connectDB();

const collection = mongoose.connection.db.collection('ideas');
const wrappers = await collection.find({ ideas: { $exists: true } }).toArray();

for (const wrapper of wrappers) {
  const docs = wrapper.ideas.map(({ id, ...idea }) => idea);
  await Idea.insertMany(docs, { timestamps: false });
  await mongoose.connection.db.collection('ideas_backup').insertOne(wrapper);
  await collection.deleteOne({ _id: wrapper._id });
  console.log(`Migrated ${docs.length} ideas`);
}

await mongoose.disconnect();
