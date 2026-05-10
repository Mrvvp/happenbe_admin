import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid, Legend } from 'recharts';
import Sidebar from './layout/Sidebar';
import Navbar from './layout/Navbar';
import DashboardCard from './components/DashboardCard';
import CreateEventModal from './components/CreateEventModal';
import ViewRequestModal from './components/ViewRequestModal';
import LoginPage from './pages/LoginPage';
import { useAuth } from './context/AuthContext';
import {
    Calendar,
    Users,
    FileCheck,
    Eye,
    Check,
    X,
    RefreshCw,
    Plus,
    Pencil,
    Trash2,
    CalendarDays,
    Search
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api/admin';
const BACKEND_URL = 'http://localhost:5000';

const StatusBadge = ({ status }: { status: 'approved' | 'pending' | 'rejected' }) => {
  const styles = {
    approved: { bg: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)', text: 'Approved' },
    pending: { bg: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', text: 'Pending' },
    rejected: { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', text: 'Rejected' },
  };

  const { bg, color, text } = (styles[status] || styles.pending);

  return (
    <span style={{
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '0.75rem',
      fontWeight: 600,
      background: bg,
      color: color,
      textTransform: 'uppercase',
      letterSpacing: '0.02em'
    }}>
      {text}
    </span>
  );
};

const RequestTypeBadge = ({ type }: { type: RequestData['type'] }) => {
  const styles = {
    creation: { bg: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)', text: 'Creation' },
    claim: { bg: 'rgba(236, 72, 153, 0.1)', color: 'var(--accent-secondary)', text: 'Claim' },
    edit: { bg: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', text: 'Edit' },
    remove: { bg: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', text: 'Removal' },
  };

  const currentStyle = styles[type as keyof typeof styles] || styles.creation;

  return (
    <span style={{
      padding: '4px 10px',
      borderRadius: '6px',
      fontSize: '0.7rem',
      fontWeight: 600,
      background: currentStyle.bg,
      color: currentStyle.color,
      border: `1px solid ${currentStyle.color}20`
    }}>
      {currentStyle.text}
    </span>
  );
};

interface RequestData {
  id: string;
  event: string;
  organizer: string;
  date: string;
  status: 'pending' | 'approved' | 'rejected';
  type: 'creation' | 'claim' | 'edit' | 'remove';
  image?: string;
  logoUrl?: string;
}

const App = () => {
  const { admin, token, loading: authLoading } = useAuth();

  if (authLoading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
      <div className="refresh-spinner" style={{ width: '32px', height: '32px', border: '3px solid var(--border-color)', borderTopColor: 'var(--accent-primary)', borderRadius: '50%' }} />
    </div>
  );
  if (!admin) return <LoginPage />;

  // Attach auth token to all fetch calls
  const authFetch = (url: string, options: RequestInit = {}) =>
    fetch(url, { ...options, headers: { ...options.headers, Authorization: `Bearer ${token}` } });

  const [requests, setRequests] = useState<RequestData[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeOrganizers: 0,
    pendingRequests: 0,
    totalViews: 0
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<{ id: string, type: any } | null>(null);
  const [activeTab, setActiveTab] = useState<'creation' | 'claim' | 'edit' | 'remove'>('creation');
  const [currentView, setCurrentView] = useState<'dashboard' | 'events' | 'organizers' | 'venues' | 'queries' | 'past-events' | 'city-requests' | 'analytics' | 'team' | 'settings'>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Data for additional views
  const [allEvents, setAllEvents] = useState<any[]>([]);
  const [organizersList, setOrganizersList] = useState<any[]>([]);
  const [venuesList, setVenuesList] = useState<any[]>([]);
  const [queriesList, setQueriesList] = useState<any[]>([]);
  const [pastEventsList, setPastEventsList] = useState<any[]>([]);
  const [cityRequestsList, setCityRequestsList] = useState<any[]>([]);
  const [activities, setActivities] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  const fetchDashboardData = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const [statsRes, reqRes, actRes] = await Promise.all([
        authFetch(`${API_BASE}/stats`),
        authFetch(`${API_BASE}/requests`),
        authFetch(`${API_BASE}/activity`)
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats({
          totalEvents: statsData.totalEvents || 0,
          activeOrganizers: statsData.activeOrganizers || 0,
          pendingRequests: (statsData.pendingEvents || 0) + (statsData.pendingClaims || 0) + (statsData.pendingEdits || 0),
          totalViews: statsData.totalViews || 0
        });
      }

      if (reqRes.ok) {
        const requestsData = await reqRes.json();
        setRequests(Array.isArray(requestsData) ? requestsData : []);
      }

      if (actRes.ok) {
        const actData = await actRes.json();
        setActivities(Array.isArray(actData) ? actData : []);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      if (isManual) setRefreshing(false);
      setLoading(false);
    }
  };

  const fetchViewData = async (view: string) => {
    setLoading(true);
    try {
      if (view === 'city-requests') {
        const res = await authFetch(`${BACKEND_URL}/api/city-requests`);
        if (res.ok) {
          const data = await res.json();
          setCityRequestsList(Array.isArray(data) ? data : []);
        }
        setLoading(false);
        return;
      }

      let endpoint = '';
      if (view === 'events') endpoint = 'events-all';
      else if (view === 'organizers') endpoint = 'organizers-list';
      else if (view === 'venues') endpoint = 'venues-list';
      else if (view === 'queries') endpoint = 'queries';
      else if (view === 'past-events') endpoint = 'past-events';

      if (!endpoint) { setLoading(false); return; }

      const res = await authFetch(`${API_BASE}/${endpoint}`);
      
      if (!res.ok) {
        console.error(`API returned ${res.status} for ${endpoint}`);
        if (view === 'events') setAllEvents([]);
        else if (view === 'organizers') setOrganizersList([]);
        else if (view === 'venues') setVenuesList([]);
        setLoading(false);
        return;
      }

      const data = await res.json();
      const safeData = Array.isArray(data) ? data : [];
      
      if (view === 'events') setAllEvents(safeData);
      else if (view === 'organizers') setOrganizersList(safeData);
      else if (view === 'venues') setVenuesList(safeData);
      else if (view === 'queries') setQueriesList(safeData);
      else if (view === 'past-events') setPastEventsList(safeData);
    } catch (error) {
      console.error(`Error fetching ${view} data:`, error);
      if (view === 'events') setAllEvents([]);
      else if (view === 'organizers') setOrganizersList([]);
      else if (view === 'venues') setVenuesList([]);
      else if (view === 'queries') setQueriesList([]);
      else if (view === 'past-events') setPastEventsList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setSearchTerm('');
    if (currentView === 'dashboard') {
      fetchDashboardData();
    } else if (currentView === 'team') {
      fetchTeam();
    } else if ((currentView as string) === 'analytics') {
      setLoading(true);
      authFetch(`${API_BASE}/analytics`).then(r => r.json()).then(d => setAnalyticsData(d)).finally(() => setLoading(false));
    } else {
      fetchViewData(currentView);
    }
  }, [currentView]);

  const handleAction = async (id: string, type: RequestData['type'], action: 'approved' | 'rejected') => {
    const actionLabel = action === 'approved' ? 'approve' : (type === 'creation' && allEvents.find(e => e._id === id)?.status === 'approved' ? 'remove' : 'reject');
    const confirmed = window.confirm(`Are you sure you want to ${actionLabel} this ${type === 'creation' ? 'event' : type}?`);
    if (!confirmed) return;

    try {
      let endpoint = '';
      if (type === 'creation') endpoint = `events/${id}`;
      else if (type === 'claim') endpoint = `claims/${id}`;
      else if (type === 'edit') endpoint = `edit-requests/${id}`;
      else if (type === 'remove') endpoint = `removals/${id}`;

      const res = await authFetch(`${API_BASE}/${endpoint}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: action })
      });

      if (res.ok) {
        // Remove immediately from local state so it disappears right away
        setRequests(prev => prev.filter(r => r.id !== id));
        // Then refresh all data from server
        fetchDashboardData();
      } else {
        const err = await res.json().catch(() => ({}));
        alert(`Action failed: ${err.message || res.statusText}`);
      }
    } catch (error) {
      console.error('Action failed:', error);
      alert('Action failed. Check server connection.');
    }
  };

  const formatViews = (val: number) => {
    if (val >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toString();
  };

  const getTimeAgo = (date: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const renderDashboard = () => (
    <>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)',
        gap: 'var(--spacing-4)',
        marginBottom: 'var(--spacing-6)'
      }}>
        <DashboardCard
          title="Total Events"
          value={stats.totalEvents}
          icon={Calendar}
          trend="+12%"
          trendDirection="up"
          accentColor="#3b82f6"
        />
        <DashboardCard
          title="Active Organizers"
          value={stats.activeOrganizers}
          icon={Users}
          trend="+5%"
          trendDirection="up"
          accentColor="#ec4899"
        />
        <DashboardCard
          title="Pending Requests"
          value={stats.pendingRequests}
          icon={FileCheck}
          trend="-2%"
          trendDirection="down"
          accentColor="#f59e0b"
        />
        <DashboardCard
          title="Total Views"
          value={formatViews(stats.totalViews)}
          icon={Eye}
          trend="+18%"
          trendDirection="up"
          accentColor="#10b981"
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 340px',
        gap: 'var(--spacing-6)'
      }}>
        {/* Recent Requests Table */}
        <div className="glass-card list-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: isMobile ? '16px' : 'var(--spacing-6)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {/* Row 1: Title + Refresh */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Pending Requests</h3>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '4px 0 0' }}>Manage and review all system requests.</p>
              </div>
              <button
                onClick={() => fetchDashboardData(true)}
                disabled={refreshing}
                style={{
                  color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 700,
                  display: 'flex', alignItems: 'center', gap: '6px',
                  background: 'none', border: 'none', cursor: 'pointer',
                  opacity: refreshing ? 0.6 : 1, transition: '0.2s', paddingTop: '2px'
                }}
              >
                <RefreshCw size={15} style={{ animation: refreshing ? 'spin 1.5s linear infinite' : 'none' }} />
                {refreshing ? 'Syncing...' : 'Refresh'}
              </button>
            </div>

            {/* Row 2: Tabs + Search */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{
                display: 'flex', background: 'var(--bg-tertiary)',
                padding: '4px', borderRadius: '12px', border: '1px solid var(--border-color)',
                width: '100%'
              }}>
                {[
                  { id: 'creation', label: 'Events', icon: CalendarDays },
                  { id: 'claim', label: 'Claims', icon: Users },
                  { id: 'edit', label: 'Edits', icon: Pencil },
                  { id: 'remove', label: 'Removals', icon: Trash2 }
                ].map((tab) => {
                  const count = requests.filter(r => r.type === tab.id).length;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveTab(tab.id as any); fetchDashboardData(true); }}
                      style={{
                        flex: 1, padding: isMobile ? '6px 4px' : '6px 16px',
                        borderRadius: '8px', fontSize: isMobile ? '0.72rem' : '0.8125rem', fontWeight: 600,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: isMobile ? '3px' : '6px', transition: '0.2s',
                        background: isActive ? 'var(--bg-secondary)' : 'transparent',
                        color: isActive ? 'var(--accent-primary)' : 'var(--text-secondary)',
                        border: isActive ? '1px solid var(--border-color)' : '1px solid transparent',
                        cursor: 'pointer', boxShadow: isActive ? 'var(--shadow-sm)' : 'none',
                        whiteSpace: 'nowrap'
                      }}
                    >
                      <tab.icon size={13} className={refreshing && isActive ? 'refresh-spinner' : ''} />
                      {isMobile ? tab.label.replace('Removals', 'Remove') : tab.label}
                      {count > 0 && (
                        <span style={{
                          minWidth: '15px', height: '15px', borderRadius: '999px',
                          background: isActive ? 'var(--accent-primary)' : 'rgba(239,68,68,0.85)',
                          color: '#fff', fontSize: '0.58rem', fontWeight: 800,
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          padding: '0 4px', lineHeight: 1
                        }}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="search-box" style={{ width: '100%' }}>
                <Search size={15} color="var(--text-muted)" />
                <input
                  type="text"
                  placeholder="Search requests..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Event</th>
                  <th className="hide-mobile" style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Type</th>
                  <th className="hide-mobile" style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Organizer</th>
                  <th className="hide-mobile" style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Status</th>
                  <th style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading requests...</td></tr>
                ) : (Array.isArray(requests) ? requests : []).filter(r => r.type === activeTab && (
                    (r.event || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
                    (r.organizer || '').toLowerCase().includes((searchTerm || '').toLowerCase())
                  )).length === 0 ? (
                  <tr><td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <div style={{ padding: '16px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.02)', color: 'var(--text-muted)' }}>
                        <FileCheck size={32} opacity={0.5} />
                      </div>
                      <p>{searchTerm ? 'No results matching your search.' : `No pending ${activeTab} requests found.`}</p>
                    </div>
                  </td></tr>
                ) : (Array.isArray(requests) ? requests : []).filter(r => r.type === activeTab && (
                    (r.event || '').toLowerCase().includes((searchTerm || '').toLowerCase()) || 
                    (r.organizer || '').toLowerCase().includes((searchTerm || '').toLowerCase())
                  )).map((request) => (
                  <tr
                    key={`${request.type}-${request.id}`}
                    onClick={() => {
                      setSelectedRequest({ id: request.id, type: request.type });
                      setIsViewModalOpen(true);
                    }}
                    style={{ borderBottom: '1px solid var(--border-color)', transition: '0.2s ease', cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px', fontSize: '0.875rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '40px', height: '40px', minWidth: '40px', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
                        <img 
                          src={request.image ? (request.image.startsWith('http') ? request.image : `${BACKEND_URL}${request.image.startsWith('/') ? '' : '/'}${request.image}`) : (request.type === 'claim' ? (request.logoUrl && typeof request.logoUrl === 'string' && request.logoUrl.startsWith('http') ? request.logoUrl : `${BACKEND_URL}${request.logoUrl || ''}`) : 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=100')} 
                          style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} 
                          alt={request.event || 'Request'}
                        />
                      </div>
                      {request.event || 'Unnamed Event'}
                    </td>
                    <td className="hide-mobile" style={{ padding: '12px 16px' }}>
                      <RequestTypeBadge type={request.type} />
                    </td>
                    <td className="hide-mobile" style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{request.organizer}</td>
                    <td className="hide-mobile" style={{ padding: '12px 16px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{new Date(request.date).toLocaleDateString()}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <StatusBadge status={request.status} />
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: 'var(--spacing-2)' }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(request.id, request.type, 'approved');
                          }}
                          title="Approve"
                          style={{ width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(5, 150, 105, 0.1)', color: 'var(--success)', cursor: 'pointer' }}
                        >
                          <Check size={18} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(request.id, request.type, 'rejected');
                          }}
                          title="Reject"
                          style={{ width: '36px', height: '36px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(220, 38, 38, 0.1)', color: 'var(--error)', cursor: 'pointer' }}
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Activity Stream */}
        <div className="glass-card">
          <h3 style={{ fontSize: '1.25rem', marginBottom: 'var(--spacing-6)' }}>Recent Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
            {activities.length === 0 ? (
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '20px' }}>No recent activity.</p>
            ) : activities.map((activity, i) => (
              <div key={activity.id || i} style={{ display: 'flex', gap: 'var(--spacing-4)' }}>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '50%',
                    background: activity.type === 'claim' ? 'rgba(236, 72, 153, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2,
                    position: 'relative',
                    color: activity.type === 'claim' ? '#ec4899' : '#3b82f6'
                  }}>
                    {activity.type === 'claim' ? <Users size={16} /> : <Calendar size={16} />}
                  </div>
                  {i !== activities.length - 1 && <div style={{
                    position: 'absolute',
                    top: '32px',
                    left: '16px',
                    width: '1px',
                    height: 'calc(100% + var(--spacing-6))',
                    background: 'var(--border-color)',
                    zIndex: 1
                  }} />}
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, display: 'flex', justifyContent: 'space-between' }}>
                    {activity.title}
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 400 }}>{getTimeAgo(activity.timestamp)}</span>
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {activity.description} by <span style={{ fontWeight: 600 }}>{activity.organizer}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );

  const renderEventsView = () => (
    <div className="glass-card list-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="section-header">
        <div>
          <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Full Events Directory</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '4px 0 0' }}>Browse and manage all approved events on the platform.</p>
        </div>
        <div className="search-box">
          <Search size={15} color="var(--text-muted)" />
          <input type="text" placeholder="Search events..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>
      {isMobile ? (
        /* Mobile: card list */
        <div>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading events...</div>
          ) : allEvents.filter(e =>
              (e.title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (e.city?.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (e.organizer?.organizerName?.toLowerCase().includes(searchTerm.toLowerCase()))
            ).length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
              {searchTerm ? 'No matches found.' : 'No events found.'}
            </div>
          ) : allEvents.filter(e =>
              (e.title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (e.city?.toLowerCase().includes(searchTerm.toLowerCase())) ||
              (e.organizer?.organizerName?.toLowerCase().includes(searchTerm.toLowerCase()))
            ).map((event) => (
            <div
              key={event._id}
              onClick={() => { setSelectedRequest({ id: event._id, type: 'creation' }); setIsViewModalOpen(true); }}
              style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ width: '38px', height: '38px', minWidth: '38px', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                <img src={event?.image?.startsWith('http') ? event.image : `${BACKEND_URL}${event?.image || '/placeholder.png'}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{event?.title || 'Unnamed Event'}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                  {event?.organizer?.organizerName || 'Unknown'}{event?.city ? ` · ${event.city}` : ''}
                </div>
              </div>
              <div style={{ flexShrink: 0 }}>
                <StatusBadge status={event?.status || 'pending'} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Desktop: table */
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', textAlign: 'left' }}>
                <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Event</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Organizer</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Category</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Location</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading events...</td></tr>
              ) : allEvents.filter(e =>
                  (e.title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                  (e.city?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                  (e.venue?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                  (e.organizer?.organizerName?.toLowerCase().includes(searchTerm.toLowerCase()))
                ).length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>{searchTerm ? 'No matches found.' : 'No events found.'}</td></tr>
              ) : allEvents.filter(e =>
                  (e.title?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                  (e.city?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                  (e.venue?.toLowerCase().includes(searchTerm.toLowerCase())) ||
                  (e.organizer?.organizerName?.toLowerCase().includes(searchTerm.toLowerCase()))
                ).map((event) => (
                <tr
                  key={event._id}
                  onClick={() => { setSelectedRequest({ id: event._id, type: 'creation' }); setIsViewModalOpen(true); }}
                  style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: '0.2s' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 20px', fontSize: '0.9rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '40px', height: '40px', minWidth: '40px', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-tertiary)' }}>
                      <img src={event?.image?.startsWith('http') ? event.image : `${BACKEND_URL}${event?.image || '/placeholder.png'}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>{event?.title || 'Unnamed Event'}</span>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{event?.organizer?.organizerName || 'Unknown'}</td>
                  <td style={{ padding: '14px 20px' }}><span style={{ padding: '4px 10px', borderRadius: '20px', background: 'rgba(0,0,0,0.05)', fontSize: '0.75rem' }}>{event?.category || 'General'}</span></td>
                  <td style={{ padding: '14px 20px', fontSize: '0.85rem' }}>{event?.venue || 'No Venue'}, {event?.city || 'No City'}</td>
                  <td style={{ padding: '14px 20px' }}><StatusBadge status={event?.status || 'pending'} /></td>
                  <td style={{ padding: '14px 20px' }}>
                    {event.status === 'pending' && (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={(e) => { e.stopPropagation(); handleAction(event._id, 'creation', 'approved'); }} style={{ width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(16,185,129,0.1)', color: 'var(--success)', border: 'none', cursor: 'pointer' }} title="Approve"><Check size={16} /></button>
                        <button onClick={(e) => { e.stopPropagation(); handleAction(event._id, 'creation', 'rejected'); }} style={{ width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.1)', color: 'var(--error)', border: 'none', cursor: 'pointer' }} title="Reject"><X size={16} /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderOrganizersView = () => {
    const filtered = organizersList.filter(o => o._id?.toLowerCase().includes(searchTerm.toLowerCase()));
    return (
    <div className="glass-card list-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="section-header">
        <div>
          <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Organizer Directory</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '4px 0 0' }}>Full list of hosts and their platform activity.</p>
        </div>
        <div className="search-box">
          <Search size={15} color="var(--text-muted)" />
          <input type="text" placeholder="Search organizers..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>
      {isMobile ? (
        <div>
          {loading ? <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
          : filtered.length === 0 ? <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>{searchTerm ? 'No matches.' : 'No organizers found.'}</div>
          : filtered.map((org, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ width: '44px', height: '44px', minWidth: '44px', borderRadius: '10px', overflow: 'hidden', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {org?.logo ? <img src={org.logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{org?._id || 'Unnamed'}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{org?.eventCount || 0} events</div>
              </div>
              <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '0.68rem', fontWeight: 700, background: org?.isVerified ? 'rgba(16,185,129,0.1)' : 'rgba(0,0,0,0.05)', color: org?.isVerified ? 'var(--success)' : 'var(--text-muted)', flexShrink: 0 }}>
                {org?.isVerified ? 'VERIFIED' : 'UNVERIFIED'}
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', textAlign: 'left' }}>
                <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Name</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Contact</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Website</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Events</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Verified</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading organizers...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>{searchTerm ? 'No matches.' : 'No organizers found.'}</td></tr>
              : filtered.map((org, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {org?.logo ? <img src={org.logo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                        : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>}
                      </div>
                      <div>
                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{org?._id || 'Unnamed'}</div>
                        {org?.bio && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{org.bio}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', fontSize: '0.85rem' }}>{org?.contact || 'N/A'}</td>
                  <td style={{ padding: '14px 20px', fontSize: '0.85rem' }}>{org?.website ? <a href={org.website} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary)' }}>Visit</a> : '-'}</td>
                  <td style={{ padding: '14px 20px', fontSize: '0.9rem', fontWeight: 700 }}>{org?.eventCount || 0}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ padding: '4px 8px', borderRadius: '4px', background: org?.isVerified ? 'rgba(16,185,129,0.1)' : 'rgba(0,0,0,0.05)', color: org?.isVerified ? 'var(--success)' : 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700 }}>
                      {org?.isVerified ? 'VERIFIED' : 'NO'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );};

  const renderVenuesView = () => {
    const filtered = venuesList.filter(v => v._id?.venue?.toLowerCase().includes(searchTerm.toLowerCase()) || v._id?.city?.toLowerCase().includes(searchTerm.toLowerCase()));
    return (
    <div className="glass-card list-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="section-header">
        <div>
          <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Venue Statistics</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '4px 0 0' }}>High-traffic locations and venue distribution.</p>
        </div>
        <div className="search-box">
          <Search size={15} color="var(--text-muted)" />
          <input type="text" placeholder="Search venues..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
      </div>
      {isMobile ? (
        <div>
          {loading ? <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
          : filtered.length === 0 ? <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>{searchTerm ? 'No matches.' : 'No venues found.'}</div>
          : filtered.map((v, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
              <div style={{ width: '40px', height: '40px', minWidth: '40px', borderRadius: '10px', background: 'rgba(37,99,235,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-primary)" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v?._id?.venue || 'Unnamed Venue'}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{v?._id?.city || 'Unknown City'}</div>
              </div>
              <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-primary)', flexShrink: 0 }}>{v?.eventCount || 0}</span>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', textAlign: 'left' }}>
                <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Venue Name</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>City</th>
                <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Total Events</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={3} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading venues...</td></tr>
              : filtered.length === 0 ? <tr><td colSpan={3} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>{searchTerm ? 'No matches.' : 'No venues found.'}</td></tr>
              : filtered.map((v, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '14px 20px', fontSize: '0.9rem', fontWeight: 600 }}>{v?._id?.venue || 'Unnamed Venue'}</td>
                  <td style={{ padding: '14px 20px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>{v?._id?.city || 'Unknown City'}</td>
                  <td style={{ padding: '14px 20px', fontSize: '1rem', fontWeight: 800, color: 'var(--accent-primary)' }}>{v?.eventCount || 0}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );};

  const markQueryRead = async (id: string) => {
    await authFetch(`${API_BASE}/queries/${id}/read`, { method: 'PATCH' });
    setQueriesList(prev => prev.map(q => q._id === id ? { ...q, status: 'read' } : q));
  };

  const renderQueriesView = () => {
    const filtered = queriesList.filter(q =>
      (q.eventTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.organizerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.query || '').toLowerCase().includes(searchTerm.toLowerCase())
    );
    const unreadCount = queriesList.filter(q => q.status === 'unread').length;

    return (
      <div className="glass-card list-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="section-header">
          <div>
            <h3 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              Organizer Queries
              {unreadCount > 0 && (
                <span style={{ padding: '2px 10px', borderRadius: '20px', background: 'rgba(239,68,68,0.1)', color: 'var(--error)', fontSize: '0.75rem', fontWeight: 700 }}>
                  {unreadCount} unread
                </span>
              )}
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '4px 0 0' }}>Messages sent by organizers from their dashboard.</p>
          </div>
          <div className="search-box">
            <Search size={15} color="var(--text-muted)" />
            <input type="text" placeholder="Search queries..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading queries...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <div style={{ fontSize: '2rem', marginBottom: '12px' }}>💬</div>
              <p>{searchTerm ? 'No queries match your search.' : 'No queries yet.'}</p>
            </div>
          ) : filtered.map((q: any) => (
            <div
              key={q._id}
              onClick={() => q.status === 'unread' && markQueryRead(q._id)}
              style={{
                padding: isMobile ? '14px 16px' : '20px var(--spacing-6)',
                borderBottom: '1px solid var(--border-color)',
                display: 'flex',
                gap: '16px',
                alignItems: 'flex-start',
                background: q.status === 'unread' ? 'rgba(37,99,235,0.02)' : 'transparent',
                cursor: q.status === 'unread' ? 'pointer' : 'default',
                transition: '0.15s'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
              onMouseLeave={e => (e.currentTarget.style.background = q.status === 'unread' ? 'rgba(37,99,235,0.02)' : 'transparent')}
            >
              {/* Unread dot */}
              <div style={{ paddingTop: '6px', flexShrink: 0 }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: q.status === 'unread' ? 'var(--accent-primary)' : 'transparent' }} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Header row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>
                    <span style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>{q.organizerName || 'Unknown'}</span>
                    <span style={{ margin: '0 6px', color: 'var(--border-color)' }}>·</span>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{q.eventTitle || 'Unknown Event'}</span>
                    {q.organizerEmail && !isMobile && (
                      <>
                        <span style={{ margin: '0 6px', color: 'var(--border-color)' }}>·</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{q.organizerEmail}</span>
                      </>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(q.createdAt).toLocaleDateString()}
                    </span>
                    {q.status === 'unread' && (
                      <span style={{ padding: '2px 8px', borderRadius: '10px', background: 'rgba(37,99,235,0.1)', color: 'var(--accent-primary)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>New</span>
                    )}
                  </div>
                </div>
                {/* Query text */}
                <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{q.query}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPastEventsView = () => {
    const filtered = pastEventsList.filter(e =>
      (e.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.venue || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.city || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (e.organizer?.organizerName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="glass-card list-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="section-header">
          <div>
            <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Past Events</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '4px 0 0' }}>Events that have already taken place — kept for records.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: isMobile ? '100%' : 'auto' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{filtered.length} events</span>
            <div className="search-box" style={{ flex: isMobile ? 1 : 'unset' }}>
              <Search size={15} color="var(--text-muted)" />
              <input type="text" placeholder="Search past events..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
          </div>
        </div>

        {isMobile ? (
          <div>
            {loading ? <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
            : filtered.length === 0 ? <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>{searchTerm ? 'No matches.' : 'No past events yet.'}</div>
            : filtered.map((e: any) => (
              <div key={e._id}
                onClick={() => { setSelectedRequest({ id: e._id, type: 'creation' }); setIsViewModalOpen(true); }}
                style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={el => (el.currentTarget.style.background = 'var(--bg-tertiary)')}
                onMouseLeave={el => (el.currentTarget.style.background = 'transparent')}
              >
                <div style={{ width: '44px', height: '44px', minWidth: '44px', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)', flexShrink: 0 }}>
                  <img src={e.image?.startsWith('http') ? e.image : `${BACKEND_URL}${e.image}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>{new Date(e.date).toLocaleDateString()}{e.venue ? ` · ${e.venue}` : ''}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)', textAlign: 'left' }}>
                  <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Event</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Organizer</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Venue</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Date</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Views</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td></tr>
                : filtered.length === 0 ? <tr><td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>{searchTerm ? 'No matches.' : 'No past events yet.'}</td></tr>
                : filtered.map((e: any) => (
                  <tr key={e._id} onClick={() => { setSelectedRequest({ id: e._id, type: 'creation' }); setIsViewModalOpen(true); }}
                    style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={el => el.currentTarget.style.background = 'var(--bg-tertiary)'}
                    onMouseLeave={el => el.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '8px', overflow: 'hidden', background: 'var(--bg-tertiary)', flexShrink: 0, border: '1px solid var(--border-color)' }}>
                        <img src={e.image?.startsWith('http') ? e.image : `${BACKEND_URL}${e.image}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                      </div>
                      <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{e.title}</span>
                    </td>
                    <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{e.organizer?.organizerName || '—'}</td>
                    <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{e.venue}{e.city ? `, ${e.city}` : ''}</td>
                    <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{new Date(e.date).toLocaleDateString()}</td>
                    <td style={{ padding: '14px 20px', fontSize: '0.875rem', color: 'var(--text-muted)' }}>{e.views || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderCityRequestsView = () => {
    const grouped = cityRequestsList.reduce((acc: Record<string, any[]>, r: any) => {
      const city = r.city?.trim() || 'Unknown';
      if (!acc[city]) acc[city] = [];
      acc[city].push(r);
      return acc;
    }, {});
    const sorted = Object.entries(grouped).sort((a, b) => b[1].length - a[1].length);
    const filtered = sorted.filter(([city]) =>
      city.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
      <div className="glass-card list-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="section-header">
          <div>
            <h3 style={{ fontSize: '1.25rem', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              City Requests
              <span style={{ padding: '2px 10px', borderRadius: '20px', background: 'rgba(37,99,235,0.1)', color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 700 }}>
                {cityRequestsList.length} total
              </span>
            </h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '4px 0 0' }}>Cities users want happenbe to expand to.</p>
          </div>
          <div className="search-box">
            <Search size={15} color="var(--text-muted)" />
            <input type="text" placeholder="Search cities..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>
        </div>

        {isMobile ? (
          <div>
            {loading ? <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
            : filtered.length === 0 ? <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>{searchTerm ? 'No matches.' : 'No city requests yet.'}</div>
            : filtered.map(([city, reqs]) => {
              const maxCount = sorted[0]?.[1]?.length || 1;
              const pct = Math.round((reqs.length / maxCount) * 100);
              return (
                <div key={city} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>🌍 {city}</span>
                    <span style={{ padding: '3px 10px', borderRadius: '20px', background: 'rgba(37,99,235,0.1)', color: 'var(--accent-primary)', fontWeight: 800, fontSize: '0.8rem' }}>{reqs.length}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ flex: 1, height: '5px', borderRadius: '10px', background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', borderRadius: '10px', background: 'var(--accent-gradient)' }} />
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600, minWidth: '28px' }}>{pct}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)', textAlign: 'left' }}>
                  <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>City</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Requests</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Demand</th>
                  <th style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>Latest</th>
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td></tr>
                : filtered.length === 0 ? <tr><td colSpan={4} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>{searchTerm ? 'No matches.' : 'No city requests yet.'}</td></tr>
                : filtered.map(([city, reqs]) => {
                  const maxCount = sorted[0]?.[1]?.length || 1;
                  const pct = Math.round((reqs.length / maxCount) * 100);
                  const latest = reqs.reduce((a: any, b: any) => new Date(a.createdAt) > new Date(b.createdAt) ? a : b);
                  return (
                    <tr key={city} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '14px 20px', fontWeight: 700, fontSize: '0.95rem' }}>🌍 {city}</td>
                      <td style={{ padding: '14px 20px' }}><span style={{ padding: '4px 12px', borderRadius: '20px', background: 'rgba(37,99,235,0.1)', color: 'var(--accent-primary)', fontWeight: 800, fontSize: '0.85rem' }}>{reqs.length}</span></td>
                      <td style={{ padding: '14px 20px', minWidth: '160px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ flex: 1, height: '6px', borderRadius: '10px', background: 'var(--bg-tertiary)', overflow: 'hidden' }}>
                            <div style={{ width: `${pct}%`, height: '100%', borderRadius: '10px', background: 'var(--accent-gradient)' }} />
                          </div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, minWidth: '32px' }}>{pct}%</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{new Date(latest.createdAt).toLocaleDateString()}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const [teamList, setTeamList] = useState<any[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [addingAdmin, setAddingAdmin] = useState(false);
  const [addError, setAddError] = useState('');
  const [creds, setCreds] = useState({ currentPassword: '', newEmail: '', newPassword: '' });
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
  const [editAdminFields, setEditAdminFields] = useState({ email: '', password: '' });
  const [editAdminLoading, setEditAdminLoading] = useState(false);
  const [editAdminMsg, setEditAdminMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [credsLoading, setCredsLoading] = useState(false);
  const [credsMsg, setCredsMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const fetchTeam = async () => {
    setTeamLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/auth/team`);
      if (res.ok) setTeamList(await res.json());
    } catch { /* silent */ } finally { setTeamLoading(false); }
  };

  const handleAddAdmin = async () => {
    if (!newAdmin.name || !newAdmin.email || !newAdmin.password) { setAddError('All fields required'); return; }
    setAddingAdmin(true); setAddError('');
    try {
      const res = await authFetch(`${API_BASE}/auth/team`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin)
      });
      const data = await res.json();
      if (!res.ok) { setAddError(data.message); return; }
      setTeamList(p => [data, ...p]);
      setNewAdmin({ name: '', email: '', password: '', role: 'admin' });
      setShowAddAdmin(false);
    } catch { setAddError('Failed to create admin'); }
    finally { setAddingAdmin(false); }
  };

  const toggleAdmin = async (id: string, isActive: boolean) => {
    await authFetch(`${API_BASE}/auth/team/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive })
    });
    setTeamList(p => p.map(a => a._id === id ? { ...a, isActive } : a));
  };

  const handleCredsUpdate = async () => {
    if (!creds.currentPassword) { setCredsMsg({ text: 'Current password is required', ok: false }); return; }
    if (!creds.newEmail && !creds.newPassword) { setCredsMsg({ text: 'Enter a new email or new password', ok: false }); return; }
    setCredsLoading(true); setCredsMsg(null);
    try {
      const res = await authFetch(`${API_BASE}/auth/credentials`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(creds)
      });
      const data = await res.json();
      if (!res.ok) { setCredsMsg({ text: data.message, ok: false }); return; }
      setCredsMsg({ text: 'Credentials updated successfully.', ok: true });
      setCreds({ currentPassword: '', newEmail: '', newPassword: '' });
    } catch { setCredsMsg({ text: 'Failed to update credentials', ok: false }); }
    finally { setCredsLoading(false); }
  };

  const renderTeamView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
    <div className="glass-card list-card" style={{ padding: 0, overflow: 'hidden' }}>
      <div className="section-header">
        <div>
          <h3 style={{ fontSize: '1.25rem', margin: 0 }}>Team Management</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', margin: '4px 0 0' }}>Manage admin accounts and permissions.</p>
        </div>
        <button onClick={() => setShowAddAdmin(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '12px', border: 'none', background: 'var(--accent-gradient)', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <Plus size={16} /> Add Admin
        </button>
      </div>

      {/* Add Admin Form */}
      {showAddAdmin && (
        <div style={{ padding: isMobile ? '16px' : 'var(--spacing-6)', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-tertiary)' }}>
          <h4 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 700 }}>New Admin</h4>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            {[
              { key: 'name', placeholder: 'Full name', type: 'text' },
              { key: 'email', placeholder: 'Email address', type: 'email' },
              { key: 'password', placeholder: 'Password', type: 'password' },
            ].map(f => (
              <input key={f.key} type={f.type} placeholder={f.placeholder} value={(newAdmin as any)[f.key]}
                onChange={e => setNewAdmin(p => ({ ...p, [f.key]: e.target.value }))}
                style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit' }}
              />
            ))}
            <select value={newAdmin.role} onChange={e => setNewAdmin(p => ({ ...p, role: e.target.value }))}
              style={{ padding: '10px 14px', borderRadius: '10px', border: '1.5px solid var(--border-color)', background: 'var(--bg-secondary)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit' }}>
              <option value="admin">Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          {addError && <p style={{ color: 'var(--error)', fontSize: '0.82rem', margin: '0 0 10px' }}>{addError}</p>}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={handleAddAdmin} disabled={addingAdmin} style={{ padding: '9px 24px', borderRadius: '10px', border: 'none', background: 'var(--accent-gradient)', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}>
              {addingAdmin ? 'Creating...' : 'Create'}
            </button>
            <button onClick={() => { setShowAddAdmin(false); setAddError(''); }} style={{ padding: '9px 20px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {isMobile ? (
        <div>
          {teamLoading ? <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>
          : teamList.length === 0 ? <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>No admins yet.</div>
          : teamList.map(a => (
            <div key={a._id} style={{ padding: '14px 16px', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', gap: '12px' }}
              onClick={() => { setSelectedAdmin(a); setEditAdminFields({ email: a.email, password: '' }); setEditAdminMsg(null); }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{a.name}</div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700, background: a.role === 'super_admin' ? 'rgba(37,99,235,0.1)' : 'rgba(0,0,0,0.05)', color: a.role === 'super_admin' ? 'var(--accent-primary)' : 'var(--text-secondary)' }}>
                    {a.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700, background: a.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: a.isActive ? 'var(--success)' : 'var(--error)' }}>
                    {a.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              {a.role !== 'super_admin' && (
                <button onClick={e => { e.stopPropagation(); const action = a.isActive ? 'deactivate' : 'activate'; if (window.confirm(`${action} ${a.name}?`)) toggleAdmin(a._id, !a.isActive); }}
                  style={{ padding: '6px 12px', borderRadius: '8px', border: `1px solid ${a.isActive ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, background: 'transparent', color: a.isActive ? 'var(--error)' : 'var(--success)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0 }}>
                  {a.isActive ? 'Deactivate' : 'Activate'}
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)', textAlign: 'left' }}>
                {['Name', 'Email', 'Role', 'Status', 'Created', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '14px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {teamLoading ? <tr><td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td></tr>
              : teamList.length === 0 ? <tr><td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>No admins yet.</td></tr>
              : teamList.map(a => (
                <tr key={a._id} style={{ borderBottom: '1px solid var(--border-color)', cursor: 'pointer' }}
                  onClick={() => { setSelectedAdmin(a); setEditAdminFields({ email: a.email, password: '' }); setEditAdminMsg(null); }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <td style={{ padding: '14px 20px', fontWeight: 700, fontSize: '0.9rem' }}>{a.name}</td>
                  <td style={{ padding: '14px 20px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{a.email}</td>
                  <td style={{ padding: '14px 20px' }}><span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, background: a.role === 'super_admin' ? 'rgba(37,99,235,0.1)' : 'rgba(0,0,0,0.05)', color: a.role === 'super_admin' ? 'var(--accent-primary)' : 'var(--text-secondary)', textTransform: 'uppercase' }}>{a.role === 'super_admin' ? 'Super Admin' : 'Admin'}</span></td>
                  <td style={{ padding: '14px 20px' }}><span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.72rem', fontWeight: 700, background: a.isActive ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', color: a.isActive ? 'var(--success)' : 'var(--error)' }}>{a.isActive ? 'Active' : 'Inactive'}</span></td>
                  <td style={{ padding: '14px 20px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>{new Date(a.createdAt).toLocaleDateString()}</td>
                  <td style={{ padding: '14px 20px' }}>
                    {a.role !== 'super_admin' && (
                      <button onClick={e => { e.stopPropagation(); const action = a.isActive ? 'deactivate' : 'activate'; if (window.confirm(`Are you sure you want to ${action} ${a.name}?`)) toggleAdmin(a._id, !a.isActive); }}
                        style={{ padding: '6px 14px', borderRadius: '8px', border: `1px solid ${a.isActive ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`, background: 'transparent', color: a.isActive ? 'var(--error)' : 'var(--success)', fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer' }}>
                        {a.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

    </div>
  );

  const [showAdminEmail, setShowAdminEmail] = useState(false);
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  const AdminDetailModal = () => {
    if (!selectedAdmin) return null;
    const handleSave = async () => {
      if (!editAdminFields.email && !editAdminFields.password) { setEditAdminMsg({ text: 'Enter a new email or password to update', ok: false }); return; }
      setEditAdminLoading(true); setEditAdminMsg(null);
      try {
        const body: any = {};
        if (editAdminFields.email !== selectedAdmin.email) body.email = editAdminFields.email;
        if (editAdminFields.password) body.password = editAdminFields.password;
        if (!Object.keys(body).length) { setEditAdminMsg({ text: 'No changes detected', ok: false }); setEditAdminLoading(false); return; }
        const res = await authFetch(`${API_BASE}/auth/team/${selectedAdmin._id}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });
        if (!res.ok) { const d = await res.json(); setEditAdminMsg({ text: d.message, ok: false }); return; }
        setTeamList(p => p.map(a => a._id === selectedAdmin._id ? { ...a, email: editAdminFields.email || a.email } : a));
        setEditAdminMsg({ text: 'Updated successfully', ok: true });
      } catch { setEditAdminMsg({ text: 'Failed to update', ok: false }); }
      finally { setEditAdminLoading(false); }
    };
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(6px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}
        onClick={() => setSelectedAdmin(null)}>
        <div style={{ width: '100%', maxWidth: '440px', background: 'var(--bg-secondary)', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '32px', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
          onClick={e => e.stopPropagation()}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
            <div>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '0 0 4px', color: 'var(--text-primary)' }}>{selectedAdmin.name}</h3>
              <span style={{ padding: '3px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, background: selectedAdmin.role === 'super_admin' ? 'rgba(37,99,235,0.1)' : 'rgba(0,0,0,0.05)', color: selectedAdmin.role === 'super_admin' ? 'var(--accent-primary)' : 'var(--text-secondary)', textTransform: 'uppercase' }}>
                {selectedAdmin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </span>
            </div>
            <button onClick={() => setSelectedAdmin(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
              <X size={20} />
            </button>
          </div>

          {/* Current info */}
          <div style={{ background: 'var(--bg-tertiary)', borderRadius: '12px', padding: '16px', marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>Current Email</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--accent-primary)', margin: 0, flex: 1, letterSpacing: showAdminEmail ? 'normal' : '0.1em' }}>
                  {showAdminEmail ? selectedAdmin.email : selectedAdmin.email.replace(/./g, '•')}
                </p>
                <button onClick={() => setShowAdminEmail(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', display: 'flex', alignItems: 'center' }}>
                  {showAdminEmail
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>
            <div>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 6px' }}>Current Password</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, flex: 1, letterSpacing: '0.15em' }}>••••••••••••</p>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>hashed — cannot display</span>
              </div>
            </div>
          </div>

          {/* Edit fields */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '7px' }}>New Email</label>
              <input type="email" value={editAdminFields.email} onChange={e => setEditAdminFields(p => ({ ...p, email: e.target.value }))}
                style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit' }}
                onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '7px' }}>New Password <span style={{ fontWeight: 400, textTransform: 'none' }}>(leave blank to keep)</span></label>
              <div style={{ position: 'relative' }}>
                <input type={showAdminPassword ? 'text' : 'password'} placeholder="••••••••" value={editAdminFields.password} onChange={e => setEditAdminFields(p => ({ ...p, password: e.target.value }))}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '11px 40px 11px 14px', borderRadius: '10px', border: '1.5px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                />
                <button type="button" onClick={() => setShowAdminPassword(v => !v)}
                  style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', padding: 0 }}>
                  {showAdminPassword
                    ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                    : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  }
                </button>
              </div>
            </div>
          </div>

          {editAdminMsg && (
            <div style={{ padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', background: editAdminMsg.ok ? 'rgba(16,185,129,0.08)' : 'rgba(220,38,38,0.08)', border: `1px solid ${editAdminMsg.ok ? 'rgba(16,185,129,0.2)' : 'rgba(220,38,38,0.2)'}`, color: editAdminMsg.ok ? 'var(--success)' : 'var(--error)', fontSize: '0.85rem', fontWeight: 600 }}>
              {editAdminMsg.text}
            </div>
          )}

          <div style={{ display: 'flex', gap: '10px' }}>
            <button onClick={() => setSelectedAdmin(null)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'transparent', color: 'var(--text-secondary)', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={handleSave} disabled={editAdminLoading} style={{ flex: 2, padding: '11px', borderRadius: '10px', border: 'none', background: 'var(--accent-gradient)', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: editAdminLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: editAdminLoading ? 0.7 : 1 }}>
              {editAdminLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSettingsView = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {admin?.role === 'super_admin' && (
        <div className="glass-card" style={{ padding: isMobile ? '16px' : '28px 32px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>Change Credentials</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 20px' }}>Update your login email or password. Current password is required to confirm.</p>

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '14px', marginBottom: '16px' }}>
            {[
              { key: 'currentPassword', label: 'Current Password', type: 'password', placeholder: '••••••••' },
              { key: 'newEmail', label: 'New Email (optional)', type: 'email', placeholder: 'new@happenbe.com' },
              { key: 'newPassword', label: 'New Password (optional)', type: 'password', placeholder: 'Min. 8 characters' },
            ].map(f => (
              <div key={f.key}>
                <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>{f.label}</label>
                <input
                  type={f.type} placeholder={f.placeholder}
                  value={(creds as any)[f.key]}
                  onChange={e => setCreds(p => ({ ...p, [f.key]: e.target.value }))}
                  style={{ width: '100%', boxSizing: 'border-box', padding: '11px 14px', borderRadius: '10px', border: '1.5px solid var(--border-color)', background: 'var(--bg-tertiary)', color: 'var(--text-primary)', fontSize: '0.875rem', outline: 'none', fontFamily: 'inherit' }}
                  onFocus={e => e.target.style.borderColor = 'var(--accent-primary)'}
                  onBlur={e => e.target.style.borderColor = 'var(--border-color)'}
                />
              </div>
            ))}
          </div>

          {credsMsg && (
            <div style={{ padding: '10px 14px', borderRadius: '10px', marginBottom: '14px', background: credsMsg.ok ? 'rgba(16,185,129,0.08)' : 'rgba(220,38,38,0.08)', border: `1px solid ${credsMsg.ok ? 'rgba(16,185,129,0.2)' : 'rgba(220,38,38,0.2)'}`, color: credsMsg.ok ? 'var(--success)' : 'var(--error)', fontSize: '0.85rem', fontWeight: 600 }}>
              {credsMsg.text}
            </div>
          )}

          <button onClick={handleCredsUpdate} disabled={credsLoading}
            style={{ padding: '10px 28px', borderRadius: '10px', border: 'none', background: 'var(--accent-gradient)', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: credsLoading ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: credsLoading ? 0.7 : 1 }}>
            {credsLoading ? 'Updating...' : 'Update Credentials'}
          </button>
        </div>
      )}
      <div className="glass-card" style={{ padding: isMobile ? '16px' : '28px 32px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>Account Info</h3>
        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 16px' }}>Your current session details.</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {[{ label: 'Name', value: admin?.name }, { label: 'Email', value: admin?.email }, { label: 'Role', value: admin?.role === 'super_admin' ? 'Super Admin' : 'Admin' }].map(r => (
            <div key={r.label} style={{ display: 'flex', gap: '16px', padding: '10px 14px', borderRadius: '10px', background: 'var(--bg-tertiary)' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '60px' }}>{r.label}</span>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{r.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const COLORS = ['#3b82f6','#7c3aed','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4','#84cc16'];
  const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const renderAnalyticsView = () => {
    if (loading || !analyticsData) return <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading analytics...</div>;
    const a = analyticsData;

    const monthlyData = a.eventsByMonth.map((m: any) => ({
      name: `${monthNames[m._id.month - 1]} '${String(m._id.year).slice(2)}`,
      Total: m.total, Approved: m.approved, Pending: m.pending,
    }));

    const statusData = a.statusBreakdown.map((s: any) => ({
      name: s._id ? s._id.charAt(0).toUpperCase() + s._id.slice(1) : 'Unknown',
      value: s.count
    }));

    const verifyData = [
      { name: 'Verified', value: a.organizerVerification.verified },
      { name: 'Unverified', value: a.organizerVerification.unverified },
    ];

    const claimData = a.claimStats.map((c: any) => ({
      name: c._id ? c._id.charAt(0).toUpperCase() + c._id.slice(1) : 'Unknown',
      value: c.count
    }));

    const card = (children: React.ReactNode, style: any = {}) => (
      <div className="glass-card" style={{ padding: '24px', ...style }}>{children}</div>
    );

    const sectionTitle = (title: string, sub?: string) => (
      <div style={{ marginBottom: '20px' }}>
        <h3 style={{ fontSize: '1rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>{title}</h3>
        {sub && <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>{sub}</p>}
      </div>
    );

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: '12px' }}>
          {[
            { label: 'Total Views', value: a.engagement.totalViews.toLocaleString(), color: '#3b82f6' },
            { label: 'Total RSVPs', value: a.engagement.totalRsvp.toLocaleString(), color: '#7c3aed' },
            { label: 'Avg Views / Event', value: Math.round(a.engagement.avgViews).toLocaleString(), color: '#10b981' },
            { label: 'City Demand Signals', value: a.cityDemand.reduce((s: number, c: any) => s + c.count, 0).toLocaleString(), color: '#f59e0b' },
          ].map((k, i) => (
            <div key={i} className="glass-card stat-card" style={{ padding: isMobile ? '14px' : '20px' }}>
              <p style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>{k.label}</p>
              <p style={{ fontSize: isMobile ? '1.4rem' : '2rem', fontWeight: 900, color: k.color, margin: 0, letterSpacing: '-0.04em' }}>{k.value}</p>
            </div>
          ))}
        </div>

        {/* Events growth chart */}
        {card(<>
          {sectionTitle('Events Over Time', 'Monthly listings for the last 6 months')}
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.82rem' }} />
              <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
              <Bar dataKey="Total" fill="#3b82f6" radius={[4,4,0,0]} />
              <Bar dataKey="Approved" fill="#10b981" radius={[4,4,0,0]} />
              <Bar dataKey="Pending" fill="#f59e0b" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </>)}

        {/* Row: Status pie + Organizer verification */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '20px' }}>
          {card(<>
            {sectionTitle('Event Status', 'Breakdown by current status')}
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {statusData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.82rem' }} />
                <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </>)}

          {card(<>
            {sectionTitle('Organizer Verification')}
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={verifyData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  <Cell fill="#58AEED" /><Cell fill="rgba(0,0,0,0.1)" />
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.82rem' }} />
                <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </>)}

          {card(<>
            {sectionTitle('Claim Pipeline')}
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie data={claimData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} dataKey="value" paddingAngle={3}>
                  {claimData.map((_: any, i: number) => <Cell key={i} fill={['#f59e0b','#10b981','#ef4444'][i] || COLORS[i]} />)}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid var(--border-color)', fontSize: '0.82rem' }} />
                <Legend wrapperStyle={{ fontSize: '0.78rem' }} />
              </PieChart>
            </ResponsiveContainer>
          </>)}
        </div>

        {/* Row: Top cities + City demand */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '20px' }}>
          {card(<>
            {sectionTitle('Top Cities', 'Events per city')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {a.topCities.map((c: any, i: number) => {
                const max = a.topCities[0]?.count || 1;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{c._id}</span>
                      <span style={{ color: 'var(--text-muted)' }}>{c.count} events · {c.views} views</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '4px', background: 'var(--bg-tertiary)' }}>
                      <div style={{ width: `${(c.count / max) * 100}%`, height: '100%', borderRadius: '4px', background: 'var(--accent-gradient)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>)}

          {card(<>
            {sectionTitle('City Demand', 'Users requesting expansion')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {a.cityDemand.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No city requests yet.</p>
              ) : a.cityDemand.map((c: any, i: number) => {
                const max = a.cityDemand[0]?.count || 1;
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '4px' }}>
                      <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>🌍 {c._id}</span>
                      <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{c.count} requests</span>
                    </div>
                    <div style={{ height: '6px', borderRadius: '4px', background: 'var(--bg-tertiary)' }}>
                      <div style={{ width: `${(c.count / max) * 100}%`, height: '100%', borderRadius: '4px', background: 'linear-gradient(135deg,#f59e0b,#ef4444)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>)}
        </div>

        {/* Top events by views */}
        {card(<>
          {sectionTitle('Top Events by Views')}
          <div style={{ overflowX: 'auto', margin: '0 -24px', padding: '0 24px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: isMobile ? 'unset' : '500px' }}>
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)' }}>
                  <th style={{ padding: '10px 14px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'left' }}>Event</th>
                  {!isMobile && <th style={{ padding: '10px 14px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'left' }}>City</th>}
                  {!isMobile && <th style={{ padding: '10px 14px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'left' }}>Venue</th>}
                  <th style={{ padding: '10px 14px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'left' }}>Views</th>
                  <th style={{ padding: '10px 14px', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'left' }}>RSVPs</th>
                </tr>
              </thead>
              <tbody>
                {a.topEvents.map((e: any, i: number) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', maxWidth: isMobile ? '140px' : 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</td>
                    {!isMobile && <td style={{ padding: '10px 14px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{e.city || '—'}</td>}
                    {!isMobile && <td style={{ padding: '10px 14px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{e.venue || '—'}</td>}
                    <td style={{ padding: '10px 14px', fontWeight: 800, color: '#3b82f6', whiteSpace: 'nowrap' }}>{(e.views || 0).toLocaleString()}</td>
                    <td style={{ padding: '10px 14px', fontWeight: 800, color: '#7c3aed', whiteSpace: 'nowrap' }}>{(e.goingCount || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>)}

      </div>
    );
  };

  const renderMainContent = () => {
    switch(currentView as string) {
      case 'dashboard': return renderDashboard();
      case 'events': return renderEventsView();
      case 'organizers': return renderOrganizersView();
      case 'venues': return renderVenuesView();
      case 'queries': return renderQueriesView();
      case 'past-events': return renderPastEventsView();
      case 'city-requests': return renderCityRequestsView();
      case 'team': return renderTeamView();
      case 'analytics': return renderAnalyticsView();
      case 'settings': return renderSettingsView();
      default: return (
        <div className="glass-card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-secondary)' }}>
          <p>The {currentView} module is currently being configured.</p>
        </div>
      );
    }
  };

  const getHeaderInfo = () => {
    switch(currentView as string) {
      case 'dashboard': return { title: 'Dashboard Overview', desc: 'Live management portal for HappenBe.com' };
      case 'events': return { title: 'Events Management', desc: 'View and manage all approved events.' };
      case 'organizers': return { title: 'Organizers Directory', desc: 'List of all active event hosts.' };
      case 'venues': return { title: 'Venues & Locations', desc: 'Overview of all event locations.' };
      case 'queries': return { title: 'Organizer Queries', desc: 'Messages sent by organizers from their dashboard.' };
      case 'past-events': return { title: 'Past Events', desc: 'Events that have already taken place.' };
      case 'city-requests': return { title: 'City Requests', desc: 'Cities users want happenbe to expand to.' };
      case 'team': return { title: 'Team', desc: 'Manage admin accounts and access.' };
      case 'analytics': return { title: 'Analytics', desc: 'Growth trends, engagement and platform insights.' };
      case 'settings': return { title: 'Settings', desc: 'Manage your account and preferences.' };
      default: return { title: 'Management Portal', desc: 'Admin control center.' };
    }
  };

  return (
    <>
      <Sidebar
        currentView={currentView}
        onViewChange={setCurrentView}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(c => !c)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)', marginLeft: isMobile ? 0 : '240px' }}>
        <Navbar onMenuToggle={() => setSidebarOpen(o => !o)} />

        <main style={{
          padding: isMobile ? 'var(--spacing-4)' : 'var(--spacing-8)',
          flex: 1,
          background: 'var(--bg-primary)'
        }}>
          <header style={{
            marginBottom: 'var(--spacing-6)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: isMobile ? 'flex-start' : 'center',
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? '12px' : 0
          }}>
            <div>
              <h1 style={{
                fontSize: isMobile ? '1.6rem' : '2.5rem',
                marginBottom: '4px',
                background: 'var(--accent-gradient)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                fontWeight: 800,
                letterSpacing: '-0.03em'
              }}>{getHeaderInfo().title}</h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: isMobile ? '0.85rem' : '1rem', fontWeight: 500 }}>
                {getHeaderInfo().desc}
              </p>
            </div>
            {currentView === 'dashboard' && (
              <button
                  onClick={() => setIsModalOpen(true)}
                  style={{
                      padding: '12px 28px',
                      background: 'var(--accent-gradient)',
                      color: 'white',
                      borderRadius: '30px',
                      fontWeight: 700,
                      fontSize: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      boxShadow: '0 8px 25px rgba(59, 130, 246, 0.4)',
                      transition: '0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                      cursor: 'pointer',
                      border: 'none'
                  }}
                  onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-4px) scale(1.02)';
                      e.currentTarget.style.boxShadow = '0 12px 30px rgba(59, 130, 246, 0.6)';
                  }}
                  onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0) scale(1)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(59, 130, 246, 0.4)';
                  }}
              >
                  <Plus size={22} strokeWidth={3} /> New Event
              </button>
            )}
          </header>

          {renderMainContent()}
        </main>
      </div>
      <CreateEventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={() => {
            fetchDashboardData();
            // Optional: show success toast or notification
        }} 
      />
      <ViewRequestModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        requestId={selectedRequest?.id || null}
        requestType={selectedRequest?.type || null}
        onAction={handleAction}
      />
      <AdminDetailModal />
    </>
  );
};

export default App;
