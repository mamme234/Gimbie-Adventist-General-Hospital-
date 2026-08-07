// models/News.js
const mongoose = require('mongoose');

const NewsSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  summary: { type: String, required: true },
  content: { type: String, required: true },
  category: {
    type: String,
    enum: ['announcement', 'update', 'policy', 'achievement', 'event'],
    required: true
  },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  featuredImage: String,
  images: [String],
  tags: [String],
  priority: {
    type: String,
    enum: ['normal', 'high', 'urgent'],
    default: 'normal'
  },
  isPublished: { type: Boolean, default: false },
  publishedAt: Date,
  expiresAt: Date,
  viewCount: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    comment: String,
    createdAt: { type: Date, default: Date.now },
    isEdited: Boolean
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

NewsSchema.methods.publish = async function() {
  this.isPublished = true;
  this.publishedAt = new Date();
  await this.save();
};

NewsSchema.methods.incrementViews = function() {
  this.viewCount += 1;
  return this.save();
};

module.exports = mongoose.model('News', NewsSchema);
