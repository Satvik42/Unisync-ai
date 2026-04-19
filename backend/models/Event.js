import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  date: { type: Date, required: true },
  type: { type: String, enum: ['offline', 'online'], required: true },
  venue: { type: String }, // For offline
  instructions: { type: String },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // High-value online feature fields
  posterUrl: { type: String },
  registrationOpen: { type: Boolean, default: true },
  registrationFields: [{
    label: String,
    type: { type: String, enum: ['text', 'number', 'email', 'url'], default: 'text' },
    required: { type: Boolean, default: true }
  }],
  mcqs: [{
    question: String,
    options: [String],
    correctOptionIndex: Number
  }],
  codingChallenges: [{
    questionTitle: String,
    problemStatement: String,
    boilerplates: {
      type: Map,
      of: String
    },
    testCases: [{
      input: String,
      expectedOutput: String
    }]
  }]
}, { timestamps: true });

export default mongoose.model('Event', eventSchema);
