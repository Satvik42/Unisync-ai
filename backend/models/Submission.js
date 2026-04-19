import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Generic answer (used for quick simple tests) vs robust structured answers
  answer: { type: String },
  
  // MCQ Answers: Map of array index (Question index) to selected option index
  mcqAnswers: { type: Map, of: Number },
  
  // Code submissions: Map of questionIndex to submitted code object
  codeSubmissions: { 
    type: Map, 
    of: new mongoose.Schema({ language: String, code: String }, { _id: false }) 
  },
  
  score: { type: Number },
  feedback: { type: String },
  suggestions: { type: String }
}, { timestamps: true });

export default mongoose.model('Submission', submissionSchema);
