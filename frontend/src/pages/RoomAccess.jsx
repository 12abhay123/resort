import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// One QR per room (printed on the room key), reached at /room?room=<id>.
// Where it sends the scanner depends on who's signed in:
//   manager        -> /checkin?room=<id>   (check guest in / out)
//   anyone else,
//   or not signed in -> /login?room=<id>   (guest phone sign-in for that room)
export default function RoomAccess() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const roomId = params.get('room');

  useEffect(() => {
    if (!roomId) {
      navigate('/login', { replace: true });
      return;
    }
    if (user?.role === 'manager') navigate(`/checkin?room=${roomId}`, { replace: true });
    else navigate(`/login?room=${roomId}`, { replace: true });
  }, [roomId, user, navigate]);

  return null;
}