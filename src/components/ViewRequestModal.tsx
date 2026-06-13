import { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Users, Check, X as XIcon, Loader2, Video, Trash2, Pencil } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api/admin';
const BACKEND_URL = 'http://localhost:5000';

interface ViewRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    requestId: string | null;
    requestType: 'creation' | 'claim' | 'edit' | 'remove' | null;
    onAction: (id: string, type: any, action: 'approved' | 'rejected') => Promise<void>;
}

const API_EVENTS_BASE = import.meta.env.VITE_API_BASE?.replace('/admin', '') || 'http://localhost:5000/api';

const ViewRequestModal = ({ isOpen, onClose, requestId, requestType, onAction }: ViewRequestModalProps) => {
    const { token } = useAuth();
    const authFetch = (url: string) => fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [viewers, setViewers] = useState<any[]>([]);
    const [viewersLoading, setViewersLoading] = useState(false);

    useEffect(() => {
        if (isOpen && requestId && requestType) {
            fetchDetails();
        } else if (!isOpen) {
            setData(null);
            setError(null);
            setViewers([]);
        }
    }, [isOpen, requestId, requestType]);

    useEffect(() => {
        if (isOpen && requestId && requestType === 'creation' && token) {
            setViewersLoading(true);
            fetch(`${API_EVENTS_BASE}/events/${requestId}/viewers`, {
                headers: { Authorization: `Bearer ${token}` }
            })
                .then(r => r.ok ? r.json() : [])
                .then(d => setViewers(Array.isArray(d) ? d : []))
                .catch(() => setViewers([]))
                .finally(() => setViewersLoading(false));
        }
    }, [isOpen, requestId, requestType, token]);

    const fetchDetails = async () => {
        setLoading(true);
        setError(null);
        try {
            let endpoint = '';
            if (requestType === 'creation') endpoint = `events/${requestId}`;
            else if (requestType === 'claim') endpoint = `claims/${requestId}`;
            else if (requestType === 'edit') endpoint = `edit-requests/${requestId}`;
            else if (requestType === 'remove') endpoint = `removals/${requestId}`;
            else {
                setError(`Detail view not implemented for ${requestType}`);
                setLoading(false);
                return;
            }

            const response = await authFetch(`${API_BASE}/${endpoint}`);
            if (response.ok) {
                const json = await response.json();
                setData(json);
            } else {
                const errJson = await response.json().catch(() => ({}));
                setError(errJson.message || `Failed to load details (${response.status})`);
            }
        } catch (error) {
            console.error('Error fetching details:', error);
            setError('Check your internet connection or server status.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    const handleInternalAction = async (action: 'approved' | 'rejected') => {
        if (requestId && requestType) {
            await onAction(requestId, requestType, action);
            onClose();
        }
    };

    const StatusBadge = ({ status }: { status: string }) => {
        const styles: any = {
            approved: { bg: 'rgba(5, 150, 105, 0.1)', color: 'var(--success)', text: 'Approved' },
            pending: { bg: 'rgba(217, 119, 6, 0.1)', color: 'var(--warning)', text: 'Pending' },
            rejected: { bg: 'rgba(220, 38, 38, 0.1)', color: 'var(--error)', text: 'Rejected' },
            expired: { bg: 'rgba(100, 116, 139, 0.1)', color: 'var(--text-muted)', text: 'Expired' },
        };
        const s = styles[status] || styles.pending;
        return (
            <span style={{ padding: '4px 12px', borderRadius: '30px', fontSize: '0.75rem', fontWeight: 700, background: s.bg, color: s.color, textTransform: 'uppercase' }}>
                {s.text}
            </span>
        );
    };

    return (
        <AnimatePresence>
            <div style={{
                position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
                background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(8px)',
                zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--spacing-4)'
            }}>
                <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 20 }}
                    style={{
                        width: '100%', maxWidth: '600px', maxHeight: '85vh',
                        background: 'var(--bg-secondary)', borderRadius: '24px',
                        border: '1px solid var(--border-color)', display: 'flex',
                        flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.1)'
                    }}
                >
                    {/* Header */}
                    <div style={{
                        padding: '24px 32px', borderBottom: '1px solid var(--border-color)',
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        background: 'rgba(0,0,0,0.02)'
                    }}>
                        <div>
                            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {requestType === 'creation' ? 'Event Creation Request' : requestType === 'edit' ? 'Event Edit Request' : requestType === 'remove' ? 'Event Removal Request' : 'Verification Claim'}
                            </h2>
                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                Ref: {requestId?.slice(-8).toUpperCase()}
                            </p>
                        </div>
                        <button onClick={onClose} style={{ color: 'var(--text-muted)', cursor: 'pointer' }}><X size={24} /></button>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                        {loading ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '40px 0' }}>
                                <Loader2 size={32} className="refresh-spinner" color="var(--accent-primary)" />
                                <span style={{ color: 'var(--text-muted)', fontWeight: 500 }}>Fetching latest details...</span>
                            </div>
                        ) : error ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', padding: '40px 0', textAlign: 'center' }}>
                                <div style={{ padding: '16px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.05)', color: 'var(--error)' }}>
                                    <XIcon size={32} />
                                </div>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Could Not Load Request</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', maxWidth: '280px' }}>{error}</p>
                                <button onClick={fetchDetails} style={{ marginTop: '8px', padding: '8px 20px', borderRadius: '20px', background: 'var(--accent-primary)', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer' }}>Try Again</button>
                            </div>
                        ) : data ? (
                            requestType === 'remove' ? (
                                /* ---- REMOVAL REQUEST VIEW ---- */
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {/* Event being removed */}
                                    <section style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '16px' }}>
                                        <div style={{ width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', background: '#f1f5f9', flexShrink: 0, border: '1px solid var(--border-color)' }}>
                                            <img
                                                src={data.event?.image?.startsWith('http') ? data.event.image : `${BACKEND_URL}${data.event?.image || '/placeholder.png'}`}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                alt="Event"
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{data.event?.title || 'Unknown Event'}</h3>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                                {data.event?.organizer?.organizerName || '—'} · Requesting removal · <StatusBadge status={data.status} />
                                            </p>
                                        </div>
                                    </section>

                                    {/* Reason */}
                                    <section style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '14px', padding: '20px' }}>
                                        <label style={{ ...labelStyle, color: 'var(--error)', marginBottom: '10px' }}>
                                            Reason for Removal
                                        </label>
                                        <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-primary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                            {data.reason || 'No reason provided.'}
                                        </p>
                                    </section>

                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', margin: 0 }}>
                                        Submitted: {new Date(data.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            ) : requestType === 'edit' ? (
                                /* ---- EDIT REQUEST: Proposed Changes View ---- */
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {/* Event being edited */}
                                    <section style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '16px' }}>
                                        <div style={{ width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', background: '#f1f5f9', flexShrink: 0, border: '1px solid var(--border-color)' }}>
                                            <img 
                                                src={data.event?.image?.startsWith('http') ? data.event.image : `${BACKEND_URL}${data.event?.image || '/placeholder.png'}`}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                alt="Event"
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)' }}>{data.event?.title || 'Unknown Event'}</h3>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                                                Editing event · <StatusBadge status={data.status} />
                                            </p>
                                        </div>
                                    </section>

                                    {/* Proposed Changes Table */}
                                    <section>
                                        <label style={{ ...labelStyle, marginBottom: '16px', fontSize: '0.8rem' }}>
                                            <Pencil size={14} style={{ marginRight: '6px' }} /> Proposed Changes
                                        </label>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                            {/* Header */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 1fr', background: 'var(--bg-tertiary)', padding: '10px 16px', gap: '12px' }}>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Field</span>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current</span>
                                                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#8b5cf6', textTransform: 'uppercase' }}>Proposed</span>
                                            </div>
                                            {/* Rows */}
                                            {(() => {
                                                const labelMap: Record<string, string> = {
                                                    title: 'Title', date: 'Date', endDate: 'End Date',
                                                    startTime: 'Start Time', endTime: 'End Time',
                                                    venue: 'Venue', city: 'City', description: 'Description',
                                                    organizerName: 'organizer', organizerWebsite: 'Website',
                                                    organizerContact: 'Email', organizerWhatsApp: 'WhatsApp',
                                                    organizerPhone: 'Phone', organizerInstagram: 'Instagram',
                                                    bookingType: 'Booking Type', websiteLink: 'Website Link',
                                                    whatsappLink: 'WhatsApp Link'
                                                };

                                                const dateFields = ['date', 'endDate'];
                                                const normalizeForCompare = (val: any, key: string): string => {
                                                    if (!val || val === '—') return '';
                                                    if (dateFields.includes(key)) {
                                                        try { return new Date(val).toISOString().split('T')[0]; } catch { return String(val); }
                                                    }
                                                    return String(val).trim();
                                                };
                                                const displayDate = (val: any, key: string): string => {
                                                    if (!val || val === '—') return '—';
                                                    if (dateFields.includes(key)) {
                                                        try { return new Date(val).toLocaleDateString(); } catch { return String(val); }
                                                    }
                                                    return String(val) || '—';
                                                };

                                                const renderRow = (key: string, currentValue: any, proposedValue: any) => {
                                                    const cur = currentValue ?? null;
                                                    const prop = proposedValue ?? null;
                                                    const isChanged = normalizeForCompare(cur, key) !== normalizeForCompare(prop, key);
                                                    const displayCur = displayDate(cur, key);
                                                    const displayProp = displayDate(prop, key);
                                                    return (
                                                        <div key={key} style={{
                                                            display: 'grid', gridTemplateColumns: '140px 1fr 1fr',
                                                            padding: '10px 16px', gap: '12px',
                                                            background: isChanged ? 'rgba(139, 92, 246, 0.03)' : 'transparent',
                                                            borderTop: '1px solid var(--border-color)'
                                                        }}>
                                                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)' }}>{labelMap[key] || key}</span>
                                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', wordBreak: 'break-word' }}>{displayCur}</span>
                                                            <span style={{
                                                                fontSize: '0.8rem', fontWeight: isChanged ? 700 : 400,
                                                                color: isChanged ? '#8b5cf6' : 'var(--text-secondary)',
                                                                wordBreak: 'break-word'
                                                            }}>
                                                                {displayProp}
                                                                {isChanged && <span style={{ marginLeft: '4px', fontSize: '0.65rem', color: '#8b5cf6', fontWeight: 700 }}>✦</span>}
                                                            </span>
                                                        </div>
                                                    );
                                                };

                                                const skipKeys = ['coordinates', 'existingImages', 'existingVideo', 'guests', 'termsAndConditions', 'organizer'];
                                                const topLevelRows = data.proposedData
                                                    ? Object.entries(data.proposedData)
                                                        .filter(([key]) => !skipKeys.includes(key))
                                                        .map(([key, value]) => renderRow(key, data.event?.[key], value))
                                                    : [];

                                                const organizerRows = data.proposedData?.organizer
                                                    ? Object.entries(data.proposedData.organizer)
                                                        .map(([key, value]) => renderRow(key, data.event?.organizer?.[key], value))
                                                    : [];

                                                return [...topLevelRows, ...organizerRows];
                                            })()}
                                        </div>
                                    </section>

                                    {/* Guests / Artists */}
                                    {data.proposedData?.guests !== undefined && (
                                        <section style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '12px' }}>
                                            <label style={labelStyle}><Users size={14} style={{ marginRight: '6px' }} /> Guests / Artists</label>
                                            {(() => {
                                                const proposed: string[] = Array.isArray(data.proposedData.guests) ? data.proposedData.guests : [];
                                                const current: string[] = Array.isArray(data.event?.guests) ? data.event.guests : [];
                                                const isChanged = JSON.stringify(current) !== JSON.stringify(proposed);
                                                return (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {current.length > 0 && (
                                                            <div>
                                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Current</span>
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                                                                    {current.map((g, i) => <span key={i} style={{ padding: '3px 10px', borderRadius: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>{g}</span>)}
                                                                </div>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <span style={{ fontSize: '0.7rem', color: isChanged ? '#8b5cf6' : 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                                                                Proposed {isChanged && '✦'}
                                                            </span>
                                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                                                                {proposed.length > 0
                                                                    ? proposed.map((g, i) => <span key={i} style={{ padding: '3px 10px', borderRadius: '20px', background: isChanged ? 'rgba(139,92,246,0.1)' : 'var(--bg-secondary)', border: `1px solid ${isChanged ? '#8b5cf6' : 'var(--border-color)'}`, fontSize: '0.8rem', color: isChanged ? '#8b5cf6' : 'inherit', fontWeight: isChanged ? 600 : 400 }}>{g}</span>)
                                                                    : <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>None</span>
                                                                }
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </section>
                                    )}

                                    {/* Terms & Conditions */}
                                    {data.proposedData?.termsAndConditions !== undefined && (
                                        <section style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '12px' }}>
                                            <label style={labelStyle}>Terms & Conditions</label>
                                            {(() => {
                                                const rawProposed = data.proposedData.termsAndConditions;
                                                const rawCurrent = data.event?.termsAndConditions;
                                                const proposed: string[] = Array.isArray(rawProposed) ? rawProposed : (typeof rawProposed === 'string' && rawProposed ? rawProposed.split('\n').filter(Boolean) : []);
                                                const current: string[] = Array.isArray(rawCurrent) ? rawCurrent : (typeof rawCurrent === 'string' && rawCurrent ? rawCurrent.split('\n').filter(Boolean) : []);
                                                const isChanged = JSON.stringify(current) !== JSON.stringify(proposed);
                                                return (
                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                        {current.length > 0 && (
                                                            <div>
                                                                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>Current</span>
                                                                <ul style={{ margin: '6px 0 0', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                    {current.map((t, i) => <li key={i} style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{t}</li>)}
                                                                </ul>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <span style={{ fontSize: '0.7rem', color: isChanged ? '#8b5cf6' : 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                                                                Proposed {isChanged && '✦'}
                                                            </span>
                                                            {proposed.length > 0
                                                                ? <ul style={{ margin: '6px 0 0', paddingLeft: '16px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                                    {proposed.map((t, i) => <li key={i} style={{ fontSize: '0.82rem', color: isChanged ? '#8b5cf6' : 'var(--text-secondary)', fontWeight: isChanged ? 600 : 400 }}>{t}</li>)}
                                                                  </ul>
                                                                : <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontStyle: 'italic', margin: '6px 0 0' }}>None</p>
                                                            }
                                                        </div>
                                                    </div>
                                                );
                                            })()}
                                        </section>
                                    )}

                                    {/* Coordinates change */}
                                    {data.proposedData?.coordinates && (
                                        <section style={{ background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '12px' }}>
                                            <label style={labelStyle}><MapPin size={14} style={{ marginRight: '6px' }} /> Updated Location Coordinates</label>
                                            <a
                                                href={`https://www.google.com/maps?q=${data.proposedData.coordinates.lat},${data.proposedData.coordinates.lng}`}
                                                target="_blank" rel="noreferrer"
                                                style={{ fontSize: '0.85rem', color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}
                                            >
                                                {data.proposedData.coordinates.lat}, {data.proposedData.coordinates.lng} → View on Map
                                            </a>
                                        </section>
                                    )}

                                    {/* Submitted at */}
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                                        Submitted: {new Date(data.createdAt).toLocaleString()}
                                    </p>
                                </div>
                            ) : requestType === 'claim' ? (
                                /* ---- CLAIM REQUEST VIEW ---- */
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                    {/* Event being claimed */}
                                    <section style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '16px', borderRadius: '16px' }}>
                                        <div style={{ width: '56px', height: '56px', borderRadius: '12px', overflow: 'hidden', background: '#f1f5f9', flexShrink: 0, border: '1px solid var(--border-color)' }}>
                                            <img
                                                src={data.event?.image?.startsWith('http') ? data.event.image : `${BACKEND_URL}${data.event?.image || '/placeholder.png'}`}
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                alt="Event"
                                                onError={(e: any) => { e.target.style.display = 'none'; }}
                                            />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>{data.event?.title || 'Unknown Event'}</h3>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                                {data.event?.venue}{data.event?.city ? `, ${data.event.city}` : ''} · <StatusBadge status={data.status} />
                                            </p>
                                        </div>
                                    </section>

                                    {/* Claimant details */}
                                    <section style={{ background: 'var(--bg-tertiary)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        <label style={labelStyle}>Claimant Details</label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                                            <div style={{ background: 'var(--bg-secondary)', padding: '14px 16px', borderRadius: '12px' }}>
                                                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Email</p>
                                                <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--accent-primary)', margin: 0, wordBreak: 'break-all' }}>{data.email || '—'}</p>
                                            </div>
                                            <div style={{ background: 'var(--bg-secondary)', padding: '14px 16px', borderRadius: '12px' }}>
                                                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Phone / WhatsApp</p>
                                                <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                                    {data.phone || data.event?.organizer?.organizerWhatsApp || '—'}
                                                </p>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Full event + organizer details */}
                                    {data.event && (
                                        <section style={{ background: 'var(--bg-tertiary)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                            <label style={labelStyle}>Event & Organizer Details</label>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                                {[
                                                    { label: 'Organizer Name', value: data.event.organizer?.organizerName },
                                                    { label: 'Contact Email', value: data.event.organizer?.organizerContact },
                                                    { label: 'WhatsApp', value: data.event.organizer?.organizerWhatsApp },
                                                    { label: 'Website', value: data.event.organizer?.organizerWebsite },
                                                    { label: 'Instagram', value: data.event.organizer?.organizerInstagram },
                                                    { label: 'Alt Phone', value: data.event.organizer?.organizerPhone },
                                                    { label: 'Booking Method', value: data.event.bookingType },
                                                    { label: 'Booking Link', value: data.event.websiteLink || data.event.whatsappLink },
                                                ].filter(f => f.value).map((field, i) => (
                                                    <div key={i} style={{ background: 'var(--bg-secondary)', padding: '12px 14px', borderRadius: '10px' }}>
                                                        <p style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>{field.label}</p>
                                                        <p style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0, wordBreak: 'break-all' }}>{field.value}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </section>
                                    )}

                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right', margin: 0 }}>
                                        Submitted: {data.createdAt ? new Date(data.createdAt).toLocaleString() : '—'}
                                    </p>
                                </div>
                            ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                {/* Main Gallery / Carousel Preview */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    <div style={{ 
                                        width: '100%', height: '320px', borderRadius: '20px', 
                                        overflow: 'hidden', background: '#f1f5f9', // Light gray-blue background for transparency/containment
                                        border: '1px solid var(--border-color)', position: 'relative',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <img 
                                            src={requestType === 'creation' ? (data.image?.startsWith('http') ? data.image : `${BACKEND_URL}${data.image}`) : (data.logoUrl?.startsWith('http') ? data.logoUrl : `${BACKEND_URL}${data.logoUrl}`)} 
                                            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                                            alt="Request Context" 
                                        />
                                    </div>
                                    
                                    {data.images && data.images.length > 1 && (
                                        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '8px' }}>
                                            {data.images.map((img: string, i: number) => (
                                                <div key={i} style={{ width: '64px', height: '64px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--border-color)', background: '#f8fafc' }}>
                                                    <img src={img.startsWith('http') ? img : `${BACKEND_URL}${img}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Details Sections */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                    {/* 1. Header Info */}
                                    <section>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                                            <h3 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.1, flex: 1 }}>
                                                {requestType === 'creation' ? data.title : data.event?.title}
                                            </h3>
                                            <StatusBadge status={data.status} />
                                        </div>
                                        {data.isMultiDay && (
                                            <div style={{ display: 'flex', gap: '12px', marginTop: '12px', flexWrap: 'wrap' }}>
                                                <span style={{ ...tagStyle, background: 'rgba(59, 130, 246, 0.1)', color: 'var(--accent-primary)' }}>Multi-day</span>
                                            </div>
                                        )}
                                    </section>

                                    {/* 2. Logistics Grid */}
                                    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', background: 'var(--bg-tertiary)', padding: '20px', borderRadius: '16px' }}>
                                        <div>
                                            <label style={labelStyle}><Calendar size={14} style={{ marginRight: '6px' }} /> Date & Time</label>
                                            <p style={dataStyle}>{new Date(data.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{data.startTime} - {data.endTime}</p>
                                            {data.isMultiDay && data.endDate && (
                                                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>Ends: {new Date(data.endDate).toLocaleDateString()}</p>
                                            )}
                                        </div>
                                        <div>
                                            <label style={labelStyle}><MapPin size={14} style={{ marginRight: '6px' }} /> Location</label>
                                            <p style={dataStyle}>{data.venue}</p>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{data.city}</p>
                                            {data.coordinates && (
                                                <a href={`https://www.google.com/maps?q=${data.coordinates.lat},${data.coordinates.lng}`} target="_blank" rel="noreferrer" style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', textDecoration: 'none', display: 'block', marginTop: '4px' }}>View Coords (Map)</a>
                                            )}
                                        </div>
                                    </section>

                                    {/* 3. Description & Highlights */}
                                    <section>
                                        <label style={labelStyle}>About This Event</label>
                                        <p style={{ fontSize: '0.95rem', lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap' }}>{data.description}</p>
                                        
                                        {data.highlights && data.highlights.length > 0 && (
                                            <div style={{ marginTop: '16px' }}>
                                                <label style={labelStyle}>Highlights</label>
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                                                    {data.highlights.map((h: string, i: number) => (
                                                        <span key={i} style={pillStyle}>{h}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </section>

                                    {/* 4. Organizer & Booking */}
                                    <section style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <label style={labelStyle}><Users size={14} style={{ marginRight: '6px' }} /> Organizer Details</label>

                                        {/* Logo + name header */}
                                        {requestType === 'creation' && (
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: 'var(--bg-tertiary)', padding: '14px 16px', borderRadius: '12px' }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '12px', overflow: 'hidden', flexShrink: 0, background: 'var(--bg-secondary)', border: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                              {data.organizer?.organizerLogo ? (
                                                <img src={data.organizer.organizerLogo} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Logo" />
                                              ) : (
                                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                              )}
                                            </div>
                                            <div>
                                              <p style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>{data.organizer?.organizerName || '—'}</p>
                                              {data.organizer?.organizerBio && <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '4px 0 0', lineHeight: 1.5 }}>{data.organizer.organizerBio}</p>}
                                            </div>
                                          </div>
                                        )}

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            {/* Name — only for claim (creation already shown above) */}
                                            {requestType !== 'creation' && <div style={{ background: 'var(--bg-tertiary)', padding: '14px 16px', borderRadius: '12px' }}>
                                                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Name</p>
                                                <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                                                    {data.email || '—'}
                                                </p>
                                            </div>}

                                            {/* Email */}
                                            <div style={{ background: 'var(--bg-tertiary)', padding: '14px 16px', borderRadius: '12px' }}>
                                                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Email</p>
                                                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--accent-primary)', margin: 0, wordBreak: 'break-all' }}>
                                                    {data.organizer?.organizerContact || '—'}
                                                </p>
                                            </div>

                                            {/* WhatsApp */}
                                            <div style={{ background: 'var(--bg-tertiary)', padding: '14px 16px', borderRadius: '12px' }}>
                                                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>WhatsApp</p>
                                                <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                                    {data.organizer?.organizerWhatsApp || '—'}
                                                </p>
                                            </div>

                                            {/* Booking Method — placed next to WhatsApp */}
                                            <div style={{ background: 'var(--bg-tertiary)', padding: '14px 16px', borderRadius: '12px' }}>
                                                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Booking Method</p>
                                                <p style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0, textTransform: 'capitalize' }}>{data.bookingType || '—'}</p>
                                                {(data.whatsappLink || data.websiteLink) && (
                                                    <a href={data.whatsappLink || data.websiteLink} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)', textDecoration: 'none', display: 'block', marginTop: '4px', wordBreak: 'break-all' }}>
                                                        {data.whatsappLink || data.websiteLink}
                                                    </a>
                                                )}
                                            </div>

                                            {/* Phone */}
                                            {data.organizer?.organizerPhone && (
                                                <div style={{ background: 'var(--bg-tertiary)', padding: '14px 16px', borderRadius: '12px' }}>
                                                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Phone</p>
                                                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                                        {data.organizer.organizerPhone}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Website */}
                                            {data.organizer?.organizerWebsite && (
                                                <div style={{ background: 'var(--bg-tertiary)', padding: '14px 16px', borderRadius: '12px' }}>
                                                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Website</p>
                                                    <a href={data.organizer.organizerWebsite} target="_blank" rel="noreferrer" style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary)', textDecoration: 'none', wordBreak: 'break-all' }}>
                                                        {data.organizer.organizerWebsite}
                                                    </a>
                                                </div>
                                            )}

                                            {/* Instagram */}
                                            {data.organizer?.organizerInstagram && (
                                                <div style={{ background: 'var(--bg-tertiary)', padding: '14px 16px', borderRadius: '12px' }}>
                                                    <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 4px' }}>Instagram</p>
                                                    <p style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
                                                        {data.organizer.organizerInstagram}
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                    </section>

                                    {/* 5. Guests & Rules */}
                                    <section style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                                        <div>
                                            <label style={labelStyle}><Users size={14} style={{ marginRight: '6px' }} /> Artists / Guests List</label>
                                            {data.guests && data.guests.length > 0 ? (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                                                    {data.guests.map((g: string, i: number) => (
                                                        <span key={i} style={{ ...pillStyle, background: 'rgba(59, 130, 246, 0.05)' }}>{g}</span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No artists added</p>
                                            )}
                                        </div>
                                        
                                        <div>
                                            <label style={labelStyle}><XIcon size={14} style={{ marginRight: '6px' }} /> Restricted / Prohibited Items</label>
                                            {data.prohibitedItems && data.prohibitedItems.length > 0 ? (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '4px' }}>
                                                    {data.prohibitedItems.map((item: string, i: number) => (
                                                        <span key={i} style={{ ...pillStyle, color: 'var(--error)', background: 'rgba(220, 38, 38, 0.05)', border: '1px solid rgba(220, 38, 38, 0.1)' }}>{item}</span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No restrictions specified</p>
                                            )}
                                        </div>

                                        <div style={{ background: '#fafafa', padding: '20px', borderRadius: '16px', border: '1px solid var(--border-color)' }}>
                                            <label style={labelStyle}>Terms & Conditions</label>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                                {data.termsAndConditions || 'User has not provided any specific terms and conditions for this event.'}
                                            </p>
                                        </div>
                                    </section>

                                    {/* 6. Viewers */}
                                    <section style={{ borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                                        <label style={{ ...labelStyle, marginBottom: '14px' }}>
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginRight: '6px' }}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                            Viewers ({viewers.length})
                                        </label>
                                        {viewersLoading ? (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                                <Loader2 size={14} className="refresh-spinner" /> Loading viewers...
                                            </div>
                                        ) : viewers.length === 0 ? (
                                            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>No views recorded yet.</p>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '220px', overflowY: 'auto' }}>
                                                {viewers.slice().reverse().map((v: any, i: number) => (
                                                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 12px', background: 'var(--bg-tertiary)', borderRadius: '10px', border: '1px solid var(--border-color)' }}>
                                                        <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: v.name === 'Guest' ? 'rgba(100,116,139,0.1)' : 'rgba(37,99,235,0.08)', border: `1px solid ${v.name === 'Guest' ? 'var(--border-color)' : 'rgba(37,99,235,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={v.name === 'Guest' ? 'var(--text-muted)' : 'var(--accent-primary)'} strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                                                        </div>
                                                        <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: v.name === 'Guest' ? 400 : 600, color: v.name === 'Guest' ? 'var(--text-muted)' : 'var(--text-primary)' }}>{v.name}</span>
                                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flexShrink: 0 }}>{v.viewedAt ? new Date(v.viewedAt).toLocaleString() : ''}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </section>

                                    {/* 7. Video Preview */}
                                    {data.video && (
                                        <section>
                                            <label style={labelStyle}><Video size={14} style={{ marginRight: '6px' }} /> Promotional Video</label>
                                            <div style={{ width: '100%', height: '200px', borderRadius: '12px', overflow: 'hidden', background: '#000', marginTop: '8px' }}>
                                                <video src={data.video.startsWith('http') ? data.video : `${BACKEND_URL}${data.video}`} controls style={{ width: '100%', height: '100%' }} />
                                            </div>
                                        </section>
                                    )}
                                </div>
                             </div>
                            )
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Could not load data.</div>
                        )}
                    </div>

                    {/* Action Footer */}
                    {data && (
                        <div style={{
                            padding: '24px 32px', background: 'rgba(0,0,0,0.02)',
                            borderTop: '1px solid var(--border-color)', display: 'flex',
                            justifyContent: 'flex-end', gap: '16px'
                        }}>
                            {data.status === 'pending' ? (
                            <>
                                <button 
                                    onClick={() => handleInternalAction('rejected')}
                                    style={{ 
                                        padding: '12px 24px', borderRadius: '30px', fontWeight: 700, fontSize: '0.9rem',
                                        color: 'var(--error)', background: 'rgba(220, 38, 38, 0.05)', border: '1px solid rgba(220, 38, 38, 0.2)',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: '0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.1)'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(220, 38, 38, 0.05)'}
                                >
                                    <XIcon size={18} /> Reject Request
                                </button>
                                <button 
                                    onClick={() => handleInternalAction('approved')}
                                    style={{ 
                                        padding: '12px 28px', borderRadius: '30px', fontWeight: 700, fontSize: '0.9rem',
                                        color: 'white', background: 'var(--accent-gradient)', boxShadow: '0 4px 15px rgba(37, 99, 235, 0.2)',
                                        cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', transition: '0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                    onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <Check size={18} /> Approve & Sync
                                </button>
                            </>
                        ) : data.status === 'approved' ? (
                            <button 
                                onClick={() => handleInternalAction('rejected')}
                                style={{ 
                                    padding: '12px 28px', borderRadius: '30px', fontWeight: 700, fontSize: '0.9rem',
                                    color: 'white', background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)', boxShadow: '0 4px 15px rgba(220, 38, 38, 0.2)',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', border: 'none', transition: '0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <Trash2 size={18} /> Remove Event
                            </button>
                        ) : (
                            <button 
                                onClick={onClose}
                                style={{ 
                                    padding: '12px 28px', borderRadius: '30px', fontWeight: 700, fontSize: '0.9rem',
                                    color: 'var(--text-secondary)', background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)',
                                    cursor: 'pointer', transition: '0.2s'
                                }}
                            >
                                Close View
                            </button>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

const labelStyle: React.CSSProperties = {
    fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px',
    display: 'flex', alignItems: 'center'
};

const dataStyle: React.CSSProperties = {
    fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)'
};

const tagStyle: React.CSSProperties = {
    padding: '4px 12px', background: 'var(--bg-tertiary)', borderRadius: '20px',
    fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-secondary)',
    border: '1px solid var(--border-color)'
};

const pillStyle: React.CSSProperties = {
    padding: '6px 14px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '30px',
    fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-primary)',
    border: '1px solid rgba(59, 130, 246, 0.1)'
};


export default ViewRequestModal;
