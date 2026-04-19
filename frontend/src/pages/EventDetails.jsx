import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { Sparkles, MapPin, ListChecks, Code2, Lock, CheckCircle, Zap, Trophy, Brain, Clock, Target, ChevronRight, Info, ScrollText } from 'lucide-react';

// ─────────────────────────────────────────────
// Roadmap section rendered as structured phases
// ─────────────────────────────────────────────
const RoadmapSection = ({ roadmap }) => {
  const lines = roadmap.split('\n').filter(l => l.trim());
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
      {lines.map((line, i) => {
        const isHeader = /^(#+\s|##|\d+\.)/.test(line.trim()) || /^\*\*/.test(line.trim());
        const cleaned = line.replace(/^#+\s*/, '').replace(/\*\*/g, '').replace(/\*/g, '').trim();
        if (!cleaned) return null;
        if (isHeader) {
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem',
              paddingTop: i > 0 ? '0.5rem' : '0',
              borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none'
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: '50%',
                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, fontSize: '0.65rem', fontWeight: 800, color: '#fff'
              }}>
                {i + 1}
              </div>
              <span style={{ fontWeight: 700, color: '#e4e4e7', fontSize: '0.92rem' }}>{cleaned}</span>
            </div>
          );
        }
        return (
          <div key={i} style={{
            display: 'flex', gap: '0.6rem', paddingLeft: '2.2rem',
            color: '#9ca3af', fontSize: '0.85rem', lineHeight: 1.6
          }}>
            <ChevronRight size={14} style={{ marginTop: '0.25rem', flexShrink: 0, color: '#6366f1', opacity: 0.7 }} />
            <span>{cleaned}</span>
          </div>
        );
      })}
    </div>
  );
};

// ─────────────────────────────────────────────
// Skeleton shimmer loader
// ─────────────────────────────────────────────
const RoadmapSkeleton = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
    {[70, 90, 55, 80, 65, 85].map((w, i) => (
      <div key={i} style={{
        height: 14, width: `${w}%`, borderRadius: 6,
        background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
        animationDelay: `${i * 0.15}s`
      }} />
    ))}
  </div>
);


const EventDetails = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [submissionData, setSubmissionData] = useState(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [roadmap, setRoadmap] = useState(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [isPosterOpen, setIsPosterOpen] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get(`/events/${id}/config?studentId=${user.id}`),
      api.get(`/events/registrations/${user.id}`)
    ]).then(([configRes, regRes]) => {
      setEvent(configRes.data.event);
      setHasSubmitted(configRes.data.hasSubmitted);
      setSubmissionData(configRes.data.submission);
      setIsRegistered(regRes.data.includes(id));
      setLoading(false);
    }).catch(err => {
      console.error('EventDetails load error:', err);
      navigate('/student');
    });
  }, [id, user.id, navigate]);

  const fetchRoadmap = async () => {
    if (roadmapLoading || roadmap) return;
    setRoadmapLoading(true);
    try {
      const res = await api.get(`/events/${id}/roadmap`);
      setRoadmap(res.data.roadmap);
    } catch {
      setRoadmap('*Unable to generate roadmap. Please try again later.*');
    } finally {
      setRoadmapLoading(false);
    }
  };

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: 36, height: 36, border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Loading Event Context...</span>
    </div>
  );

  return (
    <div style={{ animation: 'slideUp 0.3s ease' }}>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <span className={`badge ${event.type}`}>{event.type} Session</span>
          <h1 className="mt-2">{event.title}</h1>
          <p style={{ color: 'var(--text-secondary)' }}>{event.description}</p>
        </div>
      </div>

      {/* Poster - Click to expand */}
      {event.posterUrl && (
        <div className="mb-8" onClick={() => setIsPosterOpen(true)} style={{ cursor: 'zoom-in' }}>
          <img
            src={event.posterUrl}
            alt={`${event.title} Poster`}
            referrerPolicy="no-referrer"
            onError={(e) => { 
              e.target.onerror = null; 
              e.target.src = 'https://images.unsplash.com/photo-1635350736475-c8cef4b21906?q=80&w=2070&auto=format&fit=crop'; 
            }}
            style={{ 
              width: '100%', 
              maxHeight: '600px', 
              objectFit: 'contain', 
              borderRadius: '12px', 
              border: '1px solid var(--glass-border)', 
              background: 'rgba(0,0,0,0.2)' 
            }}
          />
          <div style={{ textAlign: 'center', marginTop: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
            <Sparkles size={12} style={{ marginRight: '0.4rem', color: 'var(--accent)' }} /> Click to view entire poster
          </div>
        </div>
      )}

      <div className="flex gap-4" style={{ flexWrap: 'wrap', alignItems: 'flex-start' }}>

        {/* ── AI Roadmap Panel ─────────────────── */}
        <div style={{ flex: '1 1 340px' }}>
          <div className="glass-panel" style={{ background: 'rgba(15,15,25,0.8)' }}>
            <div className="flex items-center gap-2 mb-6">
              <Brain size={20} style={{ color: 'var(--accent)' }} />
              <h3 style={{ margin: 0 }}>AI Strategic Roadmap</h3>
            </div>

            <div style={{ minHeight: '200px' }}>
              {!roadmap && !roadmapLoading && (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <Sparkles size={32} style={{ color: 'var(--accent)', marginBottom: '1rem', opacity: 0.8 }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                    Generate a personalised preparation strategy tailored to this specific event.
                  </p>
                  <button
                    onClick={fetchRoadmap}
                    className="btn"
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <Zap size={16} /> Generate AI Strategy
                  </button>
                </div>
              )}

              {roadmapLoading && <RoadmapSkeleton />}

              {roadmap && !roadmapLoading && <RoadmapSection roadmap={roadmap} />}
            </div>
          </div>
        </div>

        {/* ── Logistics & Assessment Panel ──────────────────── */}
        <div style={{ flex: '2 1 560px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Logistics Summary */}
          <div className="glass-panel">
            <h3 className="mb-6">Event Logistics</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <MapPin size={20} style={{ color: 'var(--danger)' }} />
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Venue</div>
                  <div style={{ fontWeight: 600 }}>{event.venue || 'Virtual/Online'}</div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', fontWeight: 600 }}>
                  <ScrollText size={16} /> Rules & Guidelines
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {event.instructions.split('\n').filter(line => line.trim()).map((line, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.6rem 0.8rem', borderRadius: '6px', fontSize: '0.85rem' }}>
                      <Info size={14} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: '0.2rem' }} />
                      <span>{line.replace(/^\d+\.\s*/, '')}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Assessment Participation - only show if registered */}
          {isRegistered && (
            <div className="glass-panel">
              <h3 className="mb-4">Participation</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {hasSubmitted ? (
                  <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '1.25rem' }}>
                    <div className="flex items-center gap-2" style={{ color: 'var(--success)', fontWeight: 700 }}>
                      <CheckCircle size={18} /> Assessment Completed
                    </div>
                    <div className="mt-4">
                      <div style={{ fontSize: '2rem', fontWeight: 800 }}>{submissionData?.score || 0} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>/ 10</span></div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => navigate(`/events/${id}/assessment`)}
                    className="btn"
                    style={{ width: '100%', justifyContent: 'center', padding: '1rem' }}
                  >
                    Start Assessment
                  </button>
                )}
                <button
                  onClick={() => navigate(`/events/${id}/leaderboard`)}
                  className="btn btn-secondary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  <Trophy size={16} /> View Leaderboard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Simple Register Bottom CTA */}
      {!isRegistered && event?.registrationOpen !== false && (
        <div style={{ marginTop: '4rem', textAlign: 'center', padding: '2rem 0', borderTop: '1px solid var(--glass-border)' }}>
          <button 
            onClick={() => navigate(`/student/register/${id}`)} 
            className="btn" 
            style={{ padding: '0.8rem 3rem' }}
          >
            Register for Event
          </button>
        </div>
      )}

      {/* Full-view Poster Lightbox */}
      {isPosterOpen && (
        <div 
          onClick={() => setIsPosterOpen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.92)', backdropFilter: 'blur(10px)',
            zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2rem', animation: 'fadeIn 0.2s ease', cursor: 'zoom-out'
          }}
        >
          <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '100%' }}>
            <img 
              src={event.posterUrl}
              alt="Full view"
              style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}
            />
            <button 
              onClick={(e) => { e.stopPropagation(); setIsPosterOpen(false); }}
              style={{
                position: 'absolute', top: -40, right: 0, color: 'white',
                background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.5rem'
              }}
            >
              &times; Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EventDetails;
