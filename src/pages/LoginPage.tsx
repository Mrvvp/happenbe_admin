import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 768);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
        } catch (err: any) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ width: '100vw', height: '100vh', display: 'flex', background: 'var(--bg-primary)', overflow: 'hidden', position: 'fixed', inset: 0 }}>

            {/* ── Left panel — hidden on mobile ─────────────── */}
            {!isMobile && (
                <div style={{
                    flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                    padding: '52px 64px', background: 'linear-gradient(160deg, #0a0f1e 0%, #111827 55%, #0d1a2e 100%)',
                    position: 'relative', overflow: 'hidden',
                }}>
                    {/* Decorative blobs */}
                    <div style={{ position: 'absolute', width: '500px', height: '500px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.18) 0%, transparent 70%)', top: '-120px', left: '-120px', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', width: '380px', height: '380px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 70%)', bottom: '60px', right: '-80px', pointerEvents: 'none' }} />
                    <div style={{ position: 'absolute', width: '200px', height: '200px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(229,90,43,0.08) 0%, transparent 70%)', bottom: '200px', left: '40px', pointerEvents: 'none' }} />

                    {/* Logo top-left */}
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <img src="/logo.png" alt="happenbe" style={{ height: '38px', width: 'auto', display: 'block' }} />
                    </div>

                    {/* Center content */}
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '5px 14px', borderRadius: '20px', background: 'rgba(229,90,43,0.12)', border: '1px solid rgba(229,90,43,0.25)', marginBottom: '32px' }}>
                            <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#E55A2B', boxShadow: '0 0 8px rgba(229,90,43,0.8)', animation: 'pulse 2s infinite' }} />
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Admin Console</span>
                        </div>

                        <h1 style={{ fontSize: '3.2rem', fontWeight: 900, color: '#fff', lineHeight: 1.1, margin: '0 0 22px', letterSpacing: '-0.05em' }}>
                            Your city's<br />
                            <span style={{ background: 'linear-gradient(135deg, #E55A2B 0%, #f97316 50%, #fb923c 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                cultural map.
                            </span>
                        </h1>

                        <p style={{ fontSize: '1.05rem', color: 'rgba(255,255,255,0.4)', lineHeight: 1.75, margin: '0 0 48px', maxWidth: '360px', fontWeight: 400 }}>
                            Curate, verify, and amplify the best events happening across the city — all from one place.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                            {[
                                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>, label: 'Discover & list local events', color: '#3b82f6' },
                                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.5 12.5c0-1.58-.875-2.95-2.148-3.6.154-.435.238-.905.238-1.4 0-2.21-1.71-3.998-3.818-3.998-.47 0-.92.084-1.336.25C14.818 2.415 13.51 1.5 12 1.5s-2.816.917-3.437 2.25c-.415-.165-.866-.25-1.336-.25-2.11 0-3.818 1.79-3.818 4 0 .494.083.964.237 1.4-1.272.65-2.147 2.018-2.147 3.6 0 1.495.782 2.798 1.942 3.486-.02.17-.032.34-.032.514 0 2.21 1.708 4 3.818 4 .47 0 .92-.086 1.335-.25.62 1.334 1.926 2.25 3.437 2.25 1.512 0 2.818-.916 3.437-2.25.415.163.865.248 1.336.248 2.11 0 3.818-1.79 3.818-4 0-.174-.012-.344-.033-.513 1.158-.687 1.943-1.99 1.943-3.484z" fill="#58AEED" stroke="none"/><path d="M10.884 16.834l-4.334-4.334a.75.75 0 011.06-1.06l3.274 3.274 5.274-5.274a.75.75 0 011.06 1.06l-5.834 5.834z" fill="white" stroke="none"/></svg>, label: 'Verify organizers & approve claims', color: '#58AEED' },
                                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>, label: 'Track views, RSVPs and engagement', color: '#10b981' },
                                { icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label: 'Manage your admin team', color: '#a78bfa' },
                            ].map((f, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                    <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: `${f.color}18`, border: `1px solid ${f.color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color, flexShrink: 0 }}>
                                        {f.icon}
                                    </div>
                                    <span style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.6)', fontWeight: 500, letterSpacing: '-0.01em' }}>{f.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <p style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.18)', margin: 0, position: 'relative', zIndex: 1, fontWeight: 500 }}>
                        © {new Date().getFullYear()} happenbe · Authorised access only
                    </p>
                </div>
            )}

            {/* ── Right panel — Login form ─────────────────── */}
            <div style={{
                flex: isMobile ? 'unset' : 1,
                width: isMobile ? '100%' : 'auto',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: isMobile ? '40px 24px' : '48px 40px',
                background: isMobile
                    ? 'linear-gradient(160deg, #0a0f1e 0%, #111827 55%, #0d1a2e 100%)'
                    : 'var(--bg-secondary)',
                borderLeft: isMobile ? 'none' : '1px solid var(--border-color)',
                overflowY: 'auto',
            }}>
                {/* Mobile-only logo */}
                {isMobile && (
                    <div style={{ marginBottom: '40px', textAlign: 'center' }}>
                        <img src="/logo.png" alt="happenbe" style={{ height: '36px', width: 'auto', display: 'block', margin: '0 auto 16px' }} />
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '4px 12px', borderRadius: '20px', background: 'rgba(229,90,43,0.12)', border: '1px solid rgba(229,90,43,0.25)' }}>
                            <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#E55A2B', boxShadow: '0 0 6px rgba(229,90,43,0.8)' }} />
                            <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#f97316', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Admin Console</span>
                        </div>
                    </div>
                )}

                <div style={{ width: '100%', maxWidth: '360px' }}>
                    <div style={{ marginBottom: '32px' }}>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: isMobile ? '#fff' : 'var(--text-primary)', margin: '0 0 8px', letterSpacing: '-0.03em' }}>
                            Sign in
                        </h2>
                        <p style={{ color: isMobile ? 'rgba(255,255,255,0.4)' : 'var(--text-muted)', fontSize: '0.88rem', margin: 0 }}>
                            Enter your credentials to access the dashboard.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: isMobile ? 'rgba(255,255,255,0.5)' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                                Email
                            </label>
                            <input
                                type="email" value={email} onChange={e => setEmail(e.target.value)}
                                placeholder="admin@happenbe.com" required autoFocus
                                style={{
                                    width: '100%', boxSizing: 'border-box', padding: '13px 16px',
                                    borderRadius: '12px', border: `1.5px solid ${isMobile ? 'rgba(255,255,255,0.1)' : 'var(--border-color)'}`,
                                    background: isMobile ? 'rgba(255,255,255,0.06)' : 'var(--bg-tertiary)',
                                    color: isMobile ? '#fff' : 'var(--text-primary)',
                                    fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s'
                                }}
                                onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                                onBlur={e => e.target.style.borderColor = isMobile ? 'rgba(255,255,255,0.1)' : 'var(--border-color)'}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: isMobile ? 'rgba(255,255,255,0.5)' : 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>
                                Password
                            </label>
                            <input
                                type="password" value={password} onChange={e => setPassword(e.target.value)}
                                placeholder="••••••••" required
                                style={{
                                    width: '100%', boxSizing: 'border-box', padding: '13px 16px',
                                    borderRadius: '12px', border: `1.5px solid ${isMobile ? 'rgba(255,255,255,0.1)' : 'var(--border-color)'}`,
                                    background: isMobile ? 'rgba(255,255,255,0.06)' : 'var(--bg-tertiary)',
                                    color: isMobile ? '#fff' : 'var(--text-primary)',
                                    fontSize: '0.95rem', outline: 'none', fontFamily: 'inherit', transition: 'border-color 0.2s'
                                }}
                                onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                                onBlur={e => e.target.style.borderColor = isMobile ? 'rgba(255,255,255,0.1)' : 'var(--border-color)'}
                            />
                        </div>

                        {error && (
                            <div style={{ padding: '11px 14px', borderRadius: '10px', background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)', color: '#f87171', fontSize: '0.85rem', fontWeight: 600 }}>
                                {error}
                            </div>
                        )}

                        <button
                            type="submit" disabled={loading}
                            style={{
                                width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
                                background: loading ? 'rgba(255,255,255,0.08)' : 'var(--accent-gradient)',
                                color: loading ? 'rgba(255,255,255,0.4)' : '#fff',
                                fontWeight: 700, fontSize: '0.95rem', cursor: loading ? 'not-allowed' : 'pointer',
                                fontFamily: 'inherit', marginTop: '4px', transition: 'all 0.2s',
                                boxShadow: loading ? 'none' : '0 8px 20px rgba(37,99,235,0.25)'
                            }}
                        >
                            {loading ? 'Signing in...' : 'Sign In →'}
                        </button>
                    </form>

                    <p style={{ fontSize: '0.78rem', color: isMobile ? 'rgba(255,255,255,0.25)' : 'var(--text-muted)', textAlign: 'center', marginTop: '28px' }}>
                        Access is restricted to authorised admins only.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
