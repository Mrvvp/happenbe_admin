import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { X, Upload, Video, Save, Shield, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchSuggestions, type Suggestion } from '../utils/geocoding';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api/admin';

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

const STEPS = [
    { id: 1, label: 'Details' },
    { id: 2, label: 'Organizer' },
    { id: 3, label: 'Media' },
    { id: 4, label: 'Booking' },
];

// ── Time Picker ────────────────────────────────────────────────────────────
const TP_HOURS = [1,2,3,4,5,6,7,8,9,10,11,12];
const TP_MINUTES = [0,5,10,15,20,25,30,35,40,45,50,55];
const TP_AMPM = ['AM','PM'];
const TP_ITEM_H = 36;

const TimePicker = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const hourRef = useRef<HTMLDivElement>(null);
    const minRef  = useRef<HTMLDivElement>(null);
    const ampmRef = useRef<HTMLDivElement>(null);

    const parse = (val: string) => {
        if (!val) return { h: 12, m: 0, ap: 'AM' };
        const [hh, mm] = val.split(':').map(Number);
        return { h: hh % 12 || 12, m: Math.round(mm / 5) * 5 % 60, ap: hh >= 12 ? 'PM' : 'AM' };
    };

    const { h: initH, m: initM, ap: initAp } = parse(value);
    const [selH, setSelH] = useState(initH);
    const [selM, setSelM] = useState(initM);
    const [selAp, setSelAp] = useState(initAp);
    const selHRef = useRef(initH);
    const selMRef = useRef(initM);
    const selApRef = useRef(initAp);

    useEffect(() => {
        const { h, m, ap } = parse(value);
        setSelH(h); selHRef.current = h;
        setSelM(m); selMRef.current = m;
        setSelAp(ap); selApRef.current = ap;
    }, [value]);

    const commit = (h: number, m: number, ap: string) => {
        let h24 = h % 12;
        if (ap === 'PM') h24 += 12;
        onChange(`${String(h24).padStart(2,'0')}:${String(m).padStart(2,'0')}`);
    };

    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
                commit(selHRef.current, selMRef.current, selApRef.current);
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    useEffect(() => {
        if (!open) return;
        requestAnimationFrame(() => {
            if (hourRef.current) hourRef.current.scrollTop = TP_HOURS.indexOf(selH) * TP_ITEM_H;
            if (minRef.current)  minRef.current.scrollTop  = TP_MINUTES.indexOf(selM) * TP_ITEM_H;
            if (ampmRef.current) ampmRef.current.scrollTop = (selAp === 'PM' ? 1 : 0) * TP_ITEM_H;
        });
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const timers: ReturnType<typeof setTimeout>[] = [0 as any, 0 as any, 0 as any];
        const makeHandler = (ref: React.RefObject<HTMLDivElement | null>, items: (number|string)[], setFn: (v: any) => void, storeRef: React.MutableRefObject<any>, idx: number) => () => {
            if (!ref.current) return;
            const i = Math.round(ref.current.scrollTop / TP_ITEM_H);
            const val = items[Math.max(0, Math.min(i, items.length - 1))];
            setFn(val); storeRef.current = val;
            clearTimeout(timers[idx]);
            timers[idx] = setTimeout(() => commit(selHRef.current, selMRef.current, selApRef.current), 200);
        };
        const onHour = makeHandler(hourRef, TP_HOURS, setSelH, selHRef, 0);
        const onMin  = makeHandler(minRef,  TP_MINUTES, setSelM, selMRef, 1);
        const onAp   = makeHandler(ampmRef, TP_AMPM, setSelAp, selApRef, 2);
        const hEl = hourRef.current, mEl = minRef.current, apEl = ampmRef.current;
        hEl?.addEventListener('scroll', onHour, { passive: true });
        mEl?.addEventListener('scroll', onMin,  { passive: true });
        apEl?.addEventListener('scroll', onAp,  { passive: true });
        return () => {
            hEl?.removeEventListener('scroll', onHour);
            mEl?.removeEventListener('scroll', onMin);
            apEl?.removeEventListener('scroll', onAp);
            timers.forEach(clearTimeout);
        };
    }, [open]);

    const scrollTo = (ref: React.RefObject<HTMLDivElement | null>, top: number) => ref.current?.scrollTo({ top, behavior: 'smooth' });
    const { h: dH, m: dM, ap: dAp } = parse(value);
    const display = value ? `${dH}:${String(dM).padStart(2,'0')} ${dAp}` : '';

    const colStyle: React.CSSProperties = {
        overflowY: 'scroll', height: TP_ITEM_H * 3, scrollbarWidth: 'none' as any,
        paddingTop: TP_ITEM_H, paddingBottom: TP_ITEM_H,
        scrollSnapType: 'y mandatory' as any, overscrollBehavior: 'contain',
        WebkitOverflowScrolling: 'touch' as any,
    };
    const itemStyle = (sel: boolean): React.CSSProperties => ({
        height: TP_ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: sel ? '1.1rem' : '1rem', fontWeight: sel ? 700 : 400,
        color: sel ? '#000' : '#b0b0b0',
        cursor: 'pointer', flexShrink: 0,
        scrollSnapAlign: 'center' as any, userSelect: 'none',
        transition: 'color 0.1s, font-size 0.1s',
    });

    return (
        <div ref={rootRef} style={{ position: 'relative', width: '100%' }}>
            <div style={{ ...inputBase, cursor: 'pointer', userSelect: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }} onClick={() => setOpen(o => !o)}>
                <span style={display ? { color: '#0f172a' } : { color: '#94a3b8', fontWeight: 400 }}>{display || placeholder}</span>
                {display && (
                    <span
                        onClick={e => { e.stopPropagation(); onChange(''); setOpen(false); }}
                        style={{ color: '#94a3b8', fontSize: '1.1rem', lineHeight: 1, padding: '0 2px', cursor: 'pointer', flexShrink: 0 }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#94a3b8')}
                    >×</span>
                )}
            </div>
            {open && (
                <div style={{ position: 'absolute', top: 'calc(100% + 8px)', left: 0, zIndex: 9999, background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '16px', boxShadow: '0 10px 40px rgba(0,0,0,0.12)', display: 'flex', overflow: 'hidden', width: '200px' }}>
                    <div style={{ position: 'absolute', left: 0, right: 0, pointerEvents: 'none', zIndex: 2, top: '50%', transform: 'translateY(-50%)', height: TP_ITEM_H, background: 'rgba(0,0,0,0.05)', borderTop: '1px solid rgba(0,0,0,0.08)', borderBottom: '1px solid rgba(0,0,0,0.08)' }} />
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: TP_ITEM_H, pointerEvents: 'none', zIndex: 2, background: 'linear-gradient(to bottom, #fff 30%, transparent 100%)' }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: TP_ITEM_H, pointerEvents: 'none', zIndex: 2, background: 'linear-gradient(to top, #fff 30%, transparent 100%)' }} />
                    <div ref={hourRef} className="time-picker-col" style={{ ...colStyle, flex: 1 }}>
                        {TP_HOURS.map(hv => <div key={hv} style={itemStyle(hv === selH)} onClick={() => { setSelH(hv); selHRef.current = hv; scrollTo(hourRef, TP_HOURS.indexOf(hv) * TP_ITEM_H); commit(hv, selMRef.current, selApRef.current); }}>{hv}</div>)}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '12px', fontSize: '1rem', fontWeight: 700, color: '#b0b0b0', flexShrink: 0, zIndex: 3 }}>:</div>
                    <div ref={minRef} className="time-picker-col" style={{ ...colStyle, flex: 1 }}>
                        {TP_MINUTES.map(mv => <div key={mv} style={itemStyle(mv === selM)} onClick={() => { setSelM(mv); selMRef.current = mv; scrollTo(minRef, TP_MINUTES.indexOf(mv) * TP_ITEM_H); commit(selHRef.current, mv, selApRef.current); }}>{String(mv).padStart(2,'0')}</div>)}
                    </div>
                    <div ref={ampmRef} className="time-picker-col" style={{ ...colStyle, flex: 'none', width: '58px' }}>
                        {TP_AMPM.map((apv, i) => <div key={apv} style={{ ...itemStyle(apv === selAp), fontSize: apv === selAp ? '0.85rem' : '0.8rem', letterSpacing: '0.05em' }} onClick={() => { setSelAp(apv); selApRef.current = apv; scrollTo(ampmRef, i * TP_ITEM_H); commit(selHRef.current, selMRef.current, apv); setOpen(false); }}>{apv}</div>)}
                    </div>
                </div>
            )}
        </div>
    );
};

// ── Shared style constants ─────────────────────────────────────────────────
const inputBase: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box',
    padding: '0.9rem 1.1rem',
    background: 'rgba(0,0,0,0.03)',
    border: '1.5px solid rgba(0,0,0,0.1)',
    borderRadius: '14px',
    color: 'var(--text-primary)',
    fontSize: '0.95rem', fontFamily: 'inherit',
    transition: 'all 0.25s ease', outline: 'none',
};

const labelBase: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: '5px',
    fontSize: '0.75rem', fontWeight: 700,
    color: 'var(--text-secondary)',
    marginBottom: '8px',
    textTransform: 'uppercase', letterSpacing: '0.06em',
};

const fieldBase: React.CSSProperties = { display: 'flex', flexDirection: 'column' };

const doneBtnStyle: React.CSSProperties = {
    padding: '0 22px', borderRadius: '14px', border: 'none',
    background: 'var(--accent-gradient)',
    color: '#fff', fontWeight: 700, fontSize: '0.78rem',
    letterSpacing: '0.05em', cursor: 'pointer',
    whiteSpace: 'nowrap', flexShrink: 0,
    transition: 'transform 0.2s, box-shadow 0.2s',
};

// ── Helpers ────────────────────────────────────────────────────────────────
const fmtDate = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const parseDate = (s: string): Date | null =>
    s ? new Date(s.replace(/-/g, '/')) : null;

const fmtTime = (time24: string): string => {
    if (!time24) return '';
    if (time24.includes('AM') || time24.includes('PM')) return time24;
    const [h, m] = time24.split(':');
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${m || '00'} ${ampm}`;
};


function focusOrange(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    e.target.style.borderColor = 'var(--accent-primary)';
    e.target.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.12)';
    e.target.style.background = 'rgba(37,99,235,0.02)';
}
function blurField(e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const v = !!e.target.value;
    e.target.style.borderColor = v ? '#29B6F6' : 'rgba(0,0,0,0.1)';
    e.target.style.boxShadow = 'none';
    e.target.style.background = v ? 'rgba(41,182,246,0.04)' : 'rgba(0,0,0,0.03)';
}

// ── Component ──────────────────────────────────────────────────────────────
const CreateEventModal = ({ isOpen, onClose, onSuccess }: CreateEventModalProps) => {
    const { token } = useAuth();
    const isMobile = window.innerWidth < 768;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [imagePreviews, setImagePreviews] = useState<string[]>([]);
    const [videoPreview, setVideoPreview] = useState<string | null>(null);
    const [guestInput, setGuestInput] = useState('');
    const [termInput, setTermInput] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [locationSuggestions, setLocationSuggestions] = useState<Suggestion[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const selectionMade = useRef(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);
    const venueContainerRef = useRef<HTMLDivElement>(null);

    const [eventData, setEventData] = useState({
        title: '', date: '', endDate: '', isMultiDay: false,
        startTime: '', endTime: '',
        venue: '', city: '', description: '',
        guests: [] as string[], termsAndConditions: [] as string[],
        organizerName: '', organizerContact: '',
        organizerWebsite: '', organizerWhatsApp: '', organizerPhone: '',
        organizerInstagram: '', organizerBio: '',
        bookingType: 'whatsapp' as string,
        websiteLink: '', whatsappLink: '',
        lat: '', lng: '',
    });

    const [files, setFiles] = useState<{ images: File[]; video: File | null }>({ images: [], video: null });

    const canContinue = () => {
        if (currentStep === 1) {
            const base = eventData.title && eventData.date && eventData.venue && eventData.city;
            return eventData.isMultiDay ? !!(base && eventData.endDate) : !!base;
        }
        if (currentStep === 2) return !!eventData.organizerName;
        if (currentStep === 3) return files.images.length > 0;
        if (currentStep === 4) {
            if (eventData.bookingType === 'whatsapp') return !!eventData.whatsappLink || !!eventData.organizerWhatsApp;
            if (eventData.bookingType === 'website') return !!eventData.websiteLink || !!eventData.organizerWebsite;
            return true;
        }
        return true;
    };

    // Close suggestions whenever step changes
    useEffect(() => {
        setShowSuggestions(false);
        setLocationSuggestions([]);
    }, [currentStep]);

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (venueContainerRef.current && !venueContainerRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        if (showSuggestions) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showSuggestions]);

    useEffect(() => {
        if (selectionMade.current) { selectionMade.current = false; return; }
        if (currentStep !== 1) return;
        const t = setTimeout(async () => {
            if (eventData.venue.trim().length >= 2) {
                setIsSearching(true);
                const s = await fetchSuggestions(eventData.venue);
                setLocationSuggestions(s); setShowSuggestions(s.length > 0); setIsSearching(false);
            } else { setLocationSuggestions([]); setShowSuggestions(false); }
        }, 500);
        return () => clearTimeout(t);
    }, [eventData.venue]);

    const handleText = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'venue') selectionMade.current = false;
        setEventData(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectSuggestion = (s: Suggestion) => {
        selectionMade.current = true;
        setEventData(prev => ({ ...prev, venue: s.name, city: s.city || prev.city, lat: s.lat.toString(), lng: s.lng.toString() }));
        setShowSuggestions(false);
    };

    const addGuest = () => { if (guestInput.trim()) { setEventData(p => ({ ...p, guests: [...p.guests, guestInput.trim()] })); setGuestInput(''); } };
    const addTerm = () => { if (termInput.trim()) { setEventData(p => ({ ...p, termsAndConditions: [...p.termsAndConditions, termInput.trim()] })); setTermInput(''); } };

    const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const f = Array.from(e.target.files);
            setFiles(p => ({ ...p, images: [...p.images, ...f] }));
            setImagePreviews(p => [...p, ...f.map(file => URL.createObjectURL(file))]);
        }
    };
    const handleVideo = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFiles(p => ({ ...p, video: e.target.files![0] }));
            setVideoPreview(URL.createObjectURL(e.target.files![0]));
        }
    };
    const removeImage = (i: number) => {
        setFiles(p => ({ ...p, images: p.images.filter((_, idx) => idx !== i) }));
        setImagePreviews(p => p.filter((_, idx) => idx !== i));
    };

    const handleSubmit = async () => {
        if (!canContinue()) return;
        setIsSubmitting(true);
        try {
            const fd = new FormData();
            Object.entries(eventData).forEach(([k, v]) => {
                if (k === 'guests' || k === 'termsAndConditions') (v as string[]).forEach(item => fd.append(k, item));
                else if (k === 'startTime' || k === 'endTime') fd.append(k, fmtTime(v as string));
                else if (k !== 'lat' && k !== 'lng') fd.append(k, v.toString());
            });
            if (eventData.lat && eventData.lng) { fd.append('lat', eventData.lat); fd.append('lng', eventData.lng); }
            fd.append('category', 'Other');
            files.images.forEach(img => fd.append('images', img));
            if (files.video) fd.append('video', files.video);
            const res = await fetch(`${API_BASE.replace(/\/$/, '')}/events`, { method: 'POST', body: fd, headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) { setIsSuccess(true); onSuccess(); }
            else { const err = await res.json(); alert(`Error: ${err.message}`); }
        } catch (err) { console.error(err); alert('Failed to create event'); }
        finally { setIsSubmitting(false); }
    };

    const resetForm = () => {
        setEventData({ title: '', date: '', endDate: '', isMultiDay: false, startTime: '', endTime: '', venue: '', city: '', description: '', guests: [], termsAndConditions: [], organizerName: '', organizerContact: '', organizerWebsite: '', organizerWhatsApp: '', organizerPhone: '', organizerInstagram: '', organizerBio: '', bookingType: 'whatsapp', websiteLink: '', whatsappLink: '', lat: '', lng: '' });
        setFiles({ images: [], video: null }); setImagePreviews([]); setVideoPreview(null);
        setCurrentStep(1); setGuestInput(''); setTermInput('');
    };

    if (!isOpen) return null;

    // ── Reusable tag pill ──────────────────────────────────────────────────
    const TagPill = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 11px', borderRadius: '10px', background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.1)', fontSize: '0.875rem', color: 'var(--text-primary)', fontWeight: 500 }}>
            {label}
            <button type="button" onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(0,0,0,0.3)', fontSize: '1.1rem', lineHeight: 1, padding: 0, display: 'flex' }}
                onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-primary)')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,0,0,0.3)')}
            >×</button>
        </div>
    );

    return (
        <AnimatePresence>
            <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', zIndex: 1000, display: 'flex', alignItems: isMobile ? 'flex-end' : 'center', justifyContent: 'center', padding: isMobile ? '0' : '16px' }}>
                <motion.div
                    initial={{ opacity: 0, scale: isMobile ? 1 : 0.94, y: isMobile ? 40 : 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: isMobile ? 1 : 0.94, y: isMobile ? 40 : 20 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    style={{ width: '100%', maxWidth: isMobile ? '100%' : '860px', maxHeight: isMobile ? '95vh' : '92vh', background: 'var(--bg-secondary)', borderRadius: isMobile ? '20px 20px 0 0' : '24px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 32px 64px rgba(0,0,0,0.2)' }}
                >
                    {isSuccess ? (
                        /* ── Success Screen ─────────────────────────────── */
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '20px', padding: '48px 32px', textAlign: 'center' }}>
                            <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(76,175,80,0.1)', border: '1.5px solid rgba(76,175,80,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#4caf50" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"/>
                                </svg>
                            </div>
                            <div>
                                <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 10px', background: 'linear-gradient(135deg, #1a1a1a 0%, #555 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                                    Event Listed!
                                </h2>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.6, maxWidth: '320px' }}>
                                    The event is now live on the map. A discovery email has been sent to the organizer with a claim link.
                                </p>
                            </div>
                            <button
                                onClick={() => { resetForm(); setIsSuccess(false); onClose(); }}
                                style={{ padding: '12px 36px', borderRadius: '14px', border: 'none', background: 'var(--accent-gradient)', color: '#fff', fontWeight: 700, fontSize: '0.95rem', cursor: 'pointer', fontFamily: 'inherit' }}
                            >
                                Done
                            </button>
                        </div>
                    ) : (<>
                    {/* ── Header ───────────────────────────────────────── */}
                    <div style={{ padding: isMobile ? '16px 16px 14px' : '24px 32px 20px', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
                            <div>
                                <h2 style={{ fontSize: '1.55rem', fontWeight: 800, margin: 0, background: 'linear-gradient(135deg, #1a1a1a 0%, #555 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.03em' }}>List New Event</h2>
                                <p style={{ margin: '4px 0 0', fontSize: '0.83rem', color: 'var(--text-muted)' }}>Add a scraped event — organizer fills booking details after claiming.</p>
                            </div>
                            <button onClick={onClose} style={{ width: '34px', height: '34px', borderRadius: '10px', background: 'rgba(0,0,0,0.05)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', transition: 'all 0.2s', flexShrink: 0 }}
                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(37,99,235,0.1)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}
                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; e.currentTarget.style.color = 'var(--text-muted)'; }}
                            ><X size={18} /></button>
                        </div>

                        {/* Step indicator */}
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
                            {STEPS.map((step, idx) => {
                                const isActive = currentStep === step.id;
                                const isDone = currentStep > step.id;
                                return (
                                    <div key={step.id} style={{ display: 'flex', alignItems: 'flex-start', flex: idx < STEPS.length - 1 ? 1 : 'none', minWidth: 0 }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                                            <div style={{ width: '48px', height: '48px', borderRadius: '10px', background: isDone ? '#4caf50' : isActive ? 'var(--accent-gradient)' : 'rgba(0,0,0,0.06)', color: (isActive || isDone) ? '#fff' : 'rgba(0,0,0,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.1rem', border: isActive || isDone ? 'none' : '2px solid rgba(0,0,0,0.08)', boxShadow: isActive ? '0 8px 18px rgba(37,99,235,0.28), 0 0 0 4px rgba(37,99,235,0.1)' : isDone ? '0 4px 10px rgba(76,175,80,0.25)' : 'none', transform: isActive ? 'scale(1.08)' : 'scale(1)', transition: 'all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                                                {isDone ? '✓' : step.id}
                                            </div>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', color: isDone ? '#4caf50' : isActive ? 'var(--accent-primary)' : 'rgba(0,0,0,0.32)', transition: 'color 0.3s', whiteSpace: 'nowrap' }}>{step.label}</span>
                                        </div>
                                        {idx < STEPS.length - 1 && (
                                            <div style={{ flex: 1, height: '2px', background: isDone ? '#4caf50' : 'rgba(0,0,0,0.1)', marginTop: '23px', marginLeft: '10px', marginRight: '10px', borderRadius: '2px', transition: 'background 0.4s' }} />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* ── Scrollable Content ───────────────────────────── */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: isMobile ? '16px' : '32px' }}>

                        {/* STEP 1 */}
                        {currentStep === 1 && (
                            <motion.div key="s1" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 4px', background: 'linear-gradient(135deg, #1a1a1a 0%, #555 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>Event Details</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 26px' }}>Core info scraped from the listing.</p>

                                {/* 2-column grid on desktop, 1-column on mobile */}
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '14px' : '20px' }}>

                                    {/* Title */}
                                    <div style={fieldBase}>
                                        <label style={labelBase}>Event Title <span style={{ color: 'var(--accent-primary)' }}>*</span></label>
                                        <input style={inputBase} name="title" value={eventData.title} onChange={handleText} placeholder="Name of the event" onFocus={focusOrange} onBlur={blurField} />
                                    </div>

                                    {/* Date — single or range DatePicker */}
                                    <div style={fieldBase}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <label style={{ ...labelBase, marginBottom: 0 }}>{eventData.isMultiDay ? 'Date Range' : 'Date'} <span style={{ color: 'var(--accent-primary)' }}>*</span></label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '5px', cursor: 'pointer', fontSize: '0.72rem', fontWeight: 700, color: 'var(--accent-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                <input type="checkbox" checked={eventData.isMultiDay} onChange={e => setEventData(p => ({ ...p, isMultiDay: e.target.checked, endDate: '' }))} style={{ accentColor: 'var(--accent-primary)', cursor: 'pointer' }} />
                                                Multi-day
                                            </label>
                                        </div>
                                        {eventData.isMultiDay ? (
                                            <DatePicker
                                                selectsRange
                                                startDate={parseDate(eventData.date) ?? undefined}
                                                endDate={parseDate(eventData.endDate) ?? undefined}
                                                onChange={(dates) => {
                                                    const [s, e] = dates;
                                                    setEventData(p => ({ ...p, date: s ? fmtDate(s) : '', endDate: e ? fmtDate(e) : '' }));
                                                }}
                                                dateFormat="dd/MM/yyyy"
                                                placeholderText="Select date range"
                                                className={`admin-picker-input${eventData.date ? ' has-value' : ''}`}
                                                showPopperArrow={false}
                                                disabledKeyboardNavigation
                                            />
                                        ) : (
                                            <DatePicker
                                                selected={parseDate(eventData.date)}
                                                onChange={(date: Date | null) => setEventData(p => ({ ...p, date: date ? fmtDate(date) : '', endDate: '' }))}
                                                dateFormat="dd/MM/yyyy"
                                                placeholderText="Select date"
                                                className={`admin-picker-input${eventData.date ? ' has-value' : ''}`}
                                                showPopperArrow={false}
                                                disabledKeyboardNavigation
                                            />
                                        )}
                                    </div>

                                    {/* Start Time */}
                                    <div style={fieldBase}>
                                        <label style={labelBase}>Starts At <span style={{ fontSize: '0.7rem', fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-muted)', marginLeft: '2px' }}>(optional)</span></label>
                                        <TimePicker
                                            value={eventData.startTime}
                                            onChange={(val) => setEventData(p => ({ ...p, startTime: val }))}
                                            placeholder="Select start time"
                                        />
                                    </div>

                                    {/* End Time */}
                                    <div style={fieldBase}>
                                        <label style={labelBase}>Ends At <span style={{ fontSize: '0.7rem', fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: 'var(--text-muted)', marginLeft: '2px' }}>(optional)</span></label>
                                        <TimePicker
                                            value={eventData.endTime}
                                            onChange={(val) => setEventData(p => ({ ...p, endTime: val }))}
                                            placeholder="Select end time"
                                        />
                                    </div>

                                    {/* Venue */}
                                    <div ref={venueContainerRef} style={{ ...fieldBase, position: 'relative' }}>
                                        <label style={labelBase}>Venue <span style={{ color: 'var(--accent-primary)' }}>*</span></label>
                                        <div style={{ position: 'relative' }}>
                                            <input style={{ ...inputBase, paddingRight: isSearching ? '110px' : '1.1rem' }} name="venue" value={eventData.venue} onChange={handleText} placeholder="Search venue..." onFocus={focusOrange} onBlur={blurField} />
                                            {isSearching && (
                                                <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.72rem', background: 'rgba(37,99,235,0.9)', color: '#fff', padding: '4px 10px', borderRadius: '20px', pointerEvents: 'none' }}>
                                                    <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} /> Finding...
                                                </div>
                                            )}
                                        </div>
                                        {showSuggestions && locationSuggestions.length > 0 && (
                                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, marginTop: '8px', background: '#fff', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.1)', boxShadow: '0 16px 40px rgba(0,0,0,0.14)', overflow: 'hidden' }}>
                                                {locationSuggestions.map((s, i) => (
                                                    <div key={i} onClick={() => handleSelectSuggestion(s)}
                                                        style={{ padding: '11px 18px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: '12px', borderBottom: i < locationSuggestions.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none', transition: 'background 0.15s' }}
                                                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(37,99,235,0.06)')}
                                                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                                                    >
                                                        <span style={{ marginTop: '3px' }}>📍</span>
                                                        <div>
                                                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>{s.name}</div>
                                                            {s.city && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{s.city}</div>}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* City */}
                                    <div style={fieldBase}>
                                        <label style={labelBase}>City <span style={{ color: 'var(--accent-primary)' }}>*</span></label>
                                        <input style={inputBase} name="city" value={eventData.city} onChange={handleText} placeholder="City (auto-fills on selection)" onFocus={focusOrange} onBlur={blurField} />
                                    </div>

                                    {/* Description — full-width on both layouts */}
                                    <div style={{ ...fieldBase, gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                                        <label style={labelBase}>Description <span style={{ color: 'var(--accent-primary)' }}>*</span></label>
                                        <textarea style={{ ...inputBase, minHeight: '88px', resize: 'vertical' }} name="description" value={eventData.description} onChange={handleText} placeholder="What is this event about?" onFocus={focusOrange} onBlur={blurField} />
                                    </div>

                                    {/* Guests */}
                                    <div style={fieldBase}>
                                        <label style={labelBase}>Guests / Performers</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input style={{ ...inputBase, flex: 1 }} value={guestInput} onChange={e => setGuestInput(e.target.value)} placeholder="Guest name"
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addGuest())}
                                                onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.12)'; }}
                                                onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.1)'; e.target.style.boxShadow = 'none'; }}
                                            />
                                            <button type="button" onClick={addGuest} style={doneBtnStyle}
                                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 14px rgba(37,99,235,0.3)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                                            >DONE</button>
                                        </div>
                                        {eventData.guests.length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                                                {eventData.guests.map((g, i) => (
                                                    <TagPill key={i} label={g} onRemove={() => setEventData(p => ({ ...p, guests: p.guests.filter((_, idx) => idx !== i) }))} />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Terms */}
                                    <div style={fieldBase}>
                                        <label style={labelBase}><Shield size={11} /> Terms & Conditions</label>
                                        <div style={{ display: 'flex', gap: '8px' }}>
                                            <input style={{ ...inputBase, flex: 1 }} value={termInput} onChange={e => setTermInput(e.target.value)} placeholder="Enter a term"
                                                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTerm())}
                                                onFocus={e => { e.target.style.borderColor = 'var(--accent-primary)'; e.target.style.boxShadow = '0 0 0 4px rgba(37,99,235,0.12)'; }}
                                                onBlur={e => { e.target.style.borderColor = 'rgba(0,0,0,0.1)'; e.target.style.boxShadow = 'none'; }}
                                            />
                                            <button type="button" onClick={addTerm} style={doneBtnStyle}
                                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 14px rgba(37,99,235,0.3)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
                                            >DONE</button>
                                        </div>
                                        {eventData.termsAndConditions.length > 0 && (
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                                                {eventData.termsAndConditions.map((t, i) => (
                                                    <TagPill key={i} label={t} onRemove={() => setEventData(p => ({ ...p, termsAndConditions: p.termsAndConditions.filter((_, idx) => idx !== i) }))} />
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </motion.div>
                        )}

                        {/* STEP 2 */}
                        {currentStep === 2 && (
                            <motion.div key="s2" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 4px', background: 'linear-gradient(135deg, #1a1a1a 0%, #555 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>Organizer Info</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 26px', lineHeight: 1.5 }}>Fill in all known organizer details.</p>
                                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? '14px' : '20px' }}>
                                    <div style={fieldBase}>
                                        <label style={labelBase}>Organizer / Company <span style={{ color: 'var(--accent-primary)' }}>*</span></label>
                                        <input style={inputBase} name="organizerName" value={eventData.organizerName} onChange={handleText} placeholder="Organizer or company name" onFocus={focusOrange} onBlur={blurField} />
                                    </div>
                                    <div style={fieldBase}>
                                        <label style={labelBase}>Contact Email</label>
                                        <input type="email" style={inputBase} name="organizerContact" value={eventData.organizerContact} onChange={handleText} placeholder="organizer@email.com" onFocus={focusOrange} onBlur={blurField} />
                                    </div>
                                    <div style={fieldBase}>
                                        <label style={labelBase}>WhatsApp Number</label>
                                        <input style={inputBase} name="organizerWhatsApp" value={eventData.organizerWhatsApp} onChange={handleText} placeholder="10-digit number" onFocus={focusOrange} onBlur={blurField} />
                                    </div>
                                    <div style={fieldBase}>
                                        <label style={labelBase}>Phone</label>
                                        <input style={inputBase} name="organizerPhone" value={eventData.organizerPhone} onChange={handleText} placeholder="Phone number" onFocus={focusOrange} onBlur={blurField} />
                                    </div>
                                    <div style={fieldBase}>
                                        <label style={labelBase}>Website</label>
                                        <input style={inputBase} name="organizerWebsite" value={eventData.organizerWebsite} onChange={handleText} placeholder="https://..." onFocus={focusOrange} onBlur={blurField} />
                                    </div>
                                    <div style={fieldBase}>
                                        <label style={labelBase}>Instagram</label>
                                        <input style={inputBase} name="organizerInstagram" value={eventData.organizerInstagram} onChange={handleText} placeholder="@handle or URL" onFocus={focusOrange} onBlur={blurField} />
                                    </div>
                                    <div style={{ ...fieldBase, gridColumn: isMobile ? 'span 1' : 'span 2' }}>
                                        <label style={labelBase}>Organizer Bio</label>
                                        <textarea style={{ ...inputBase, minHeight: '72px', resize: 'vertical' }} name="organizerBio" value={eventData.organizerBio} onChange={handleText} placeholder="Short bio about the organizer..." onFocus={focusOrange} onBlur={blurField} />
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 3 */}
                        {currentStep === 3 && (
                            <motion.div key="s3" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 4px', background: 'linear-gradient(135deg, #1a1a1a 0%, #555 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>Event Media</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 26px', lineHeight: 1.5 }}>Upload the poster scraped from the listing. At least one image required.</p>

                                <div style={fieldBase}>
                                    <label style={labelBase}>Event Poster / Images <span style={{ color: 'var(--accent-primary)' }}>*</span></label>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: '12px', marginTop: '4px' }}>
                                        {imagePreviews.map((preview, i) => (
                                            <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: '16px', overflow: 'hidden', border: '2px solid rgba(0,0,0,0.08)' }}>
                                                <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button type="button" onClick={() => removeImage(i)} style={{ position: 'absolute', top: '8px', right: '8px', width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-primary)')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.5)')}
                                                >×</button>
                                            </div>
                                        ))}
                                        {files.images.length < 10 && (
                                            <label style={{ aspectRatio: '1', borderRadius: '16px', border: '2px dashed rgba(0,0,0,0.12)', background: 'rgba(0,0,0,0.02)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', color: 'rgba(0,0,0,0.35)', transition: 'all 0.22s' }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.background = 'rgba(37,99,235,0.04)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'; e.currentTarget.style.color = 'rgba(0,0,0,0.35)'; e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; }}
                                            >
                                                <input type="file" accept="image/*" multiple onChange={handleImages} hidden ref={fileInputRef} />
                                                <Upload size={22} />
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600, textAlign: 'center', lineHeight: 1.4 }}>Add Photos<br /><span style={{ fontWeight: 400, opacity: 0.65 }}>{imagePreviews.length}/10</span></span>
                                            </label>
                                        )}
                                    </div>
                                </div>

                                <div style={{ ...fieldBase, marginTop: '24px' }}>
                                    <label style={labelBase}>Promo Video <span style={{ fontSize: '0.7rem', fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: 'var(--text-muted)', marginLeft: '4px' }}>(optional)</span></label>
                                    <div style={{ maxWidth: '260px' }}>
                                        {videoPreview ? (
                                            <div style={{ position: 'relative', aspectRatio: '1', borderRadius: '16px', overflow: 'hidden', border: '2px solid rgba(0,0,0,0.08)' }}>
                                                <video src={videoPreview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <button type="button" onClick={() => { setVideoPreview(null); setFiles(p => ({ ...p, video: null })); }} style={{ position: 'absolute', top: '8px', right: '8px', width: '26px', height: '26px', borderRadius: '50%', background: 'rgba(0,0,0,0.5)', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '1rem', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}
                                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--accent-primary)')}
                                                    onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.5)')}
                                                >×</button>
                                            </div>
                                        ) : (
                                            <label style={{ display: 'flex', width: '120px', aspectRatio: '1', borderRadius: '16px', border: '2px dashed rgba(0,0,0,0.12)', background: 'rgba(0,0,0,0.02)', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', color: 'rgba(0,0,0,0.35)', transition: 'all 0.22s' }}
                                                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-primary)'; e.currentTarget.style.color = 'var(--accent-primary)'; e.currentTarget.style.background = 'rgba(37,99,235,0.04)'; }}
                                                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(0,0,0,0.12)'; e.currentTarget.style.color = 'rgba(0,0,0,0.35)'; e.currentTarget.style.background = 'rgba(0,0,0,0.02)'; }}
                                            >
                                                <input type="file" accept="video/*" onChange={handleVideo} hidden ref={videoInputRef} />
                                                <Video size={22} />
                                                <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Add Video</span>
                                            </label>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {/* STEP 4 — Booking */}
                        {currentStep === 4 && (
                            <motion.div key="s4" initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}>
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 4px', background: 'linear-gradient(135deg, #1a1a1a 0%, #555 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', letterSpacing: '-0.02em' }}>Booking Method</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 26px', lineHeight: 1.5 }}>How should attendees book for this event?</p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                                    <div style={fieldBase}>
                                        <label style={labelBase}>Booking Type</label>
                                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                            {[
                                                { value: 'whatsapp', label: '📱 WhatsApp' },
                                                { value: 'website', label: '🌐 Website/Instagram' },
                                                { value: 'open', label: '🎟 Open Event' },
                                            ].map(opt => (
                                                <button key={opt.value} type="button" onClick={() => setEventData(p => ({ ...p, bookingType: opt.value }))}
                                                    style={{ padding: '10px 18px', borderRadius: '10px', border: `2px solid ${eventData.bookingType === opt.value ? 'var(--accent-primary)' : 'var(--border-color)'}`, background: eventData.bookingType === opt.value ? 'rgba(37,99,235,0.08)' : 'transparent', color: eventData.bookingType === opt.value ? 'var(--accent-primary)' : 'var(--text-secondary)', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit', transition: '0.15s' }}>
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {eventData.bookingType === 'whatsapp' && (
                                        <div style={fieldBase}>
                                            <label style={labelBase}>WhatsApp Number / Link</label>
                                            <input style={inputBase} name="whatsappLink" value={eventData.whatsappLink} onChange={handleText} placeholder="https://wa.me/91XXXXXXXXXX or 10-digit number" onFocus={focusOrange} onBlur={blurField} />
                                            {eventData.organizerWhatsApp && !eventData.whatsappLink && (
                                                <div style={{ marginTop: '6px', fontSize: '0.78rem', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => setEventData(p => ({ ...p, whatsappLink: `https://wa.me/${p.organizerWhatsApp.replace(/\D/g, '')}` }))}>
                                                    ↗ Use organizer WhatsApp: {eventData.organizerWhatsApp}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {eventData.bookingType === 'website' && (
                                        <div style={fieldBase}>
                                            <label style={labelBase}>Website / Instagram URL</label>
                                            <input style={inputBase} name="websiteLink" value={eventData.websiteLink} onChange={handleText} placeholder="https://..." onFocus={focusOrange} onBlur={blurField} />
                                            {eventData.organizerWebsite && !eventData.websiteLink && (
                                                <div style={{ marginTop: '6px', fontSize: '0.78rem', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: 600 }} onClick={() => setEventData(p => ({ ...p, websiteLink: p.organizerWebsite }))}>
                                                    ↗ Use organizer website: {eventData.organizerWebsite}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {eventData.bookingType === 'open' && (
                                        <div style={{ padding: '14px 18px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                                            ✅ Open event — no ticket or booking required. Attendees just show up.
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* ── Footer ───────────────────────────────────────── */}
                    <div style={{ padding: isMobile ? '12px 16px' : '18px 32px', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.01)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                        <button type="button" onClick={currentStep > 1 ? () => setCurrentStep(s => s - 1) : onClose}
                            style={{ padding: '11px 26px', borderRadius: '14px', fontWeight: 700, fontSize: '0.93rem', background: 'transparent', border: '1.5px solid rgba(0,0,0,0.12)', color: 'var(--text-secondary)', cursor: 'pointer', transition: 'all 0.2s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.04)'; if (currentStep > 1) e.currentTarget.style.transform = 'translateX(-3px)'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.transform = 'none'; }}
                        >
                            {currentStep > 1 ? '← Back' : 'Cancel'}
                        </button>

                        {currentStep < STEPS.length ? (
                            <button type="button" disabled={!canContinue()} onClick={() => setCurrentStep(s => s + 1)}
                                style={{ padding: '11px 30px', borderRadius: '14px', fontWeight: 700, fontSize: '0.93rem', border: 'none', background: canContinue() ? 'var(--accent-gradient)' : 'rgba(0,0,0,0.08)', color: canContinue() ? '#fff' : 'rgba(0,0,0,0.3)', cursor: canContinue() ? 'pointer' : 'not-allowed', boxShadow: canContinue() ? '0 8px 20px rgba(37,99,235,0.22)' : 'none', transition: 'all 0.22s' }}
                                onMouseEnter={e => { if (canContinue()) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(37,99,235,0.3)'; } }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = canContinue() ? '0 8px 20px rgba(37,99,235,0.22)' : 'none'; }}
                            >Continue →</button>
                        ) : (
                            <button type="button" disabled={isSubmitting || !canContinue()} onClick={handleSubmit}
                                style={{ padding: '11px 30px', borderRadius: '14px', fontWeight: 700, fontSize: '0.93rem', border: 'none', background: (!isSubmitting && canContinue()) ? 'var(--accent-gradient)' : 'rgba(0,0,0,0.08)', color: (!isSubmitting && canContinue()) ? '#fff' : 'rgba(0,0,0,0.3)', cursor: (!isSubmitting && canContinue()) ? 'pointer' : 'not-allowed', boxShadow: (!isSubmitting && canContinue()) ? '0 8px 20px rgba(37,99,235,0.22)' : 'none', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.22s' }}
                                onMouseEnter={e => { if (!isSubmitting && canContinue()) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 24px rgba(37,99,235,0.3)'; } }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = (!isSubmitting && canContinue()) ? '0 8px 20px rgba(37,99,235,0.22)' : 'none'; }}
                            ><Save size={16} />{isSubmitting ? 'Publishing...' : 'Publish Event'}</button>
                        )}
                    </div>
                    </>)}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default CreateEventModal;
