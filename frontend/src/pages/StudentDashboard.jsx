import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, MapPin, Video, CheckCircle, Trophy } from 'lucide-react';
import api from '../api';

const StudentDashboard = ({ user }) => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [registeredIds, setRegisteredIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/events'),
      api.get(`/events/registrations/${user.id}`)
    ]).then(([eventsRes, regsRes]) => {
      setEvents(eventsRes.data);
      setRegisteredIds(regsRes.data);
      setLoading(false);
    });
  }, [user.id]);

  return (
    <div>
      <h1 className="mb-2">Available Events</h1>
      <p className="mb-8">Discover and join upcoming university events. Let UniSync AI guide your preparation.</p>
      
      {loading ? (
        <p>Loading events...</p>
      ) : (
        <div className="event-grid">
          {events.map(event => {
            const isRegistered = registeredIds.includes(event._id);

            return (
              <div key={event._id} className="glass-panel flex-col justify-between">
                <div>
                  {event.posterUrl && (
                    <img 
                      src={event.posterUrl} 
                      alt={`${event.title} Poster`} 
                      referrerPolicy="no-referrer"
                      onError={(e) => { 
                        e.target.onerror = null; 
                        e.target.src = 'https://images.unsplash.com/photo-1635350736475-c8cef4b21906?q=80&w=2070&auto=format&fit=crop'; 
                      }}
                      style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '6px', marginBottom: '1rem', background: 'var(--glass-bg)' }} 
                    />
                  )}
                  <div className="flex justify-between items-center mb-4">
                    <span className={`badge ${event.type}`}>{event.type}</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <Calendar size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} />
                      {new Date(event.date).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 
                    onClick={() => navigate(`/events/${event._id}`)} 
                    style={{ cursor: 'pointer', transition: 'color 0.2s' }}
                    onMouseEnter={e => e.target.style.color = 'var(--accent)'}
                    onMouseLeave={e => e.target.style.color = 'inherit'}
                  >
                    {event.title}
                  </h3>
                  <p style={{ fontSize: '0.9rem' }}>{event.description.substring(0, 80)}...</p>
                  
                  <div className="flex items-center gap-2 mb-4" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    {event.type === 'offline' ? <MapPin size={14} /> : <Video size={14} />}
                    <span>{event.type === 'offline' ? event.venue : 'Online Submission'}</span>
                  </div>
                </div>
                
                <div className="flex-col gap-2" style={{ width: '100%' }}>
                  <Link to={`/events/${event._id}`} className="btn text-center" style={{ width: '100%', justifyContent: 'center' }}>
                    View Event Details
                  </Link>

                  {!isRegistered && event.registrationOpen !== false && (
                    <button onClick={() => navigate(`/student/register/${event._id}`)} className="btn btn-secondary text-center" style={{ width: '100%', justifyContent: 'center' }}>
                      Quick Register
                    </button>
                  )}

                  {isRegistered && (
                    <div style={{ padding: '0.5rem', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '6px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--success)', fontWeight: 600 }}>
                      <CheckCircle size={14} style={{ display: 'inline-block', verticalAlign: 'middle', marginRight: 4 }} />
                      Registered & Ready
                    </div>
                  )}

                  {event.registrationOpen === false && !isRegistered && (
                    <div className="btn text-center" style={{ width: '100%', justifyContent: 'center', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', cursor: 'not-allowed', border: '1px solid var(--glass-border)' }}>
                      Registrations Closed
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {events.length === 0 && <p>No events found.</p>}
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
