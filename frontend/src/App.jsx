import { lazy, Suspense, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Sidebar from './components/layout/Sidebar';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/layout/ProtectedRoute';
import { useAuth } from './context/AuthContext';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import StaffDashboard from './pages/StaffDashboard';
import GuestDashboard from './pages/GuestDashboard';
import Rooms from './pages/Rooms';
import Bookings from './pages/Bookings';
import CheckIn from './pages/CheckIn';
import Staff from './pages/Staff';
import Requests from './pages/Requests';
import HelpDeskNotifications from './pages/HelpDeskNotifications';
import Tasks from './pages/Tasks';
import Inventory from './pages/Inventory';
import Intelligence from './pages/Intelligence';
import Segmentation from './pages/Segmentation';
import Pricing from './pages/Pricing';
import Feedback from './pages/Feedback';
import Maintenance from './pages/Maintenance';
import RoomAccess from './pages/RoomAccess';
import NearbyPlaces from './pages/NearbyPlaces';
import Offers from './pages/Offers';
import Events from './pages/Events';
import BookRoom from './pages/BookRoom';
import BookingConfirmation from './pages/BookingConfirmation';

const DigitalTwin = lazy(() => import('./pages/DigitalTwin'));

function AppLayout({ title, children }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-ivory lg:flex">
      <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
      <div className="min-w-0 flex-1">
        <Navbar title={title} onMenuClick={() => setMenuOpen(true)} />
        <motion.main
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32, ease: 'easeOut' }}
          className="mx-auto w-full max-w-[1600px] px-4 py-5 sm:px-7 sm:py-7 lg:px-10 lg:py-9"
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
}

function Protected({ title, children, roles }) {
  return (
    <ProtectedRoute roles={roles}>
      <AppLayout title={title}>{children}</AppLayout>
    </ProtectedRoute>
  );
}

// Staff get a lean, task-focused dashboard; guests get their own room + requests
// + feedback view; everyone else (manager) gets the full overview.
function DashboardRouter() {
  const { user } = useAuth();
  if (user?.role === 'staff') return <StaffDashboard />;
  if (user?.role === 'guest') return <GuestDashboard />;
  return <Dashboard />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route path="/dashboard" element={<Protected title="Dashboard"><DashboardRouter /></Protected>} />
      <Route path="/nearby" element={<Protected title="Explore Nearby" roles={['guest']}><NearbyPlaces /></Protected>} />
      <Route path="/book-room" element={<Protected title="Book a stay" roles={['guest']}><BookRoom /></Protected>} />
      <Route path="/booking-confirmation/:bookingId" element={<Protected title="Booking confirmation" roles={['guest']}><BookingConfirmation /></Protected>} />
      <Route path="/offers" element={<Protected title="Loyalty Offers" roles={['manager']}><Offers /></Protected>} />
      <Route path="/events" element={<Protected title="Resort Events" roles={['guest', 'manager']}><Events /></Protected>} />
      <Route path="/rooms" element={<Protected title="Rooms" roles={['manager']}><Rooms /></Protected>} />
      <Route path="/room" element={<RoomAccess />} />
      <Route path="/checkin" element={<Protected title="Guest Check-in / Check-out" roles={['manager']}><CheckIn /></Protected>} />
      <Route path="/bookings" element={<Protected title="Bookings" roles={['manager']}><Bookings /></Protected>} />
      <Route path="/staff" element={<Protected title="Staff" roles={['manager']}><Staff /></Protected>} />
      <Route path="/helpdesk" element={<Protected title="Help Desk" roles={['manager']}><HelpDeskNotifications /></Protected>} />
      <Route path="/requests" element={<Protected title="Guest Requests" roles={['manager']}><Requests /></Protected>} />
      <Route path="/tasks" element={<Protected title="Tasks" roles={['manager', 'staff']}><Tasks /></Protected>} />
      <Route path="/inventory" element={<Protected title="Inventory" roles={['manager']}><Inventory /></Protected>} />
      <Route path="/intelligence" element={<Protected title="AI Intelligence Center" roles={['manager']}><Intelligence /></Protected>} />
      <Route path="/digital-twin" element={<Protected title="Weather Digital Twin" roles={['manager']}><Suspense fallback={<div className="card p-5 text-sm text-ink-700/70">Loading weather simulation...</div>}><DigitalTwin /></Suspense></Protected>} />
      <Route path="/segmentation" element={<Protected title="Guest Segmentation" roles={['manager']}><Segmentation /></Protected>} />
      <Route path="/pricing" element={<Protected title="Dynamic Pricing" roles={['manager']}><Pricing /></Protected>} />
      <Route path="/feedback" element={<Protected title="Feedback Analytics" roles={['manager', 'staff']}><Feedback /></Protected>} />
      <Route path="/maintenance" element={<Protected title="Maintenance" roles={['manager', 'staff']}><Maintenance /></Protected>} />

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}