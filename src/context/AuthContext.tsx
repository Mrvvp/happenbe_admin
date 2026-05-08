import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api/admin';

interface AdminUser { id: string; name: string; email: string; role: 'super_admin' | 'admin'; }
interface AuthCtx {
    admin: AdminUser | null;
    token: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthCtx>({} as AuthCtx);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [admin, setAdmin] = useState<AdminUser | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = localStorage.getItem('happenbe_admin_token');
        if (!stored) { setLoading(false); return; }
        fetch(`${API_BASE}/auth/me`, { headers: { Authorization: `Bearer ${stored}` } })
            .then(r => r.json())
            .then(data => {
                if (data.admin) { setAdmin(data.admin); setToken(stored); }
                else localStorage.removeItem('happenbe_admin_token');
            })
            .catch(() => localStorage.removeItem('happenbe_admin_token'))
            .finally(() => setLoading(false));
    }, []);

    const login = async (email: string, password: string) => {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Login failed');
        localStorage.setItem('happenbe_admin_token', data.token);
        setToken(data.token);
        setAdmin(data.admin);
    };

    const logout = () => {
        localStorage.removeItem('happenbe_admin_token');
        setToken(null);
        setAdmin(null);
    };

    return <AuthContext.Provider value={{ admin, token, loading, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
