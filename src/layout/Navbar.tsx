import { User, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
    onMenuToggle?: () => void;
}

const Navbar = ({ onMenuToggle }: NavbarProps) => {
    const { admin } = useAuth();
    const isMobile = window.innerWidth < 768;

    return (
        <nav style={{
            height: '64px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 var(--spacing-6)',
            background: 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid var(--border-color)',
            position: 'sticky',
            top: 0,
            zIndex: 10,
            gap: '12px',
        }}>
            {/* Hamburger — mobile only */}
            {isMobile && (
                <button
                    onClick={onMenuToggle}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--text-primary)', display: 'flex',
                        alignItems: 'center', padding: '6px', borderRadius: '8px',
                        flexShrink: 0,
                    }}
                >
                    <Menu size={22} />
                </button>
            )}

            <div style={{ flex: 1 }} />

            {/* Admin info */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)',
                background: 'var(--glass-bg)', padding: '6px 14px 6px 8px',
                borderRadius: '50px', border: '1px solid var(--border-color)',
                flexShrink: 0,
            }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '50%',
                    background: 'var(--accent-gradient)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                    <User size={16} color="white" />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2, whiteSpace: 'nowrap' }}>{admin?.name || 'Admin'}</span>
                    <span style={{ fontSize: '0.65rem', color: admin?.role === 'super_admin' ? 'var(--accent-primary)' : 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {admin?.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                    </span>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
