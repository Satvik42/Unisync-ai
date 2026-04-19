import express from 'express';
import Event from '../models/Event.js';
import Registration from '../models/Registration.js';
import Submission from '../models/Submission.js';
import { generateEventRoadmap } from '../services/ai.service.js';

const router = express.Router();

// Get all events
router.get('/', async (req, res) => {
  try {
    const events = await Event.find().sort({ createdAt: -1 }).lean();
    
    // Attach registration counts for admin view
    const eventsWithCounts = await Promise.all(events.map(async (event) => {
      const count = await Registration.countDocuments({ eventId: event._id });
      return { ...event, registrationCount: count };
    }));
    
    res.json(eventsWithCounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create event
router.post('/', async (req, res) => {
  try {
    const event = await Event.create(req.body);
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get event config (lightweight — no AI, used by builder & live assessment)
router.get('/:id/config', async (req, res) => {
  try {
    const { studentId } = req.query;
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    
    let submission = null;
    if (studentId) {
      submission = await Submission.findOne({ eventId: req.params.id, studentId });
    }

    res.json({ 
      event, 
      hasSubmitted: !!submission,
      submission: submission // Include submission details (score/feedback) for view
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get event by ID (event data only — no AI generation)
router.get('/:id', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    res.json({ event });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// On-demand AI roadmap generation
router.get('/:id/roadmap', async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const roadmap = await generateEventRoadmap(event.title, event.description);
    res.json({ roadmap });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get registered event IDs for a student
router.get('/registrations/:studentId', async (req, res) => {
  try {
    const regs = await Registration.find({ studentId: req.params.studentId });
    res.json(regs.map(r => r.eventId));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register for event
router.post('/:id/register', async (req, res) => {
  try {
    const { studentId, responses } = req.body;
    
    // Validate Registration is Open
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (event.registrationOpen === false) return res.status(403).json({ error: 'Registrations are closed.' });
    
    // Check if already registered
    const existing = await Registration.findOne({ eventId: req.params.id, studentId });
    if (existing) return res.status(400).json({ error: 'Already registered' });

    const reg = await Registration.create({
      eventId: req.params.id,
      studentId,
      responses
    });
    res.json(reg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update Event Builder (MCQs & IDE Configurations)
router.patch('/:id/builder', async (req, res) => {
  try {
    const { mcqs, codingChallenges, includeMcqs, includeIde } = req.body;
    
    // Process based on toggles: if toggled off, clear the array.
    const finalMcqs = includeMcqs ? mcqs : [];
    const finalCodingChallenges = includeIde ? codingChallenges : [];

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { mcqs: finalMcqs, codingChallenges: finalCodingChallenges },
      { new: true }
    );
    res.json(updatedEvent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update Registration Schema
router.patch('/:id/registration-schema', async (req, res) => {
  try {
    const { registrationFields, registrationOpen } = req.body;
    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      { registrationFields, registrationOpen },
      { new: true }
    );
    res.json(updatedEvent);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get registrations for a specific event
router.get('/:id/registrations', async (req, res) => {
  try {
    const regs = await Registration.find({ eventId: req.params.id })
      .populate('studentId', 'name email')
      .sort({ createdAt: -1 });
    res.json(regs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update registration attendance
router.patch('/registrations/:regId/attendance', async (req, res) => {
  try {
    const { attendanceMarked } = req.body;
    const reg = await Registration.findByIdAndUpdate(
      req.params.regId, 
      { attendanceMarked }, 
      { new: true }
    );
    res.json(reg);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete Event (Cascading)
router.delete('/:id', async (req, res) => {
  try {
    const eventId = req.params.id;
    
    // 1. Delete associated registrations
    await Registration.deleteMany({ eventId });
    
    // 2. Delete associated submissions
    await Submission.deleteMany({ eventId });
    
    // 3. Delete the event itself
    const deletedEvent = await Event.findByIdAndDelete(eventId);
    
    if (!deletedEvent) return res.status(404).json({ error: 'Event not found' });
    
    res.json({ message: 'Event and associated data deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
