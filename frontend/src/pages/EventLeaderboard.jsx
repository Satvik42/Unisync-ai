import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ArrowLeft, Trophy, Medal, Award, Star } from 'lucide-react';

const getRankStyle = (rank) => {
  if (rank === 1) return { bg: 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)', color: '#78350f', shadow: '0 4px 20px rgba(251, 191, 36, 0.3)' };
  if (rank === 2) return { bg: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)', color: '#1f2937', shadow: '0 4px 20px rgba(156, 163, 175, 0.3)' };
  if (rank === 3) return { bg: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)', color: '#fffbeb', shadow: '0 4px 20px rgba(217, 119, 6, 0.3)' };
  return { bg: 'rgba(255,255,255,0.03)', color: 'var(--text-primary)', shadow: 'none' };
};

const getRankIcon = (rank) => {
  if (rank === 1) return <Trophy size={22} style={{ color: '#fbbf24' }} />;
  if (rank === 2) return <Medal size={22} style={{ color: '#9ca3af' }} />;
  if (rank === 3) return <Award size={22} style={{ color: '#d97706' }} />;
  return <span style={{ color: 'var(--text-secondary)', fontWeight: 600, fontSize: '1rem', width: 22, textAlign: 'center', display: 'inline-block' }}>{rank}</span>;
};

const EventLeaderboard = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [eventRes, subsRes] = await Promise.all([
          api.get(`/events/${id}`),
          api.get(`/submissions/event/${id}`)
        ]);
        setEvent(eventRes.data.event);

        // Sort by score descending and deduplicate per student (keep best score)
        const studentBest = {};
        subsRes.data.forEach(sub => {
          const sid = sub.studentId?._id || sub.studentId;
          if (!studentBest[sid] || sub.score > studentBest[sid].score) {
            studentBest[sid] = sub;
          }
        });

        const sorted = Object.values(studentBest).sort((a, b) => (b.score || 0) - (a.score || 0));
        setLeaderboard(sorted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="p-8 text-center mt-20">Loading Leaderboard...</div>;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="flex items-center gap-4 mb-6">
        <button className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem' }} onClick={() => navigate(-1)}>
          <ArrowLeft size={16} /> Back
        </button>
        <div>
          <h1 className="mb-0" style={{ fontSize: '1.8rem' }}>Event Leaderboard</h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>{event?.title}</p>
        </div>
      </div>

      {/* Hero Stats */}
      {leaderboard.length > 0 && (
        <div className="glass-panel mb-6 text-center" style={{ padding: '2rem', borderTop: '4px solid #fbbf24' }}>
          <Trophy size={40} style={{ color: '#fbbf24', margin: '0 auto 0.75rem auto' }} />
          <h2 style={{ color: '#fbbf24', margin: '0 0 0.25rem 0' }}>{leaderboard[0].studentId?.name || 'Top Scorer'}</h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>{leaderboard[0].studentId?.email}</p>
          <div style={{ fontSize: '2.5rem', fontWeight: 800, color: '#fbbf24', marginTop: '0.5rem' }}>
            {leaderboard[0].score}<span style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', fontWeight: 400 }}>/10</span>
          </div>
        </div>
      )}

      {/* Ranking Table */}
      <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
        {/* Header */}
        <div className="flex items-center" style={{ padding: '1rem 1.5rem', background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--glass-border)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '1px', color: 'var(--text-secondary)', fontWeight: 600 }}>
          <div style={{ width: '60px' }}>Rank</div>
          <div style={{ flex: 1 }}>Student</div>
          <div style={{ width: '100px', textAlign: 'right' }}>Score</div>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center" style={{ padding: '3rem 1rem' }}>
            <Star size={40} style={{ color: 'var(--text-secondary)', margin: '0 auto 1rem auto', opacity: 0.3 }} />
            <p style={{ color: 'var(--text-secondary)' }}>No submissions yet. Check back after students complete the assessment.</p>
          </div>
        ) : (
          leaderboard.map((sub, idx) => {
            const rank = idx + 1;
            const style = getRankStyle(rank);
            const isCurrentUser = (sub.studentId?._id === user?.id);

            return (
              <div
                key={sub._id}
                className="flex items-center"
                style={{
                  padding: '1rem 1.5rem',
                  background: isCurrentUser ? 'rgba(99, 102, 241, 0.08)' : style.bg,
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  borderLeft: isCurrentUser ? '3px solid var(--accent)' : '3px solid transparent',
                  transition: 'background 0.2s'
                }}
              >
                <div style={{ width: '60px', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {getRankIcon(rank)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: rank <= 3 ? 700 : 500, fontSize: rank <= 3 ? '1.05rem' : '0.95rem', color: rank <= 3 ? style.color : '#e2e8f0' }}>
                    {sub.studentId?.name || 'Anonymous'}
                    {isCurrentUser && <span style={{ marginLeft: '0.5rem', fontSize: '0.75rem', background: 'var(--accent)', color: '#fff', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>YOU</span>}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: rank <= 3 ? 'rgba(0,0,0,0.5)' : 'var(--text-secondary)' }}>
                    {sub.studentId?.email}
                  </div>
                </div>
                <div style={{
                  width: '100px',
                  textAlign: 'right',
                  fontWeight: 700,
                  fontSize: rank <= 3 ? '1.3rem' : '1.1rem',
                  color: rank <= 3 ? style.color : 'var(--accent)'
                }}>
                  {sub.score}<span style={{ fontSize: '0.75rem', fontWeight: 400, opacity: 0.7 }}>/10</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default EventLeaderboard;
