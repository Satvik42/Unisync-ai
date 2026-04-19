import express from 'express';
import Submission from '../models/Submission.js';
import Event from '../models/Event.js';
import { evaluateSubmission, evaluateStructuredSubmission, dryRunCode } from '../services/ai.service.js';

const router = express.Router();

// Dry run code against test cases
router.post('/dry-run', async (req, res) => {
  try {
    const { challenge, language, code } = req.body;
    const results = await dryRunCode(challenge, language, code);
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get submissions for an event
router.get('/event/:eventId', async (req, res) => {
  try {
    const submissions = await Submission.find({ eventId: req.params.eventId }).populate('studentId', 'name email');
    res.json(submissions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Submit answer and evaluate via AI (Original endpoint)
router.post('/', async (req, res) => {
  try {
    const { eventId, studentId, answer } = req.body;
    
    // Evaluate answer with AI
    const evaluation = await evaluateSubmission(answer);
    
    const submission = await Submission.create({
      eventId,
      studentId,
      answer,
      score: evaluation.score,
      feedback: evaluation.feedback,
      suggestions: evaluation.suggestions
    });
    
    res.status(201).json(submission);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Submit structured test (MCQs + IDE code)
router.post('/evaluate-structured', async (req, res) => {
  try {
    const { eventId, studentId, mcqAnswers, codeSubmissions } = req.body;
    
    // Check if already submitted
    const existing = await Submission.findOne({ eventId, studentId });
    if (existing) return res.status(400).json({ error: 'Assessment already submitted for this event.' });

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Evaluate comprehensively
    const evaluation = await evaluateStructuredSubmission(event, mcqAnswers || {}, codeSubmissions || {});

    const submission = await Submission.create({
      eventId,
      studentId,
      mcqAnswers,
      codeSubmissions,
      score: evaluation.score,
      feedback: evaluation.feedback,
      suggestions: evaluation.suggestions
    });

    res.status(201).json(submission);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
