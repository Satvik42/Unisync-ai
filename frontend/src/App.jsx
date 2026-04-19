import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import EventDetails from './pages/EventDetails';
import EventBuilder from './pages/EventBuilder';
import RegistrationBuilder from './pages/RegistrationBuilder';
import StudentRegistration from './pages/StudentRegistration';
import EventLeaderboard from './pages/EventLeaderboard';
import LiveAssessment from './pages/LiveAssessment';
import { useState, useEffect } from 'react';
import { LogOut } from 'lucide-react';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <BrowserRouter>
      {user && (
        <nav className="nav">
          <div className="flex items-center gap-2">
            <h3>UniSync AI</h3>
            <span className="badge" style={{ marginLeft: 10, background: 'rgba(255,255,255,0.1)' }}>
              {user.role} Portal
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Welcome, {user.name}</span>
            <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem' }}>
              <LogOut size={16} /> Logout
            </button>
          </div>
        </nav>
      )}

      <div className="container">
        <Routes>
          <Route path="/login" element={!user ? <Login setUser={setUser} /> : <Navigate to={user.role === 'admin' ? '/admin' : '/student'} />} />
          
          {/* Student Routes */}
          <Route path="/student" element={user?.role === 'student' ? <StudentDashboard user={user} /> : <Navigate to="/login" />} />
          <Route path="/student/register/:eventId" element={user?.role === 'student' ? <StudentRegistration user={user} /> : <Navigate to="/login" />} />
          <Route path="/events/:id" element={user ? <EventDetails user={user} /> : <Navigate to="/login" />} />
          <Route path="/events/:id/leaderboard" element={user ? <EventLeaderboard user={user} /> : <Navigate to="/login" />} />
          <Route path="/events/:id/assessment" element={user?.role === 'student' ? <LiveAssessment user={user} /> : <Navigate to="/login" />} />

          {/* Admin Routes */}
          <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard user={user} /> : <Navigate to="/login" />} />
          <Route path="/admin/builder/:eventId" element={user?.role === 'admin' ? <EventBuilder user={user} /> : <Navigate to="/login" />} />
          <Route path="/admin/registration/:eventId" element={user?.role === 'admin' ? <RegistrationBuilder user={user} /> : <Navigate to="/login" />} />


          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
