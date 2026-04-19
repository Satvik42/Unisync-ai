import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { Plus, Trash2, ArrowLeft, ListTodo, Lock, Unlock } from 'lucide-react';

const RegistrationBuilder = ({ user }) => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  
  const [builderConfig, setBuilderConfig] = useState({
    registrationOpen: true,
    registrationFields: [
      { label: 'Name', type: 'text', required: true },
      { label: 'Email', type: 'email', required: true },
      { label: 'USN / Roll No', type: 'text', required: true },
      { label: 'Contact Number', type: 'text', required: true }
    ]
  });

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await api.get(`/events/${eventId}`);
        const evt = res.data.event;
        setEvent(evt);
        
        setBuilderConfig({
          registrationOpen: evt.registrationOpen !== false, // Defaults to true if undefined
          registrationFields: evt.registrationFields?.length ? evt.registrationFields : [
            { label: 'Name', type: 'text', required: true },
            { label: 'Email', type: 'email', required: true },
            { label: 'USN / Roll No', type: 'text', required: true },
            { label: 'Contact Number', type: 'text', required: true }
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
      await api.patch(`/events/${eventId}/registration-schema`, {
        registrationOpen: builderConfig.registrationOpen,
        registrationFields: builderConfig.registrationFields
      });
      alert('Registration configurations successfully saved!');
      navigate('/admin');
    } catch (err) {
      alert('Failed to save configuration');
    }
  };

  const updateBuilderState = (key, val) => setBuilderConfig(prev => ({ ...prev, [key]: val }));
  
  // Registration Field Handlers
  const addRegField = () => {
    updateBuilderState('registrationFields', [...builderConfig.registrationFields, { label: '', type: 'text', required: false }]);
  };
  const updateRegField = (index, key, val) => {
    const updated = [...builderConfig.registrationFields];
    updated[index][key] = val;
    updateBuilderState('registrationFields', updated);
  };
  const removeRegField = (index) => {
    updateBuilderState('registrationFields', builderConfig.registrationFields.filter((_, i) => i !== index));
  };
  
  const toggleRegistrationStatus = () => {
    updateBuilderState('registrationOpen', !builderConfig.registrationOpen);
  };

  if (!event) return <div className="p-8 text-center mt-20">Loading...</div>;

  return (
    <div>
      <div className="flex items-center gap-4 mb-6">
        <button className="btn btn-secondary" style={{ padding: '0.4rem 0.6rem' }} onClick={() => navigate('/admin')}>
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="mb-0">Configure Registration: {event.title}</h1>
      </div>

      <div className="glass-panel mt-6 p-6" style={{ border: '2px dashed var(--accent)', borderRadius: '8px', background: 'rgba(0,0,0,0.3)' }}>
         <div className="flex justify-between items-start mb-6 pb-6" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
           <div>
             <h3 className="mb-2 text-accent flex items-center gap-2"><ListTodo size={18}/> Registration Form Schema</h3>
             <p className="mb-0" style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Define exactly what information students must provide when joining this event.</p>
           </div>
           
           <div 
             onClick={toggleRegistrationStatus}
             style={{
               cursor: 'pointer',
               padding: '0.8rem 1.2rem',
               background: builderConfig.registrationOpen ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
               border: builderConfig.registrationOpen ? '1px solid var(--success)' : '1px solid var(--danger)',
               borderRadius: '8px',
               display: 'flex',
               alignItems: 'center',
               gap: '0.75rem',
               transition: 'all 0.3s'
             }}
           >
             {builderConfig.registrationOpen ? <Unlock size={20} style={{ color: 'var(--success)' }} /> : <Lock size={20} style={{ color: 'var(--danger)' }} />}
             <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 600, color: builderConfig.registrationOpen ? 'var(--success)' : 'var(--danger)', fontSize: '0.9rem' }}>
                  {builderConfig.registrationOpen ? 'Registrations are OPEN' : 'Registrations are CLOSED'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Click to toggle access</div>
             </div>
           </div>
         </div>
         
         <div className="flex-col gap-3 mb-4">
           {builderConfig.registrationFields.map((field, fIdx) => (
             <div key={fIdx} className="flex gap-4 items-center p-3" style={{ background: '#111827', borderRadius: '6px', border: '1px solid #1f2937' }}>
               <div style={{ flex: 2 }}>
                 <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Field Label</label>
                 <input 
                   placeholder="e.g. GitHub Profile Link"
                   className="w-100"
                   style={{ background: '#1e293b', border: '1px solid #334155', padding: '0.5rem', color: '#fff', borderRadius: '4px' }}
                   value={field.label}
                   onChange={e => updateRegField(fIdx, 'label', e.target.value)}
                 />
               </div>
               <div style={{ flex: 1 }}>
                 <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Input Type</label>
                 <select 
                   className="w-100"
                   style={{ background: '#1e293b', border: '1px solid #334155', padding: '0.5rem', color: '#fff', borderRadius: '4px' }}
                   value={field.type}
                   onChange={e => updateRegField(fIdx, 'type', e.target.value)}
                 >
                   <option value="text">Short Text</option>
                   <option value="email">Email</option>
                   <option value="number">Number</option>
                   <option value="url">URL Link</option>
                 </select>
               </div>
               <div className="flex items-center gap-2 mt-4" style={{ flex: 0.5 }}>
                 <input type="checkbox" checked={field.required} onChange={e => updateRegField(fIdx, 'required', e.target.checked)} />
                 <label style={{ fontSize: '0.8rem', color: '#cbd5e1', cursor: 'pointer' }}>Required</label>
               </div>
               <div className="mt-4">
                  <button type="button" onClick={() => removeRegField(fIdx)} className="btn" style={{ padding: '0.4rem', backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: 'none', borderRadius: '4px' }}>
                    <Trash2 size={16} />
                  </button>
               </div>
             </div>
           ))}
         </div>
         <button type="button" className="btn btn-secondary" onClick={addRegField}>
           <Plus size={14} /> Add Custom Field
         </button>

         <button 
           className="btn w-100 justify-center mt-8" 
           style={{ backgroundColor: 'var(--success)' }}
           onClick={saveBuilderConfig}
         >
           Save Configurations
         </button>
       </div>
    </div>
  );
};

export default RegistrationBuilder;
