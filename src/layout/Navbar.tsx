import { User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { admin } = useAuth();

    return (
        <nav style={{
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 var(--spacing-8)',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border-color)',
            position: 'sticky',
            top: 0,
            zIndex: 10
        }}>
            <div style={{ flex: 1 }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-4)' }}>
                {/* Admin info */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)',
                    background: 'var(--glass-bg)', padding: '6px 14px 6px 8px',
                    borderRadius: '50px', border: '1px solid var(--border-color)',
                }}>
                    <div style={{
                        width: '34px', height: '34px', borderRadius: '50%',
                        background: 'var(--accent-gradient)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                    }}>
                        <User size={18} color="white" />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{admin?.name || 'Admin'}</span>
                        <span style={{ fontSize: '0.68rem', color: admin?.role === 'super_admin' ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                        </span>
                    </div>
                </div>

            </div>
        </nav>
    );
};

export default Navbar;
