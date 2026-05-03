import {
    LayoutDashboard, Calendar, Users, Settings, LogOut,
    TrendingUp, MapPin, MessageSquare, History, Globe, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
    currentView: string;
    onViewChange: (view: any) => void;
    collapsed?: boolean;
    onToggle?: () => void;
}

const SidebarItem = ({ icon: Icon, label, active = false, onClick }: { icon: any; label: string; active?: boolean; onClick?: () => void }) => (
    <div
        onClick={onClick}
        style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '10px 14px',
            borderRadius: '10px',
            color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
            background: active ? 'rgba(37,99,235,0.07)' : 'transparent',
            borderLeft: active ? '3px solid var(--accent-primary)' : '3px solid transparent',
            cursor: 'pointer',
            transition: 'all 0.18s ease',
            fontWeight: active ? 700 : 500,
        }}
        onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; e.currentTarget.style.color = 'var(--text-primary)'; } }}
        onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
    >
        <Icon
            size={19}
            strokeWidth={active ? 2.5 : 2}
            style={{ flexShrink: 0, opacity: 1 }}
        />
        <span style={{ fontSize: '0.875rem', letterSpacing: '-0.01em' }}>{label}</span>
    </div>
);

const Sidebar = ({ currentView, onViewChange }: SidebarProps) => {
    const { admin, logout } = useAuth();

    return (
        <div style={{
            width: '240px',
            height: '100vh',
            background: 'var(--bg-secondary)',
            borderRight: '1px solid var(--border-color)',
            padding: '28px 12px',
            display: 'flex',
            flexDirection: 'column',
            position: 'fixed',
            top: 0, left: 0,
            zIndex: 100,
            overflowY: 'auto',
        }}>
            {/* Logo */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', paddingLeft: '10px' }}>
                <img src="/be.png" alt="happenbe" style={{ width: '28px', height: '28px', borderRadius: '7px', objectFit: 'contain' }} />
                <h2 style={{ fontSize: '0.95rem', fontWeight: 800, letterSpacing: '-0.3px', margin: 0 }}>
                    <span style={{ color: 'var(--text-primary)' }}>happenbe</span>
                    <span style={{ color: 'var(--accent-primary)' }}>.admin</span>
                </h2>
            </div>

            {/* Main nav */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                <SidebarItem icon={LayoutDashboard} label="Dashboard"    active={currentView === 'dashboard'}    onClick={() => onViewChange('dashboard')} />
                <SidebarItem icon={Calendar}        label="Events"        active={currentView === 'events'}        onClick={() => onViewChange('events')} />
                <SidebarItem icon={Users}           label="Organizers"    active={currentView === 'organizers'}    onClick={() => onViewChange('organizers')} />
                <SidebarItem icon={MapPin}          label="Venues"        active={currentView === 'venues'}        onClick={() => onViewChange('venues')} />
                <SidebarItem icon={MessageSquare}   label="Queries"       active={currentView === 'queries'}       onClick={() => onViewChange('queries')} />
                <SidebarItem icon={Globe}           label="City Requests" active={currentView === 'city-requests'} onClick={() => onViewChange('city-requests')} />
                <SidebarItem icon={History}         label="Past Events"   active={currentView === 'past-events'}   onClick={() => onViewChange('past-events')} />
                <SidebarItem icon={TrendingUp}      label="Analytics"     active={currentView === 'analytics'}     onClick={() => onViewChange('analytics')} />
            </div>

            {/* Bottom nav */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {admin?.role === 'super_admin' && (
                    <SidebarItem icon={ShieldCheck} label="Team"     active={currentView === 'team'}     onClick={() => onViewChange('team')} />
                )}
                <SidebarItem icon={Settings} label="Settings" active={currentView === 'settings'} onClick={() => onViewChange('settings')} />
                <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
                    <SidebarItem icon={LogOut} label="Log Out" onClick={() => { if (window.confirm('Are you sure you want to sign out?')) logout(); }} />
                </div>
            </div>
        </div>
    );
};

export default Sidebar;
