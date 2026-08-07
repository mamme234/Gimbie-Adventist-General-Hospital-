// models/Blog.js
const mongoose = require('mongoose');

const BlogSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  excerpt: { type: String, required: true },
  content: { type: String, required: true },
  author: {
    name: String,
    bio: String,
    avatar: String,
    email: String
  },
  category: {
    type: String,
    enum: ['health-tips', 'case-studies', 'industry-news', 'training', 'community'],
    required: true
  },
  tags: [String],
  featuredImage: String,
  images: [String],
  seo: {
    metaTitle: String,
    metaDescription: String,
    keywords: [String],
    canonicalUrl: String
  },
  status: {
    type: String,
    enum: ['draft', 'reviewing', 'published', 'archived'],
    default: 'draft'
  },
  publishedAt: Date,
  viewCount: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  shares: { type: Number, default: 0 },
  comments: [{
    name: String,
    email: String,
    website: String,
    content: String,
    isApproved: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  isFeatured: { type: Boolean, default: false },
  readingTime: Number,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

BlogSchema.pre('save', function(next) {
  // Calculate reading time
  const wordsPerMinute = 200;
  const wordCount = this.content.split(/\s+/).length;
  this.readingTime = Math.ceil(wordCount / wordsPerMinute);
  next();
});

BlogSchema.methods.incrementView = function() {
  this.viewCount += 1;
  return this.save();
};

module.exports = mongoose.model('Blog', BlogSchema);
