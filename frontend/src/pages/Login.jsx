import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, BadgeCheck, Eye, EyeOff, LoaderCircle, LockKeyhole, Mail, Phone } from 'lucide-react';
import BrandMark from '../components/common/BrandMark';

const BG_VIDEO = 'https://res.cloudinary.com/g3ibo1zm/video/upload/f_auto:video,q_auto/r1';

export default function Login() {
  const { login, guestLogin, requestGuestRegistrationOtp, verifyGuestRegistrationOtp, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const roomId = searchParams.get('room'); // set when guest scanned their room key QR
  const [mode, setMode] = useState(roomId ? 'guest' : 'staff'); // 'staff' (manager/staff email login) | 'guest' (phone only)
  const [form, setForm] = useState({ email: 'staylix.manager.test.20260926@example.com', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [phone, setPhone] = useState('');
  const [guestAuthMode, setGuestAuthMode] = useState('login');
  const [registration, setRegistration] = useState({ name: '', email: '', phone: '', otp: '' });
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);

  function finishSignIn() {
    setIsTransitioning(true);
    window.setTimeout(() => navigate('/dashboard'), 950);
  }

  async function handleStaffSubmit(e) {
    e.preventDefault();
    setError('');
    const res = await login(form.email, form.password);
    if (res.success) finishSignIn();
    else setError(res.message);
  }

  async function handleGuestSubmit(e) {
    e.preventDefault();
    setError('');
    const res = await guestLogin(phone, roomId || undefined);
    if (res.success) finishSignIn();
    else setError(res.message);
  }

  async function handleRegistrationRequest(e) {
    e.preventDefault();
    setError('');
    const res = await requestGuestRegistrationOtp({ name: registration.name, email: registration.email, phone: registration.phone });
    if (res.success) setOtpSent(true);
    else setError(res.message);
  }

  async function handleRegistrationVerify(e) {
    e.preventDefault();
    setError('');
    const res = await verifyGuestRegistrationOtp(registration.email, registration.otp);
    if (res.success) finishSignIn();
    else setError(res.message);
  }

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-brand-900">
      <video
        className="fixed inset-0 -z-20 h-full w-full object-cover"
        src={BG_VIDEO}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        aria-hidden="true"
      />
      <div className="pointer-events-none fixed inset-0 -z-10 bg-gradient-to-r from-[#17312f]/70 via-[#17312f]/35 to-[#17312f]/55" />

      <main className="relative z-10 mx-auto grid min-h-screen w-full max-w-[1600px] items-center gap-8 px-5 py-8 sm:px-9 sm:py-12 lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-12 lg:px-12 xl:px-16">
        <motion.section initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }} className="flex flex-col justify-between gap-10 text-white lg:min-h-[620px] lg:py-8">
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.45 }}>
            <BrandMark size={96} />
          </motion.div>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.24, duration: 0.55, ease: [0.22, 1, 0.36, 1] }} className="max-w-xl">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/75">A more thoughtful stay</p>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-[64px]">Smarter Stays.<br />Happier Guests.</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-white/85 sm:text-lg">The little details make the whole experience. Staylix helps your team make every one count.</p>
          </motion.div>
        </motion.section>

        <motion.section initial={{ opacity: 0, y: 24, scale: 0.985 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ delay: 0.16, duration: 0.62, ease: [0.22, 1, 0.36, 1] }} className="mx-auto w-full max-w-[440px] rounded-[28px] border border-white/50 bg-ivory/95 p-6 shadow-float backdrop-blur-md sm:p-8">
          <AnimatePresence mode="wait" initial={false}>
            {isTransitioning ? (
              <motion.div key="signed-in" initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }} className="flex min-h-[360px] flex-col items-center justify-center text-center">
                <motion.div initial={{ scale: 0.72 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 220, damping: 16 }} className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-brand-600">
                  <BadgeCheck size={32} strokeWidth={1.7} />
                </motion.div>
                <p className="eyebrow">Sign-in complete</p>
                <h2 className="mt-2 text-2xl font-semibold text-ink-900">Welcome to Staylix</h2>
                <p className="mt-2 text-sm text-ink-700/65">Opening your resort workspace</p>
                <LoaderCircle size={20} className="mt-6 animate-spin text-brand-600" aria-label="Loading workspace" />
              </motion.div>
            ) : (
              <motion.div key="login-form" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10, scale: 0.99 }} transition={{ duration: 0.26, ease: 'easeOut' }}>
          <div className="mb-8 flex items-center justify-between gap-4">
            <BrandMark size={96} />
            <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-700/50">Resort workspace</span>
          </div>
          <h2 className="text-3xl font-semibold tracking-normal text-ink-900">Welcome back</h2>
          <p className="mt-2 text-sm text-ink-700/70">Sign in to your Staylix account</p>

          <div className="mt-7 flex gap-1 rounded-xl border border-sand/70 bg-white/70 p-1">
            <button
              type="button"
              onClick={() => { setMode('staff'); setError(''); }}
              className={`min-h-10 flex-1 rounded-lg px-3 text-sm font-semibold transition-colors ${mode === 'staff' ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-700/65 hover:text-ink-900'}`}
            >
              Manager / Staff
            </button>
            <button
              type="button"
              onClick={() => { setMode('guest'); setError(''); }}
              className={`min-h-10 flex-1 rounded-lg px-3 text-sm font-semibold transition-colors ${mode === 'guest' ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-700/65 hover:text-ink-900'}`}
            >
              Guest
            </button>
          </div>

          {error && <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-4 rounded-xl border border-coral/20 bg-[#fbf0ed] px-3 py-2.5 text-sm text-[#a84f3b]">{error}</motion.div>}

          {mode === 'staff' ? (
            <form onSubmit={handleStaffSubmit} className="mt-6 space-y-4">
              <div>
                <label className="label">Email address</label>
                <div className="relative">
                  {!form.email && <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-700/45" aria-hidden="true" />}
                  <input type="email" required className={`input-field ${form.email ? 'pl-4' : 'pl-11'}`}
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Password</label>
                <div className="relative">
                  {!form.password && <LockKeyhole size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-700/45" aria-hidden="true" />}
                  <input type={showPassword ? 'text' : 'password'} required className={`input-field pr-12 ${form.password ? 'pl-4' : 'pl-11'}`}
                    value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-ink-700/55 hover:bg-ivory hover:text-ink-900"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                {loading ? 'Signing in...' : <>Sign in <ArrowRight size={16} /></>}
              </button>
            </form>
          ) : (
            <>
              <div className="mt-5 flex gap-1 rounded-xl border border-sand/70 bg-white/70 p-1">
                <button type="button" onClick={() => { setGuestAuthMode('login'); setOtpSent(false); setError(''); }} className={`min-h-9 flex-1 rounded-lg px-2 text-xs font-semibold ${guestAuthMode === 'login' ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-700/65'}`}>Sign in</button>
                <button type="button" onClick={() => { setGuestAuthMode('register'); setOtpSent(false); setError(''); }} className={`min-h-9 flex-1 rounded-lg px-2 text-xs font-semibold ${guestAuthMode === 'register' ? 'bg-white text-brand-700 shadow-sm' : 'text-ink-700/65'}`}>Register with email</button>
              </div>
              {guestAuthMode === 'register' ? (
                <form onSubmit={otpSent ? handleRegistrationVerify : handleRegistrationRequest} className="mt-6 space-y-4">
                  {!otpSent ? (
                    <>
                      <div><label className="label">Full name</label><input required className="input-field" value={registration.name} onChange={(e) => setRegistration({ ...registration, name: e.target.value })} /></div>
                      <div><label className="label">Gmail address</label><input required type="email" className="input-field" value={registration.email} onChange={(e) => setRegistration({ ...registration, email: e.target.value })} /></div>
                      <div><label className="label">Phone number</label><input required type="tel" className="input-field" value={registration.phone} onChange={(e) => setRegistration({ ...registration, phone: e.target.value })} /></div>
                      <button type="submit" disabled={loading} className="btn-primary w-full py-3">{loading ? 'Sending code...' : 'Send email OTP'}</button>
                    </>
                  ) : (
                    <>
                      <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-700">Verification code sent to {registration.email}</p>
                      <div><label className="label">6-digit OTP</label><input required inputMode="numeric" maxLength={6} className="input-field text-center text-xl tracking-[0.35em]" value={registration.otp} onChange={(e) => setRegistration({ ...registration, otp: e.target.value.replace(/\D/g, '') })} /></div>
                      <button type="submit" disabled={loading || registration.otp.length !== 6} className="btn-primary w-full py-3">{loading ? 'Verifying...' : 'Verify and register'}</button>
                      <button type="button" onClick={() => setOtpSent(false)} className="w-full text-xs font-semibold text-brand-700">Change email</button>
                    </>
                  )}
                </form>
              ) : (
              <>
              <p className="mt-5 text-sm text-ink-700/70">
                {roomId ? 'Enter the phone number used at check-in for this room' : 'Enter the phone number used at check-in'}
              </p>
              <form onSubmit={handleGuestSubmit} className="mt-6 space-y-4">
                <div>
                  <label className="label">Phone number</label>
                  <div className="relative"><Phone size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-700/45" /><input type="tel" required className="input-field pl-11"
                    value={phone} onChange={(e) => setPhone(e.target.value)} />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full py-3">
                  {loading ? 'Signing in...' : <>Sign in <ArrowRight size={16} /></>}
                </button>
              </form>
              <p className="mt-4 text-center text-xs leading-5 text-ink-700/50">
                Only works while checked in. Not checked in yet? Ask the front desk to check you in.
              </p>
              </>
              )}
            </>
          )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.section>
      </main>
    </div>
  );
}