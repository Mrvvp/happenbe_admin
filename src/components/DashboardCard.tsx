import { type LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend: string;
    trendDirection: 'up' | 'down';
    accentColor: string;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, value, icon: Icon, trend, trendDirection, accentColor }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="glass-card"
            style={{
                flex: 1,
                minWidth: '240px'
            }}
        >
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: 'var(--spacing-4)'
            }}>
                <div style={{
                    width: '44px',
                    height: '44px',
                    background: `${accentColor}20`,
                    borderRadius: 'var(--radius-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 0 15px ${accentColor}30`,
                    border: `1px solid ${accentColor}30`
                }}>
                    <Icon size={22} color={accentColor} strokeWidth={2.5} />
                </div>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    background: trendDirection === 'up' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    padding: '4px 10px',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    color: trendDirection === 'up' ? '#10b981' : '#f87171',
                    border: `1px solid ${trendDirection === 'up' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                }}>
                    {trendDirection === 'up' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                    {trend}
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>{title}</h3>
                <span style={{ fontSize: '2rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>{value}</span>
            </div>
        </motion.div>
    );
};

export default DashboardCard;
