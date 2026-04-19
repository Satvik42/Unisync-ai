import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { Plus, Trash2, Edit3, ArrowLeft, ListTodo, Code2, CheckCircle2 } from 'lucide-react';

const DEFAULT_LANGUAGES = ['Python', 'JavaScript', 'Java', 'C++'];

const EventBuilder = ({ user }) => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  
  const [builderConfig, setBuilderConfig] = useState({
    includeMcqs: true,
    includeIde: true,
    mcqs: [],
    codingChallenges: [
      { 
        questionTitle: '', 
        problemStatement: '', 
        boilerplates: DEFAULT_LANGUAGES.reduce((acc, lang) => { acc[lang] = `// Write your ${lang} code here\n`; return acc; }, {}),
        testCases: []
      }
    ]
  });

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${eventId}/config`);
        const evt = res.data.event;
        setEvent(evt);
        
        const existingMcqs = evt.mcqs && evt.mcqs.length > 0;
        const existingIde = evt.codingChallenges && evt.codingChallenges.length > 0;
        
        setBuilderConfig({
          includeMcqs: existingMcqs || (!existingMcqs && !existingIde),
          includeIde: existingIde || (!existingMcqs && !existingIde),
          mcqs: existingMcqs ? evt.mcqs : [],
          codingChallenges: existingIde ? evt.codingChallenges : [
            { 
              questionTitle: '', 
              problemStatement: '', 
              boilerplates: DEFAULT_LANGUAGES.reduce((acc, lang) => { acc[lang] = `// Write your ${lang} code here\n`; return acc; }, {}),
              testCases: []
            }
          ]
        });
      } catch (err) {
        console.error(err);
      }
    };
    fetchEvent();
  }, [eventId]);

  const saveBuilderConfig = async () => {
    try {
      await api.patch(`/events/${eventId}/builder`, {
        includeMcqs: builderConfig.includeMcqs,
        includeIde: builderConfig.includeIde,
        mcqs: builderConfig.mcqs,
        codingChallenges: builderConfig.codingChallenges
      });
      alert('Event rounds successfully configured!');
      navigate('/admin');
    } catch (err) {
      alert('Failed to save configuration');
    }
  };

  const updateBuilderState = (key, val) => setBuilderConfig(prev => ({ ...prev, [key]: val }));
  
  // MCQ handlers
  const addMcq = () => {
    const newMcqs = [...builderConfig.mcqs, { question: '', options: ['', '', '', ''], correctOptionIndex: 0 }];
    updateBuilderState('mcqs', newMcqs);
  };
  const updateMcq = (index, field, value, optIndex = null) => {
    const newMcqs = [...builderConfig.mcqs];
    if (optIndex !== null) newMcqs[index].options[optIndex] = value;
    else newMcqs[index][field] = value;
    updateBuilderState('mcqs', newMcqs);
  };
  const removeMcq = (index) => {
    updateBuilderState('mcqs', builderConfig.mcqs.filter((_, i) => i !== index));
  };

  // Coding Challenge handlers
  const addCodingChallenge = () => {
    const newChallenges = [...builderConfig.codingChallenges, { 
      questionTitle: '', 
      problemStatement: '', 
      boilerplates: DEFAULT_LANGUAGES.reduce((acc, lang) => { acc[lang] = `// Write your ${lang} code here\n`; return acc; }, {}),
      testCases: []
    }];
    updateBuilderState('codingChallenges', newChallenges);
  };
  const updateCodingChallenge = (index, field, value) => {
    const newChallenges = [...builderConfig.codingChallenges];
    newChallenges[index][field] = value;
    updateBuilderState('codingChallenges', newChallenges);
  };
  const updateCodingBoilerplate = (index, lang, value) => {
    const newChallenges = [...builderConfig.codingChallenges];
    newChallenges[index].boilerplates[lang] = value;
    updateBuilderState('codingChallenges', newChallenges);
  };
  const removeCodingChallenge = (index) => {
    updateBuilderState('codingChallenges', builderConfig.codingChallenges.filter((_, i) => i !== index));
  };

  // Test Case handlers
  const addTestCase = (cIdx) => {
    const newChallenges = [...builderConfig.codingChallenges];
    if (!newChallenges[cIdx].testCases) newChallenges[cIdx].testCases = [];
    newChallenges[cIdx].testCases.push({ input: '', expectedOutput: '' });
    updateBuilderState('codingChallenges', newChallenges);
  };
  const updateTestCase = (cIdx, tcIdx, field, val) => {
    const newChallenges = [...builderConfig.codingChallenges];
    newChallenges[cIdx].testCases[tcIdx][field] = val;
    updateBuilderState('codingChallenges', newChallenges);
  };
  const removeTestCase = (cIdx, tcIdx) => {
    const newChallenges = [...builderConfig.codingChallenges];
    newChallenges[cIdx].testCases.splice(tcIdx, 1);
    updateBuilderState('codingChallenges', newChallenges);
  };

  if (!event) return <div className="p-8 text-center mt-20">Loading...</div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem' }} onClick={() => navigate('/admin')}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="mb-0">Configure Rounds: {event.title}</h1>
      </div>

      <div className="glass-panel mt-6 p-6" style={{ border: '2px dashed var(--accent)', borderRadius: '8px', background: 'rgba(0,0,0,0.3)' }}>
         <h3 className="mb-2 text-accent flex items-center gap-2"><Edit3 size={18}/> Assessment Builder</h3>
         <p className="mb-6" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Frame and draft the rounds for this event. These configurations go live instantly.</p>
         
         <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem' }}>
            <div 
              onClick={() => updateBuilderState('includeMcqs', !builderConfig.includeMcqs)}
              style={{
                cursor: 'pointer',
                border: builderConfig.includeMcqs ? '2px solid var(--accent)' : '2px solid transparent',
                background: builderConfig.includeMcqs ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)',
                padding: '1.5rem',
                borderRadius: '16px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                position: 'relative',
                boxShadow: builderConfig.includeMcqs ? '0 10px 30px rgba(0,0,0,0.3)' : 'none',
                transform: builderConfig.includeMcqs ? 'translateY(-4px)' : 'none'
              }}
            >
              {builderConfig.includeMcqs && <CheckCircle2 size={24} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: 'var(--accent)' }} />}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '50%', width: 'fit-content' }}>
                <ListTodo size={28} style={{ color: builderConfig.includeMcqs ? 'var(--accent)' : 'var(--text-secondary)', transition: 'color 0.3s' }} />
              </div>
              <div>
                <h4 style={{ margin: '0.5rem 0 0.25rem 0', color: builderConfig.includeMcqs ? '#fff' : 'var(--text-secondary)', fontSize: '1.2rem', transition: 'color 0.3s' }}>MCQ Assessment</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>Ideal for testing aptitude, CS fundamentals, or basic programming constructs.</p>
              </div>
            </div>

            <div 
              onClick={() => updateBuilderState('includeIde', !builderConfig.includeIde)}
              style={{
                cursor: 'pointer',
                border: builderConfig.includeIde ? '2px solid var(--accent)' : '2px solid transparent',
                background: builderConfig.includeIde ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.2)',
                padding: '1.5rem',
                borderRadius: '16px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem',
                position: 'relative',
                boxShadow: builderConfig.includeIde ? '0 10px 30px rgba(0,0,0,0.3)' : 'none',
                transform: builderConfig.includeIde ? 'translateY(-4px)' : 'none'
              }}
            >
              {builderConfig.includeIde && <CheckCircle2 size={24} style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', color: 'var(--accent)' }} />}
              <div style={{ background: 'rgba(0,0,0,0.3)', padding: '1rem', borderRadius: '50%', width: 'fit-content' }}>
                <Code2 size={28} style={{ color: builderConfig.includeIde ? 'var(--accent)' : 'var(--text-secondary)', transition: 'color 0.3s' }} />
              </div>
              <div>
                <h4 style={{ margin: '0.5rem 0 0.25rem 0', color: builderConfig.includeIde ? '#fff' : 'var(--text-secondary)', fontSize: '1.2rem', transition: 'color 0.3s' }}>Technical Coding</h4>
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.4' }}>Fully integrated IDE with multiple language support for algorithmic challenges.</p>
              </div>
            </div>
         </div>

        {builderConfig.includeMcqs && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h4 style={{ color: 'var(--accent)', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ListTodo size={20} /> MCQ Round Builder
              </h4>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '0.3rem 0.7rem', borderRadius: '20px' }}>
                {builderConfig.mcqs.length} question{builderConfig.mcqs.length !== 1 ? 's' : ''}
              </span>
            </div>

            {builderConfig.mcqs.map((mcq, qIdx) => (
              <div key={qIdx} className="glass-panel mb-6" style={{ background: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.5rem' }}>
                {/* Question header */}
                <div className="flex justify-between items-center mb-4">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ background: 'var(--accent)', color: '#fff', width: 28, height: 28, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.85rem', fontWeight: 700, flexShrink: 0 }}>{qIdx + 1}</span>
                    <label style={{ fontWeight: 600, fontSize: '1rem', color: '#fff' }}>Question {qIdx + 1}</label>
                  </div>
                  <button type="button" onClick={() => removeMcq(qIdx)} className="btn" style={{ padding: '0.3rem 0.7rem', backgroundColor: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', fontSize: '0.8rem' }}>
                    <Trash2 size={14} /> Remove
                  </button>
                </div>

                {/* Question text */}
                <div className="form-group mb-5">
                  <label style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>Question Text *</label>
                  <input
                    required
                    placeholder="e.g. What is the time complexity of binary search?"
                    value={mcq.question}
                    onChange={(e) => updateMcq(qIdx, 'question', e.target.value)}
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #1f2937', fontSize: '1rem', padding: '0.8rem 1rem', borderRadius: '8px' }}
                  />
                </div>

                {/* Options */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-3">
                    <label style={{ fontSize: '0.78rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                      Answer Choices — <span style={{ color: '#22c55e' }}>click the radio button to mark the correct answer</span>
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{mcq.options.length} option{mcq.options.length !== 1 ? 's' : ''}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                    {mcq.options.map((opt, oIdx) => {
                      const isCorrect = mcq.correctOptionIndex === oIdx;
                      return (
                        <div key={oIdx} style={{
                          display: 'flex', alignItems: 'center', gap: '0.75rem',
                          padding: '0.6rem 0.75rem',
                          borderRadius: '8px',
                          background: isCorrect ? 'rgba(34,197,94,0.08)' : 'rgba(0,0,0,0.25)',
                          border: `1px solid ${isCorrect ? '#22c55e' : '#1f2937'}`,
                          transition: 'all 0.2s'
                        }}>
                          {/* Correct answer selector */}
                          <button
                            type="button"
                            onClick={() => updateMcq(qIdx, 'correctOptionIndex', oIdx)}
                            title="Mark as correct answer"
                            style={{
                              width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                              border: `2px solid ${isCorrect ? '#22c55e' : '#374151'}`,
                              background: isCorrect ? '#22c55e' : 'transparent',
                              cursor: 'pointer',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              transition: 'all 0.2s'
                            }}
                          >
                            {isCorrect && <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 900 }}>✓</span>}
                          </button>

                          {/* Option label badge */}
                          <span style={{
                            width: 24, height: 24, borderRadius: '4px', flexShrink: 0,
                            background: isCorrect ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
                            color: isCorrect ? '#22c55e' : '#94a3b8',
                            fontSize: '0.75rem', fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center'
                          }}>
                            {String.fromCharCode(65 + oIdx)}
                          </span>

                          {/* Option text input */}
                          <input
                            required
                            placeholder={`Option ${String.fromCharCode(65 + oIdx)} — type your choice here...`}
                            value={opt}
                            onChange={(e) => updateMcq(qIdx, 'options', e.target.value, oIdx)}
                            style={{
                              flex: 1, background: 'transparent', border: 'none', outline: 'none',
                              color: isCorrect ? '#fff' : '#d1d5db', fontSize: '0.95rem', padding: '0.2rem 0'
                            }}
                          />

                          {/* Correct tag */}
                          {isCorrect && (
                            <span style={{ fontSize: '0.72rem', color: '#22c55e', fontWeight: 700, background: 'rgba(34,197,94,0.15)', padding: '0.15rem 0.5rem', borderRadius: '20px', flexShrink: 0 }}>
                              ✓ Correct
                            </span>
                          )}

                          {/* Remove option button (only if > 2 options) */}
                          {mcq.options.length > 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                const newMcqs = [...builderConfig.mcqs];
                                newMcqs[qIdx].options.splice(oIdx, 1);
                                // Adjust correctOptionIndex if needed
                                if (newMcqs[qIdx].correctOptionIndex >= newMcqs[qIdx].options.length) {
                                  newMcqs[qIdx].correctOptionIndex = 0;
                                }
                                updateBuilderState('mcqs', newMcqs);
                              }}
                              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', padding: '0.2rem', flexShrink: 0 }}
                              title="Remove option"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Add option button */}
                  {mcq.options.length < 6 && (
                    <button
                      type="button"
                      onClick={() => {
                        const newMcqs = [...builderConfig.mcqs];
                        newMcqs[qIdx].options.push('');
                        updateBuilderState('mcqs', newMcqs);
                      }}
                      className="btn btn-secondary"
                      style={{ marginTop: '0.6rem', padding: '0.4rem 0.9rem', fontSize: '0.85rem', borderStyle: 'dashed' }}
                    >
                      <Plus size={14} /> Add Option
                    </button>
                  )}
                </div>

                {/* Correct answer hint for admin */}
                {mcq.options[mcq.correctOptionIndex] && (
                  <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '6px', padding: '0.6rem 0.9rem', fontSize: '0.85rem' }}>
                    <span style={{ color: '#22c55e', fontWeight: 600 }}>✓ Correct answer: </span>
                    <span style={{ color: '#d1d5db' }}>Option {String.fromCharCode(65 + mcq.correctOptionIndex)} — "{mcq.options[mcq.correctOptionIndex]}"</span>
                  </div>
                )}
              </div>
            ))}

            <button type="button" className="btn btn-secondary w-100 justify-center" onClick={addMcq} style={{ borderStyle: 'dashed', borderWidth: '2px', backgroundColor: 'rgba(255,255,255,0.02)', padding: '0.9rem' }}>
              <Plus size={16} /> Add MCQ Question
            </button>
          </div>
        )}

        {builderConfig.includeIde && (
          <div className="mb-8 p-6" style={{ background: 'rgba(0,0,0,0.2)', borderRadius: '16px', border: '1px solid var(--glass-border)' }}>
            <h4 className="flex items-center gap-2 mb-6" style={{ color: 'var(--accent)', fontSize: '1.2rem' }}>
              <Code2 size={22} /> Technical Coding Challenges
            </h4>
            
            {builderConfig.codingChallenges.map((challenge, cIdx) => (
              <div key={cIdx} className="glass-panel mb-6" style={{ background: 'rgba(30, 41, 59, 0.4)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '12px' }}>
                <div className="flex justify-between items-center mb-4 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <label style={{ fontSize: '1.1rem', color: '#fff', fontWeight: 600 }}>Challenge {cIdx + 1}</label>
                  <button type="button" onClick={() => removeCodingChallenge(cIdx)} className="btn" style={{ padding: '0.4rem 0.8rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none' }}>
                    <Trash2 size={16} /> Remove
                  </button>
                </div>
                
                <div className="flex gap-6" style={{ flexWrap: 'wrap' }}>
                  <div style={{ flex: '1 1 300px' }}>
                    <div className="form-group mb-5">
                      <label style={{ color: 'var(--accent)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Question Title</label>
                      <input 
                        required 
                        placeholder="e.g. Two Sum, Reverse Linked List..." 
                        value={challenge.questionTitle} 
                        onChange={(e) => updateCodingChallenge(cIdx, 'questionTitle', e.target.value)} 
                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', fontSize: '1.05rem', padding: '0.8rem 1rem' }}
                      />
                    </div>
                    
                    <div className="form-group mb-4">
                      <label style={{ color: 'var(--accent)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Problem Description & Constraints</label>
                      <textarea 
                        required 
                        rows="8" 
                        placeholder="Describe the problem, input/output formats, and constraints..." 
                        value={challenge.problemStatement} 
                        onChange={(e) => updateCodingChallenge(cIdx, 'problemStatement', e.target.value)}
                        style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', lineHeight: '1.6', resize: 'vertical' }}
                      ></textarea>
                    </div>
                  </div>

                  <div style={{ flex: '1 1 350px', background: '#0f111a', borderRadius: '8px', padding: '1rem', border: '1px solid var(--glass-border)' }}>
                    <label className="flex items-center gap-2 mb-3" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                      <Code2 size={16} /> Optional Pseudo Code / Boilerplates
                    </label>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Pre-fill the IDE for students. Leave empty to start blank.</p>
                    
                    <div className="flex-col gap-4">
                      {DEFAULT_LANGUAGES.map((lang) => (
                        <div key={lang} className="form-group mb-0">
                          <label style={{ fontSize: '0.8rem', color: '#94a3b8', display: 'flex', justifyContent: 'space-between' }}>
                            <span>{lang}</span>
                          </label>
                          <textarea 
                            rows="3" 
                            style={{ 
                              fontFamily: '"Fira Code", monospace', 
                              fontSize: '0.85rem', 
                              background: '#1e293b', 
                              border: '1px solid #334155',
                              color: '#e2e8f0',
                              padding: '0.5rem',
                              borderRadius: '4px'
                            }} 
                            placeholder={`// Initial code for ${lang}...`}
                            value={challenge.boilerplates[lang] || ''} 
                            onChange={(e) => updateCodingBoilerplate(cIdx, lang, e.target.value)}>
                          </textarea>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Test Cases Section */}
                <div style={{ background: '#0f111a', borderRadius: '8px', padding: '1.2rem', border: '1px solid var(--glass-border)', marginTop: '1.5rem' }}>
                  <div className="flex justify-between items-center mb-4 pb-2" style={{ borderBottom: '1px solid #1f2937' }}>
                    <label className="flex items-center gap-2" style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', fontWeight: 600 }}>
                      <ListTodo size={18} /> Test Cases for Auto-Evaluation
                    </label>
                    <button type="button" className="btn btn-secondary" style={{ padding: '0.3rem 0.8rem', fontSize: '0.85rem' }} onClick={() => addTestCase(cIdx)}>
                      <Plus size={14} /> Add Test Case
                    </button>
                  </div>
                  
                  <div className="flex-col gap-3">
                    {challenge.testCases && challenge.testCases.map((tc, tcIdx) => (
                      <div key={tcIdx} className="flex gap-4 p-3" style={{ background: '#111827', borderRadius: '6px', border: '1px solid #1f2937' }}>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Input Parameter(s)</label>
                          <input 
                            placeholder="e.g. nums=[2,7], target=9"
                            style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', padding: '0.5rem', fontSize: '0.85rem', fontFamily: '"Fira Code", monospace', borderRadius: '4px' }}
                            value={tc.input}
                            onChange={e => updateTestCase(cIdx, tcIdx, 'input', e.target.value)}
                          />
                        </div>
                        <div style={{ flex: 1 }}>
                          <label style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Expected Output</label>
                          <input 
                            placeholder="e.g. [0,1]"
                            style={{ width: '100%', background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', padding: '0.5rem', fontSize: '0.85rem', fontFamily: '"Fira Code", monospace', borderRadius: '4px' }}
                            value={tc.expectedOutput}
                            onChange={e => updateTestCase(cIdx, tcIdx, 'expectedOutput', e.target.value)}
                          />
                        </div>
                        <div className="flex items-end">
                           <button type="button" onClick={() => removeTestCase(cIdx, tcIdx)} className="btn" style={{ padding: '0.5rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '4px' }}>
                             <Trash2 size={16} />
                           </button>
                        </div>
                      </div>
                    ))}
                    {(!challenge.testCases || challenge.testCases.length === 0) && (
                      <p style={{ fontSize: '0.85rem', color: '#64748b', fontStyle: 'italic', margin: '0.5rem 0 0 0' }}>No formal test cases added. Validations will be purely semantic via AI.</p>
                    )}
                  </div>
                </div>

              </div>
            ))}
            
            <button type="button" className="btn btn-secondary w-100 justify-center py-3" onClick={addCodingChallenge} style={{ borderStyle: 'dashed', borderWidth: '2px', backgroundColor: 'rgba(255,255,255,0.02)' }}>
              <Plus size={18} /> Add Another Coding Challenge
            </button>
          </div>
        )}

        <button 
          className="btn w-100 justify-center mt-4" 
          style={{ backgroundColor: 'var(--success)' }}
          onClick={saveBuilderConfig}
        >
          Save Builder Configurations
        </button>
       </div>
    </div>
  );
};

export default EventBuilder;
