// models/Event.js
const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ['training', 'workshop', 'seminar', 'community', 'meeting', 'social'],
    required: true
  },
  category: {
    type: String,
    enum: ['medical', 'administrative', 'social', 'educational'],
    required: true
  },
  location: {
    venue: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    coordinates: {
      lat: Number,
      lng: Number
    },
    isVirtual: { type: Boolean, default: false },
    meetingLink: String
  },
  schedule: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    startTime: String,
    endTime: String,
    timezone: { type: String, default: 'UTC' },
    isAllDay: { type: Boolean, default: false },
    recurring: {
      isRecurring: { type: Boolean, default: false },
      frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
      endDate: Date
    }
  },
  capacity: {
    maxAttendees: Number,
    currentAttendees: { type: Number, default: 0 }
  },
  attendees: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    registrationDate: { type: Date, default: Date.now },
    status: {
      type: String,
      enum: ['registered', 'attended', 'cancelled'],
      default: 'registered'
    },
    certificateIssued: { type: Boolean, default: false }
  }],
  waitlist: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    requestedAt: { type: Date, default: Date.now }
  }],
  organizers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Employee' }],
  speakers: [{
    name: String,
    title: String,
    bio: String,
    photo: String
  }],
  agenda: [{
    time: String,
    title: String,
    description: String,
    speaker: String
  }],
  materials: [{
    name: String,
    url: String,
    type: String
  }],
  status: {
    type: String,
    enum: ['draft', 'published', 'in-progress', 'completed', 'cancelled'],
    default: 'draft'
  },
  isPublished: { type: Boolean, default: false },
  publishedAt: Date,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

EventSchema.methods.registerAttendee = async function(userId) {
  if (this.attendees.length >= this.capacity.maxAttendees) {
    this.waitlist.push({ userId });
    return { status: 'waitlisted' };
  }
  
  this.attendees.push({ userId });
  this.capacity.currentAttendees += 1;
  await this.save();
  return { status: 'registered' };
};

EventSchema.methods.isFull = function() {
  return this.capacity.currentAttendees >= this.capacity.maxAttendees;
};

module.exports = mongoose.model('Event', EventSchema);
