// models/Gallery.js
const mongoose = require('mongoose');

const GallerySchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  type: {
    type: String,
    enum: ['photo', 'video', 'document'],
    required: true
  },
  category: {
    type: String,
    enum: ['emergency', 'event', 'training', 'facility', 'staff', 'community'],
    required: true
  },
  media: {
    url: { type: String, required: true },
    thumbnail: String,
    mimeType: String,
    size: Number,
    width: Number,
    height: Number,
    duration: Number // For videos
  },
  tags: [String],
  location: {
    name: String,
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  relatedEmergencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Emergency' },
  relatedEventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  views: { type: Number, default: 0 },
  downloads: { type: Number, default: 0 },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  comments: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    comment: String,
    createdAt: { type: Date, default: Date.now }
  }],
  isPublished: { type: Boolean, default: true },
  isPrivate: { type: Boolean, default: false },
  expiryDate: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

GallerySchema.methods.incrementViews = function() {
  this.views += 1;
  return this.save();
};

GallerySchema.methods.incrementDownloads = function() {
  this.downloads += 1;
  return this.save();
};

module.exports = mongoose.model('Gallery', GallerySchema);
