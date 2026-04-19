import mongoose from 'mongoose';

const registrationSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  responses: { type: Map, of: String },
  attendanceMarked: { type: Boolean, default: false } // For offline events
}, { timestamps: true });

export default mongoose.model('Registration', registrationSchema);
