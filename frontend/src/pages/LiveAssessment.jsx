import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { Send, Maximize, AlertTriangle, Code2, ListChecks, ShieldAlert, CheckCircle, RotateCcw, Play, AlertCircle, Terminal } from 'lucide-react';
import _Editor from 'react-simple-code-editor';
const Editor = _Editor.default || _Editor;
import Prism from 'prismjs';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-cpp';
import 'prismjs/themes/prism-tomorrow.css';
import { DEFAULT_BOILERPLATES } from '../constants/boilerplates';

// ─────────────────────────────────────────────
// Proctoring overlay for tab-switch violations
// ─────────────────────────────────────────────
const ViolationBanner = ({ count, onDismiss }) => (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
    background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
    padding: '0.75rem 1.5rem',
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    boxShadow: '0 4px 20px rgba(220,38,38,0.5)',
    animation: 'slideDown 0.3s ease'
  }}>
    <div className="flex items-center gap-3">
      <ShieldAlert size={20} style={{ color: '#fca5a5' }} />
      <span style={{ color: '#fff', fontWeight: 600 }}>
        ⚠️ Tab switch detected! Violation #{count} recorded. Repeated violations may disqualify your submission.
      </span>
    </div>
    <button onClick={onDismiss} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', padding: '0.3rem 0.8rem', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}>
      Dismiss
    </button>
  </div>
);

const LiveAssessment = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  // Event data
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);

  // Assessment state
  const [mcqAnswers, setMcqAnswers] = useState({});
  const [codeSubmissions, setCodeSubmissions] = useState({});
  const [activeCodeTabs, setActiveCodeTabs] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);

  // Proctoring state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [showViolationBanner, setShowViolationBanner] = useState(false);
  const [assessmentStarted, setAssessmentStarted] = useState(false);
  const violationRef = useRef(0);

  // Test Results state
  const [testResults, setTestResults] = useState({});
  const [testingIndex, setTestingIndex] = useState(null);

  // ── Load event ──────────────────────────────
  useEffect(() => {
    api.get(`/events/${id}/config?studentId=${user.id}`).then(res => {
      const e = res.data.event;
      if (res.data.hasSubmitted) {
        alert('You have already submitted this assessment.');
        navigate('/student');
        return;
      }
      setEvent(e);

      const initialSubs = {};
      const initialTabs = {};
      if (e.codingChallenges && e.codingChallenges.length > 0) {
        e.codingChallenges.forEach((c, cIdx) => {
          const langs = c.boilerplates ? Object.keys(c.boilerplates) : ['Python', 'JavaScript', 'Java', 'C++'];
          const lang = langs[0];
          initialTabs[cIdx] = lang;
          initialSubs[cIdx] = { language: lang, code: c.boilerplates ? (c.boilerplates[lang] || '') : (DEFAULT_BOILERPLATES[lang] || '') };
        });
      }
      setCodeSubmissions(initialSubs);
      setActiveCodeTabs(initialTabs);
      setLoading(false);
    }).catch(() => navigate('/student'));
  }, [id, navigate, user.id]);

  // ── Fullscreen helpers ──────────────────────
  const enterFullscreen = useCallback(() => {
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen();
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
  }, []);

  const exitFullscreen = () => {
    if (document.exitFullscreen) document.exitFullscreen();
    else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
  };

  // Track fullscreen changes
  useEffect(() => {
    const onFsChange = () => {
      const isFull = !!(document.fullscreenElement || document.webkitFullscreenElement);
      setIsFullscreen(isFull);

      // If exited fullscreen during active assessment, count as violation
      if (!isFull && assessmentStarted && !result) {
        handleViolation();
      }
    };
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, [assessmentStarted, result]);

  // ── Tab switch detection ────────────────────
  const handleViolation = useCallback(() => {
    violationRef.current += 1;
    setViolationCount(violationRef.current);
    setShowViolationBanner(true);
    // Re-enter fullscreen automatically
    enterFullscreen();
  }, [enterFullscreen]);

  useEffect(() => {
    if (!assessmentStarted || result) return;

    const onVisibilityChange = () => {
      if (document.hidden) handleViolation();
    };

    const onBlur = () => handleViolation();

    // Right-click disable
    const onContextMenu = (e) => e.preventDefault();

    // Copy-paste disable
    const onCopyPaste = (e) => {
      if (e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
        e.preventDefault();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    document.addEventListener('contextmenu', onContextMenu);
    document.addEventListener('copy', onCopyPaste);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('contextmenu', onContextMenu);
      document.removeEventListener('copy', onCopyPaste);
    };
  }, [assessmentStarted, result, handleViolation]);

  // ── Start assessment ────────────────────────
  const startAssessment = () => {
    enterFullscreen();
    setAssessmentStarted(true);
  };

  // ── MCQ helpers ─────────────────────────────
  const handleMcqSelect = (qIndex, optIndex) => setMcqAnswers({ ...mcqAnswers, [qIndex]: optIndex });

  const handleCodeChange = (cIdx, code) =>
    setCodeSubmissions(prev => ({ ...prev, [cIdx]: { ...prev[cIdx], code } }));

  const setCodeTab = (cIdx, language) => {
    setActiveCodeTabs(prev => ({ ...prev, [cIdx]: language }));
    setCodeSubmissions(prev => {
      const currentCode = prev[cIdx]?.code || '';
      const challenge = event.codingChallenges[cIdx];
      const newCode = (!currentCode || currentCode.trim() === '')
        ? (challenge.boilerplates?.[language] || DEFAULT_BOILERPLATES[language] || '')
        : currentCode;
      return { ...prev, [cIdx]: { language, code: newCode } };
    });
  };

  const resetBoilerplate = (cIdx) => {
    const language = activeCodeTabs[cIdx];
    const challenge = event.codingChallenges[cIdx];
    const newCode = challenge.boilerplates?.[language] || DEFAULT_BOILERPLATES[language] || '';
    if (window.confirm('Reset this challenge to the default boilerplate? Your current progress for this language will be lost.')) {
      setCodeSubmissions(prev => ({ ...prev, [cIdx]: { ...prev[cIdx], code: newCode } }));
    }
  };

  const highlightWithPrism = (code, language) => {
    if (!language) return code;
    
    // Safety check for Prism languages
    const grammars = Prism.languages;
    const prismLang = {
      'Python': grammars.python,
      'JavaScript': grammars.javascript,
      'Java': grammars.java,
      'C++': grammars.cpp
    }[language] || grammars.clike || grammars.markup || {};

    try {
      return Prism.highlight(code || '', prismLang, language.toLowerCase().replace('c++', 'cpp'));
    } catch (e) {
      console.warn('Prism highlighting failed for', language, e);
      return code || '';
    }
  };

  const handleDryRun = async (cIdx) => {
    setTestingIndex(cIdx);
    try {
      const challenge = event.codingChallenges[cIdx];
      const submission = codeSubmissions[cIdx];
      
      const res = await api.post('/submissions/dry-run', {
        challenge,
        language: submission.language,
        code: submission.code
      });
      
      setTestResults(prev => ({ ...prev, [cIdx]: res.data }));
    } catch (err) {
      console.error('Dry run error:', err);
      alert('Failed to run tests. Please check your connection or try again later.');
    } finally {
      setTestingIndex(null);
    }
  };

  // ── Submit ───────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await api.post('/submissions/evaluate-structured', {
        eventId: id,
        studentId: user.id,
        isStructured: true,
        mcqAnswers,
        codeSubmissions,
        violationCount: violationRef.current
      });
      setResult(res.data);
      exitFullscreen();
    } catch {
      alert('Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render guards ────────────────────────────
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '80vh', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ width: 40, height: 40, border: '3px solid var(--accent)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <p>Loading Assessment...</p>
    </div>
  );

  const hasAssessment = (event.mcqs && event.mcqs.length > 0) || (event.codingChallenges && event.codingChallenges.length > 0);

  // ── Pre-start screen ─────────────────────────
  if (!assessmentStarted) {
    return (
      <div style={{ maxWidth: '680px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="glass-panel" style={{ padding: '3rem 2rem', borderTop: '4px solid var(--accent)' }}>
          {/* Icon */}
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', border: '2px solid var(--accent)' }}>
            <Maximize size={32} style={{ color: 'var(--accent)' }} />
          </div>

          <h2 style={{ marginBottom: '0.5rem' }}>{event.title}</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Live Assessment</p>

          {/* Rules */}
          <div style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', textAlign: 'left' }}>
            <h4 style={{ color: '#fbbf24', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} /> Assessment Rules
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {[
                'The browser will enter fullscreen mode when you start.',
                'Switching tabs or minimizing the window will be recorded as a violation.',
                'Right-clicking is disabled during the assessment.',
                'Each violation is logged and visible to the event organiser.',
                'Submit your answers before exiting.'
              ].map((rule, i) => (
                <li key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <span style={{ color: 'var(--accent)', fontWeight: 700, minWidth: 20 }}>{i + 1}.</span>
                  {rule}
                </li>
              ))}
            </ul>
          </div>

          {/* Question summary */}
          <div className="flex gap-4 justify-center mb-2-rem" style={{ marginBottom: '2rem', flexWrap: 'wrap' }}>
            {event.mcqs && event.mcqs.length > 0 && (
              <div style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid var(--accent)', borderRadius: '8px', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ListChecks size={18} style={{ color: 'var(--accent)' }} />
                <span style={{ fontWeight: 600 }}>{event.mcqs.length} MCQ Questions</span>
              </div>
            )}
            {event.codingChallenges && event.codingChallenges.length > 0 && (
              <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid var(--success)', borderRadius: '8px', padding: '0.75rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Code2 size={18} style={{ color: 'var(--success)' }} />
                <span style={{ fontWeight: 600 }}>{event.codingChallenges.length} Coding  Challenges</span>
              </div>
            )}
          </div>

          <button
            onClick={startAssessment}
            className="btn"
            style={{ width: '100%', justifyContent: 'center', padding: '1rem 2rem', fontSize: '1.1rem', backgroundColor: 'var(--accent)', letterSpacing: '0.5px' }}
            disabled={!hasAssessment}
          >
            <Maximize size={18} /> {hasAssessment ? 'Start Assessment (Fullscreen)' : 'No Assessment Configured Yet'}
          </button>
          <button onClick={() => navigate(-1)} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.75rem' }}>
            ← Back to Event
          </button>
        </div>
      </div>
    );
  }

  // ── Result screen ────────────────────────────
  if (result) {
    return (
      <div style={{ maxWidth: '700px', margin: '3rem auto' }}>
        <div className="glass-panel" style={{ padding: '2.5rem', textAlign: 'center', borderTop: '4px solid var(--success)' }}>
          <CheckCircle size={56} style={{ color: 'var(--success)', margin: '0 auto 1.5rem auto' }} />
          <h2 style={{ color: 'var(--success)', marginBottom: '0.5rem' }}>Assessment Submitted!</h2>
          <div style={{ fontSize: '3.5rem', fontWeight: 800, color: '#fff', margin: '1.5rem 0' }}>
            {result.score}<span style={{ fontSize: '1.5rem', color: 'var(--text-secondary)', fontWeight: 400 }}>/10</span>
          </div>

          {violationRef.current > 0 && (
            <div style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid #dc2626', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: '#fca5a5', fontSize: '0.9rem' }}>
              ⚠️ {violationRef.current} violation(s) were recorded during your session.
            </div>
          )}

          <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
            <h4 style={{ marginBottom: '0.75rem' }}>AI Feedback</h4>
            <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-line', lineHeight: 1.6 }}>{result.feedback}</p>
          </div>
          {result.suggestions && (
            <div style={{ textAlign: 'left', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', padding: '1.5rem', marginBottom: '1.5rem' }}>
              <h4 style={{ marginBottom: '0.75rem' }}>Suggestions</h4>
              <p style={{ color: 'var(--text-secondary)', whiteSpace: 'pre-line', fontStyle: 'italic', lineHeight: 1.6 }}>{result.suggestions}</p>
            </div>
          )}

          <div className="flex gap-3" style={{ justifyContent: 'center', flexWrap: 'wrap', marginTop: '2rem' }}>
            <button onClick={() => navigate(`/events/${id}/leaderboard`)} className="btn" style={{ backgroundColor: '#fbbf24', color: '#78350f' }}>
              🏆 View Leaderboard
            </button>
            <button onClick={() => navigate('/student')} className="btn btn-secondary">
              ← Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Active assessment ────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)' }}>
      {/* Violation banner */}
      {showViolationBanner && (
        <ViolationBanner count={violationCount} onDismiss={() => setShowViolationBanner(false)} />
      )}

      {/* Sticky assessment header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--glass-border)',
        padding: '1rem 2rem',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 4px 30px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div style={{ 
            width: 12, height: 12, borderRadius: '50%', 
            background: violationCount > 3 ? '#ef4444' : '#22c55e', 
            boxShadow: `0 0 12px ${violationCount > 3 ? '#ef4444' : '#22c55e'}`, 
            animation: 'pulse 2s infinite' 
          }} />
          <div>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#fff', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
              Live Assessment
            </span>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {event.title}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          {violationCount > 0 && (
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)',
              padding: '0.4rem 0.8rem', borderRadius: '6px'
            }}>
              <ShieldAlert size={16} style={{ color: '#ef4444' }} />
              <span style={{ color: '#ef4444', fontSize: '0.85rem', fontWeight: 700 }}>
                {violationCount} Violation{violationCount > 1 ? 's' : ''}
              </span>
            </div>
          )}
          
          {!isFullscreen && (
            <button 
              onClick={enterFullscreen} 
              className="btn" 
              style={{ 
                padding: '0.5rem 1rem', fontSize: '0.85rem', 
                backgroundColor: '#dc2626', border: 'none',
                boxShadow: '0 0 15px rgba(220,38,38,0.4)',
                animation: 'pulse 1.5s infinite'
              }}
            >
              <Maximize size={16} /> Re-enter Fullscreen
            </button>
          )}
        </div>
      </div>

      {/* Assessment body */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        <form onSubmit={handleSubmit}>
          {/* MCQ Round */}
          {event.mcqs && event.mcqs.length > 0 && (
            <div style={{ maxWidth: '850px', margin: '0 auto 2rem auto' }}>
              <div className="glass-panel" style={{ padding: '2.5rem' }}>
                <h3 className="flex items-center gap-3 mb-8" style={{ color: 'var(--accent)' }}>
                  <ListChecks size={24} /> 
                  <span>MCQ Round</span>
                  <span style={{ fontSize: '0.75rem', background: 'rgba(99,102,241,0.15)', padding: '0.3rem 0.8rem', borderRadius: '20px', marginLeft: '0.5rem', fontWeight: 600, color: 'var(--accent)', border: '1px solid rgba(99,102,241,0.2)' }}>
                    {event.mcqs.length} Questions
                  </span>
                </h3>
                
                {event.mcqs.map((mcq, qIdx) => (
                  <div key={qIdx} className="mb-12" style={{ borderBottom: qIdx < event.mcqs.length - 1 ? '1px solid var(--glass-border)' : 'none', paddingBottom: '2.5rem' }}>
                    <div style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.5rem' }}>
                      <div style={{ 
                        background: 'linear-gradient(135deg, var(--accent), #4f46e5)', 
                        color: '#fff', minWidth: 32, height: 32, 
                        borderRadius: '10px', display: 'flex', alignItems: 'center', 
                        justifyContent: 'center', fontSize: '0.95rem', fontWeight: 800, 
                        flexShrink: 0, boxShadow: '0 4px 12px rgba(99,102,241,0.3)' 
                      }}>
                        {qIdx + 1}
                      </div>
                      <p style={{ fontWeight: 600, fontSize: '1.15rem', color: '#f8fafc', lineHeight: 1.5, margin: 0 }}>
                        {mcq.question}
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', paddingLeft: '2.75rem' }}>
                      {mcq.options.map((opt, oIdx) => (
                        <label key={oIdx} style={{
                          display: 'flex', alignItems: 'center', gap: '1rem',
                          padding: '1rem 1.25rem',
                          borderRadius: '12px',
                          border: `1.5px solid ${mcqAnswers[qIdx] === oIdx ? 'var(--accent)' : 'rgba(255,255,255,0.05)'}`,
                          background: mcqAnswers[qIdx] === oIdx 
                            ? 'linear-gradient(to right, rgba(99,102,241,0.15), rgba(99,102,241,0.05))' 
                            : 'rgba(255,255,255,0.02)',
                          cursor: 'pointer',
                          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                          position: 'relative',
                          overflow: 'hidden'
                        }} className="mcq-option">
                          <input
                            type="radio"
                            name={`q-${qIdx}`}
                            checked={mcqAnswers[qIdx] === oIdx}
                            onChange={() => handleMcqSelect(qIdx, oIdx)}
                            required
                            style={{ 
                              accentColor: 'var(--accent)', 
                              width: '18px', height: '18px',
                              cursor: 'pointer'
                            }}
                          />
                          <span style={{ 
                            color: mcqAnswers[qIdx] === oIdx ? '#fff' : 'var(--text-secondary)',
                            fontSize: '1rem',
                            fontWeight: mcqAnswers[qIdx] === oIdx ? 600 : 400,
                            flex: 1
                          }}>{opt}</span>
                          
                          {mcqAnswers[qIdx] === oIdx && (
                            <div style={{ 
                              position: 'absolute', right: '1rem', 
                              color: 'var(--accent)', display: 'flex', alignItems: 'center' 
                            }}>
                              <CheckCircle size={18} />
                            </div>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Coding Challenges */}
          {event.codingChallenges && event.codingChallenges.length > 0 && (
            <div className="mb-8">
              <h3 className="flex items-center gap-2 mb-6" style={{ color: 'var(--success)' }}>
                <Code2 size={22} /> Coding Challenges
                <span style={{ fontSize: '0.8rem', background: 'rgba(16,185,129,0.15)', padding: '0.2rem 0.6rem', borderRadius: '20px', marginLeft: '0.5rem', fontWeight: 400, color: 'var(--text-secondary)' }}>
                  {event.codingChallenges.length} problems
                </span>
              </h3>
              {event.codingChallenges.map((challenge, cIdx) => (
                <div key={cIdx} className="mb-8" style={{ border: '1px solid var(--glass-border)', borderRadius: '12px', overflow: 'hidden', background: '#0a0a0a', boxShadow: '0 8px 30px rgba(0,0,0,0.5)' }}>
                  <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                    {/* Left: Problem */}
                    <div style={{ flex: '1 1 340px', padding: '1.5rem', borderRight: '1px solid #1f2937', background: '#111827', minHeight: '450px' }}>
                      <h5 style={{ fontWeight: 700, fontSize: '1.1rem', color: '#fff', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ background: 'rgba(255,255,255,0.08)', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>#{cIdx + 1}</span>
                        {challenge.questionTitle}
                      </h5>
                      <div style={{ color: '#d1d5db', whiteSpace: 'pre-line', fontSize: '0.93rem', lineHeight: 1.7 }}>
                        {challenge.problemStatement}
                      </div>
                      {challenge.pseudoCode && (
                        <div style={{ marginTop: '1.5rem', background: 'rgba(0,0,0,0.3)', borderRadius: '6px', padding: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <p style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Pseudocode hint</p>
                          <pre style={{ color: '#9ca3af', fontSize: '0.85rem', fontFamily: 'monospace', whiteSpace: 'pre-wrap', margin: 0 }}>{challenge.pseudoCode}</pre>
                        </div>
                      )}
                    </div>

                    {/* Right: IDE */}
                    <div style={{ flex: '1.5 1 480px', display: 'flex', flexDirection: 'column', minHeight: '450px' }}>
                      {/* Language tabs */}
                      <div className="flex p-2 items-center justify-between" style={{ background: '#1e1e1e', borderBottom: '1px solid #333' }}>
                        <div className="flex gap-1" style={{ background: 'rgba(0,0,0,0.4)', padding: '0.2rem', borderRadius: '6px' }}>
                          {['Python', 'JavaScript', 'Java', 'C++'].map(lang => (
                            <button
                              key={lang}
                              type="button"
                              onClick={() => setCodeTab(cIdx, lang)}
                              style={{
                                padding: '0.3rem 0.9rem', fontSize: '0.82rem',
                                background: activeCodeTabs[cIdx] === lang ? 'var(--accent)' : 'transparent',
                                border: 'none', borderRadius: '4px',
                                color: activeCodeTabs[cIdx] === lang ? '#fff' : '#a1a1aa',
                                cursor: 'pointer', fontWeight: activeCodeTabs[cIdx] === lang ? 700 : 400,
                                transition: 'all 0.15s'
                              }}
                            >
                              {lang}
                            </button>
                          ))}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#555', paddingRight: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Auto-saving</span>
                      </div>

                      {/* Code editor */}
                      <div style={{ background: '#1e1e1e', flex: 1, padding: 0, overflow: 'auto', position: 'relative' }}>
                        <div style={{ 
                          position: 'absolute', top: '10px', right: '10px', zIndex: 10,
                          display: 'flex', gap: '0.5rem'
                        }}>
                          <button 
                            type="button"
                            onClick={() => resetBoilerplate(cIdx)}
                            style={{ 
                              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                              color: 'rgba(255,255,255,0.4)', borderRadius: '4px', padding: '0.3rem',
                              cursor: 'pointer', display: 'flex', alignItems: 'center'
                            }}
                            title="Reset to boilerplate"
                          >
                            <RotateCcw size={14} />
                          </button>
                          
                          <button 
                            type="button"
                            onClick={() => handleDryRun(cIdx)}
                            disabled={testingIndex === cIdx}
                            style={{ 
                              background: testingIndex === cIdx ? 'rgba(255,255,255,0.05)' : 'rgba(16,185,129,0.15)', 
                              border: `1px solid ${testingIndex === cIdx ? 'rgba(255,255,255,0.1)' : 'rgba(16,185,129,0.3)'}`,
                              color: testingIndex === cIdx ? '#a1a1aa' : '#10b981', 
                              borderRadius: '4px', padding: '0.3rem 0.8rem',
                              cursor: testingIndex === cIdx ? 'not-allowed' : 'pointer', 
                              display: 'flex', alignItems: 'center', gap: '0.4rem',
                              fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase'
                            }}
                          >
                            {testingIndex === cIdx ? (
                              <div style={{ width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                            ) : <Play size={12} fill="currentColor" />}
                            {testingIndex === cIdx ? 'Testing...' : 'Run Tests'}
                          </button>
                        </div>
                        
                        <Editor
                          value={codeSubmissions[cIdx]?.code || ''}
                          onValueChange={(code) => handleCodeChange(cIdx, code)}
                          highlight={(code) => highlightWithPrism(code, activeCodeTabs[cIdx])}
                          padding={20}
                          style={{
                            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
                            fontSize: 14,
                            minHeight: '400px',
                            background: 'transparent',
                            color: '#e6edf3',
                            lineHeight: '1.6'
                          }}
                          placeholder={`// Write your ${activeCodeTabs[cIdx]} solution here...`}
                        />

                        {/* Test Results Console */}
                        {testResults[cIdx] && (
                          <div style={{ 
                            borderTop: '1px solid #333', 
                            background: '#0a0a0a', 
                            padding: '1.5rem',
                            animation: 'slideUp 0.3s ease'
                          }}>
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                <Terminal size={16} style={{ color: 'var(--accent)' }} />
                                <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#fff', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                  Test Console
                                </span>
                              </div>
                              <span style={{ 
                                fontSize: '0.75rem', 
                                padding: '0.2rem 0.6rem', 
                                borderRadius: '4px',
                                background: testResults[cIdx].passedCases === testResults[cIdx].totalCases ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                                color: testResults[cIdx].passedCases === testResults[cIdx].totalCases ? '#10b981' : '#ef4444',
                                fontWeight: 700, border: `1px solid ${testResults[cIdx].passedCases === testResults[cIdx].totalCases ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`
                              }}>
                                {testResults[cIdx].passedCases} / {testResults[cIdx].totalCases} PASSED
                              </span>
                            </div>

                            {testResults[cIdx].diagnostic && (
                              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '1rem', fontStyle: 'italic' }}>
                                {testResults[cIdx].diagnostic}
                              </p>
                            )}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                              {testResults[cIdx].results?.map((res, tcIdx) => (
                                <div key={tcIdx} style={{ 
                                  background: 'rgba(255,255,255,0.02)', 
                                  border: `1px solid ${res.status === 'Passed' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}`,
                                  borderRadius: '6px', padding: '0.75rem'
                                }}>
                                  <div className="flex items-center justify-between mb-2">
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#d1d5db' }}>Test Case {res.caseNumber}</span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.75rem', fontWeight: 800, color: res.status === 'Passed' ? '#10b981' : '#ef4444' }}>
                                      {res.status === 'Passed' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                                      {res.status.toUpperCase()}
                                    </span>
                                  </div>
                                  
                                  {res.status === 'Failed' && (
                                    <div style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#9ca3af', display: 'grid', gap: '0.5rem', marginTop: '0.5rem' }}>
                                      <div style={{ background: 'rgba(0,0,0,0.3)', padding: '0.5rem', borderRadius: '4px' }}>
                                        <div style={{ color: '#4f4f4f', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Expected</div>
                                        {res.expectedOutput}
                                      </div>
                                      <div style={{ background: 'rgba(239,68,68,0.05)', padding: '0.5rem', borderRadius: '4px', borderLeft: '2px solid #ef4444' }}>
                                        <div style={{ color: '#ef4444', fontSize: '0.65rem', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Actual</div>
                                        {res.actualOutput}
                                      </div>
                                      <div style={{ color: '#ef4444', fontStyle: 'italic', marginTop: '0.2rem' }}>
                                        {res.message}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Submit */}
          {/* Submit Footer */}
          <div className="glass-panel" style={{ 
            padding: '2rem', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between', 
            flexWrap: 'wrap', 
            gap: '1.5rem',
            background: 'linear-gradient(to right, rgba(16, 185, 129, 0.05), rgba(0,0,0,0.2))',
            border: '1px solid rgba(16, 185, 129, 0.2)',
            marginTop: '3rem'
          }}>
            <div style={{ flex: 1, minWidth: '280px' }}>
              <h4 style={{ margin: 0, fontWeight: 700, fontSize: '1.1rem', color: '#fff' }}>Finalize Submission</h4>
              <p style={{ margin: '0.5rem 0 0 0', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Ensure all MCQ options are selected and your code logic is complete. Your {violationCount > 0 ? `recorded violations (${violationCount})` : 'clean record'} will be submitted along with your answers.
              </p>
            </div>
            <button
              type="submit"
              className="btn"
              disabled={submitting}
              style={{ 
                padding: '1rem 2.5rem', 
                fontSize: '1.1rem', 
                backgroundColor: 'var(--success)', 
                minWidth: '240px', 
                justifyContent: 'center',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
                fontWeight: 700
              }}
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div style={{ width: 18, height: 18, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                  <span>AI Scoring...</span>
                </div>
              ) : (
                <><Send size={18} /> Finish & Submit</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LiveAssessment;
