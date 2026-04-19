import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import { Plus, Users, CheckSquare, Square, ChevronDown, ChevronUp, Settings, Trophy, Trash2 } from 'lucide-react';

const AdminDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  
  // Create Event Form
  const [form, setForm] = useState({ 
    title: '',
    description: '',
    date: '',
    type: 'online',
    venue: '',
    posterUrl: '',
    instructions: ''
  });
  
  // Registration view state
  const [expandedEventId, setExpandedEventId] = useState(null);
  const [registrations, setRegistrations] = useState({});
  const [submissions, setSubmissions] = useState({});
  
  const fetchEvents = () => {
    api.get('/events').then(res => setEvents(res.data));
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/events', { 
        ...form, 
        creator: user.id 
      });
      setShowCreate(false);
      setForm({ title: '', description: '', date: '', type: 'online', venue: '', instructions: '', posterUrl: '' });
      fetchEvents();
    } catch (err) {
      alert('Failed to create event');
    }
  };
  const handleDelete = async (eventId) => {
    if (!window.confirm('Are you sure you want to delete this event? This will permanently remove all associated student registrations and submissions.')) {
      return;
    }
    try {
      await api.delete(`/events/${eventId}`);
      fetchEvents();
    } catch (err) {
      alert('Failed to delete event');
    }
  };

  const toggleRegistrations = async (eventId) => {
    if (expandedEventId === eventId) {
      setExpandedEventId(null);
      return;
    }
    setExpandedEventId(eventId);
    if (!registrations[eventId]) {
      try {
        const [regsRes, subsRes] = await Promise.all([
          api.get(`/events/${eventId}/registrations`),
          api.get(`/submissions/event/${eventId}`)
        ]);
        setRegistrations(prev => ({ ...prev, [eventId]: regsRes.data }));
        setSubmissions(prev => ({ ...prev, [eventId]: subsRes.data }));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const toggleAttendance = async (eventId, regId, currentStatus) => {
    try {
      const res = await api.patch(`/events/registrations/${regId}/attendance`, { attendanceMarked: !currentStatus });
      setRegistrations(prev => ({
        ...prev,
        [eventId]: prev[eventId].map(r => r._id === regId ? res.data : r)
      }));
    } catch (err) {
      alert('Failed to update attendance');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="mb-2">Admin Dashboard</h1>
          <p>Manage university events and view student registrations.</p>
        </div>
        <button className="btn" onClick={() => setShowCreate(!showCreate)}>
          <Plus size={18} /> {showCreate ? 'Cancel' : 'Create Event'}
        </button>
      </div>

      {showCreate && (
        <div className="glass-panel mb-8">
          <h3>Create New Event (Step 1: Setup Details)</h3>
          <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>You can configure the online assessments directly from the event list after creating.</p>
          <form onSubmit={handleCreate} className="mt-4">
            <div className="flex gap-4">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Title</label>
                <input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label>Date</label>
                <input type="datetime-local" required value={form.date} onChange={e => setForm({...form, date: e.target.value})} />
              </div>
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea required rows="2" value={form.description} onChange={e => setForm({...form, description: e.target.value})}></textarea>
            </div>

            <div className="form-group">
              <label>Event Logistics & Rules</label>
              <textarea 
                placeholder="List rules, guidelines, or schedule (one per line)..." 
                rows="4" 
                value={form.instructions} 
                onChange={e => setForm({...form, instructions: e.target.value})}
              ></textarea>
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>💡 These will appear as a bulleted checklist on the student details page.</small>
            </div>

            <div className="form-group">
              <label>Brochure / Poster URL (Optional)</label>
              <input type="url" placeholder="https://example.com/poster.jpg (must end in .jpg, .png, .webp, etc)" value={form.posterUrl} onChange={e => setForm({...form, posterUrl: e.target.value})} />
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>⚠️ Must be a direct image link, not a webpage URL (e.g. Gemini/Drive share links won't work)</small>
            </div>

            <div className="flex gap-4">
              <div className="form-group" style={{ flex: 1 }}>
                <label>Type</label>
                <select value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                  <option value="online">Online Hackathon</option>
                  <option value="offline">Offline (In-person)</option>
                </select>
              </div>
              {form.type === 'offline' && (
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Venue</label>
                  <input required value={form.venue} onChange={e => setForm({...form, venue: e.target.value})} />
                </div>
              )}
            </div>

            <button type="submit" className="btn mt-4 w-100 justify-center">Create Event</button>
          </form>
        </div>
      )}

      <h2>Your Events</h2>
      <div className="flex-col gap-4">
        {events.map(event => (
          <div key={event._id} className="glass-panel w-100 mb-4">
            <div className="flex justify-between items-center">
              <div>
                <span className={`badge ${event.type} mb-2`}>{event.type}</span>
                <h3>{event.title}</h3>
                <p style={{ fontSize: '0.9rem', marginBottom: 0 }}>{new Date(event.date).toLocaleString()}</p>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  className="btn" 
                  onClick={() => navigate(`/admin/registration/${event._id}`)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--success)', color: 'white' }}
                >
                  <Settings size={16} /> Configure Registration
                </button>
                
                {event.type === 'online' && (
                  <button 
                    className="btn" 
                    onClick={() => navigate(`/admin/builder/${event._id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: 'var(--accent)', color: 'white' }}
                  >
                    <Settings size={16} /> Configure Rounds
                  </button>
                )}
                
                {event.type === 'online' && (
                  <button 
                    className="btn" 
                    onClick={() => navigate(`/events/${event._id}/leaderboard`)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#fbbf24', color: '#78350f' }}
                  >
                    <Trophy size={16} /> Leaderboard
                  </button>
                )}
                
                <div className="text-center ml-2">
                  <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--accent)' }}>
                    {event.registrationCount || 0}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Registrations</div>
                </div>
                
                <button 
                  className="btn btn-secondary" 
                  onClick={() => toggleRegistrations(event._id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <Users size={16} /> 
                  {expandedEventId === event._id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </button>

                <button 
                  className="btn btn-secondary" 
                  onClick={() => handleDelete(event._id)}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                  title="Delete Event"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>


            {/* Registration Student Roster */}
            {expandedEventId === event._id && (
              <div className="mt-4" style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '1rem' }}>
                <h4 className="mb-4">Student Roster</h4>
                {(!registrations[event._id] || registrations[event._id].length === 0) ? (
                  <p style={{ fontSize: '0.9rem' }}>No registrations yet.</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {registrations[event._id].map(reg => {
                      // Look for a corresponding submission for this student
                      const studentSubmission = submissions[event._id]?.find(s => s.studentId?._id === reg.studentId?._id);
                      
                      return (
                        <div key={reg._id} className="flex justify-between items-center" style={{ background: 'rgba(0,0,0,0.2)', padding: '1rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: '1.05rem', marginBottom: '0.2rem', color: '#fff' }}>
                              {reg.studentId?.name || 'Unknown Student'}
                              {studentSubmission?.score !== undefined && (
                                <span style={{ marginLeft: '0.75rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', padding: '0.1rem 0.5rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600, border: '1px solid var(--success)' }}>
                                  AI Score: {studentSubmission.score}/10
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                              {reg.studentId?.email || 'N/A'}
                            </div>
                            
                            {/* Render Dynamic Form Fields safely */}
                            {reg.responses && Object.keys(reg.responses).length > 0 && (
                              <div className="flex gap-4 mt-2" style={{ flexWrap: 'wrap' }}>
                                {Object.entries(reg.responses).map(([key, val]) => {
                                  if (key.toLowerCase().includes('name') || key.toLowerCase().includes('email')) return null; // Already displaying identity above
                                  return (
                                    <div key={key} style={{ background: 'rgba(0,0,0,0.3)', padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid #1f2937' }}>
                                      <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', marginRight: '0.4rem' }}>{key}</span>
                                      <span style={{ fontSize: '0.85rem', color: '#e2e8f0' }}>{val || '-'}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                          
                          <div className="flex flex-col items-end gap-2" style={{ marginLeft: '1rem' }}>
                            <button 
                              className="btn" 
                              style={{
                                padding: '0.4rem 0.8rem',
                                backgroundColor: reg.attendanceMarked ? 'var(--success)' : 'transparent',
                                border: reg.attendanceMarked ? 'none' : '1px solid var(--glass-border)',
                                color: reg.attendanceMarked ? '#fff' : 'var(--text-primary)'
                              }}
                              onClick={() => toggleAttendance(event._id, reg._id, reg.attendanceMarked)}
                            >
                              {reg.attendanceMarked ? <><CheckSquare size={16} /> Present</> : <><Square size={16} /> Mark Present</>}
                            </button>
                            
                            {studentSubmission && (
                              <button className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }} onClick={() => alert(`AI Feedback:\n${studentSubmission.feedback}`)}>
                                View Feedback
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {events.length === 0 && <p>No events created yet.</p>}
      </div>
    </div>
  );
};

export default AdminDashboard;
