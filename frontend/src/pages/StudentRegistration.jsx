import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, CheckCircle } from 'lucide-react';

const StudentRegistration = ({ user }) => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formResponses, setFormResponses] = useState({});
  const [registerLoading, setRegisterLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    // Fetch Event details and Check if Already Registered
    Promise.all([
      api.get(`/events/${eventId}/config`),
      api.get(`/events/registrations/${user.id}`)
    ]).then(([eventRes, regsRes]) => {
      const evt = eventRes.data.event;
      setEvent(evt);
      
      const alreadyRegistered = regsRes.data.includes(eventId);
      if (alreadyRegistered) {
         navigate('/student');
         return;
      }
      
      if (evt.registrationOpen === false) {
         setErrorMsg('Registrations are currently closed for this event.');
         setLoading(false);
         return;
      }

      // Prepopulate form
      const initialResponses = {};
      if (evt.registrationFields && evt.registrationFields.length > 0) {
        evt.registrationFields.forEach(f => {
          if (f.label.toLowerCase().includes('name')) initialResponses[f.label] = user.name;
          else if (f.label.toLowerCase().includes('email')) initialResponses[f.label] = user.email;
          else initialResponses[f.label] = '';
        });
      }
      setFormResponses(initialResponses);
      setLoading(false);
    }).catch(err => {
      setErrorMsg('Failed to load event data.');
      setLoading(false);
    });
  }, [eventId, user, navigate]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setRegisterLoading(true);
    try {
      await api.post(`/events/${eventId}/register`, { responses: formResponses, studentId: user.id });
      navigate('/student'); // Successful Registration, redirect to dashboard
    } catch (err) {
      setErrorMsg(err.response?.data?.error || 'Registration failed');
    } finally {
      setRegisterLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center mt-20">Loading Registration Portal...</div>;

  return (
    <div style={{ maxWidth: '600px', margin: '2rem auto' }}>
      <button className="btn btn-secondary mb-6" style={{ padding: '0.4rem 0.6rem' }} onClick={() => navigate('/student')}>
        <ArrowLeft size={16} /> Back to Dashboard
      </button>

      <div className="glass-panel" style={{ padding: '2.5rem' }}>
        <h2 className="mb-2" style={{ color: 'var(--accent)' }}>Event Registration</h2>
        <p className="mb-6 pb-6" style={{ borderBottom: '1px solid var(--glass-border)' }}>Registering for: <strong>{event?.title}</strong></p>

        {errorMsg ? (
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <p style={{ color: 'var(--danger)', fontSize: '1.1rem', marginBottom: '1.5rem' }}>{errorMsg}</p>
            <button className="btn btn-secondary" onClick={() => navigate('/student')}>Return to Dashboard</button>
          </div>
        ) : (
          <form onSubmit={handleRegister}>
            {event.registrationFields && event.registrationFields.length > 0 ? event.registrationFields.map((field, idx) => (
              <div key={idx} className="form-group mb-4">
                <label style={{ fontSize: '0.85rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '0.5rem', display: 'block' }}>
                  {field.label} {field.required && <span style={{color: '#ef4444'}}>*</span>}
                </label>
                <input 
                  type={field.type}
                  required={field.required}
                  value={formResponses[field.label] || ''}
                  onChange={e => setFormResponses({ ...formResponses, [field.label]: e.target.value })}
                  style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.2)', border: '1px solid #1f2937', borderRadius: '6px', color: '#fff', fontSize: '1rem' }}
                />
              </div>
            )) : (
              <div className="mb-6 text-center p-4" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', borderRadius: '8px' }}>
                <CheckCircle size={24} style={{ color: 'var(--success)', margin: '0 auto 0.5rem auto' }} />
                <p style={{ margin: 0, color: 'var(--success)' }}>No additional details required. You can confirm registration immediately.</p>
              </div>
            )}

            <button 
              type="submit" 
              className="btn mt-6" 
              style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1.1rem', backgroundColor: 'var(--accent)' }} 
              disabled={registerLoading}
            >
              {registerLoading ? 'Processing...' : 'Confirm Registration'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default StudentRegistration;
