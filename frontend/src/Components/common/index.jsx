// ── Navbar ────────────────────────────────────────────────────────────────────
import  { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../Context/AuthContext';

export function Navbar() {
    const { user, logout, isAdmin, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [menuOpen, setMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

    return (
        <nav style={styles.nav}>
            <div style={styles.navInner}>
                <Link to="/" style={styles.logo}>
                    ✈️ TravelPlanner
                </Link>

                {isAuthenticated && (
                    <div style={styles.navLinks}>
                        <Link to="/trips" style={{ ...styles.link, ...(isActive('/trips') ? styles.linkActive : {}) }}>
                            Putovanja
                        </Link>
                        {isAdmin && (
                            <Link to="/admin" style={{ ...styles.link, ...(isActive('/admin') ? styles.linkActive : {}) }}>
                                Admin
                            </Link>
                        )}
                    </div>
                )}

                <div style={styles.navRight}>
                    {isAuthenticated ? (
                        <div style={{ position: 'relative' }}>
                            <button style={styles.userBtn} onClick={() => setMenuOpen(!menuOpen)}>
                                <span style={styles.avatar}>{user?.name?.[0]?.toUpperCase()}</span>
                                {user?.name}
                                <span>▾</span>
                            </button>
                            {menuOpen && (
                                <div style={styles.dropdown}>
                                    <div style={styles.dropdownHeader}>{user?.email}</div>
                                    <div style={styles.dropdownRole}>{user?.role}</div>
                                    <hr style={{ margin: '4px 0', border: 'none', borderTop: '1px solid #e5e7eb' }} />
                                    <Link to="/profile" style={styles.dropdownItem} onClick={() => setMenuOpen(false)}>
                                        Profil
                                    </Link>
                                    <button style={{ ...styles.dropdownItem, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
                                        onClick={handleLogout}>
                                        Odjava
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div style={{ display: 'flex', gap: 8 }}>
                            <Link to="/login" style={styles.btnOutline}>Prijava</Link>
                            <Link to="/register" style={styles.btnPrimary}>Registracija</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
}

const styles = {
    nav: { background: '#1e40af', boxShadow: '0 2px 8px rgba(0,0,0,0.15)', position: 'sticky', top: 0, zIndex: 100 },
    navInner: { maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', height: 64, gap: 32 },
    logo: { color: '#fff', fontWeight: 700, fontSize: 20, textDecoration: 'none', whiteSpace: 'nowrap' },
    navLinks: { display: 'flex', gap: 8, flex: 1 },
    link: { color: 'rgba(255,255,255,0.8)', textDecoration: 'none', padding: '6px 14px', borderRadius: 6, fontSize: 14, fontWeight: 500, transition: 'all .15s' },
    linkActive: { background: 'rgba(255,255,255,0.15)', color: '#fff' },
    navRight: { marginLeft: 'auto' },
    userBtn: { background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px', borderRadius: 8, fontSize: 14 },
    avatar: { background: '#60a5fa', borderRadius: '50%', width: 28, height: 28, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13 },
    dropdown: { position: 'absolute', right: 0, top: '110%', background: '#fff', borderRadius: 10, boxShadow: '0 4px 24px rgba(0,0,0,0.12)', minWidth: 180, padding: '8px 0', zIndex: 200 },
    dropdownHeader: { padding: '6px 16px', fontSize: 12, color: '#6b7280', fontWeight: 600 },
    dropdownRole: { padding: '0 16px 6px', fontSize: 11, color: '#9ca3af' },
    dropdownItem: { display: 'block', padding: '8px 16px', fontSize: 14, color: '#374151', textDecoration: 'none', cursor: 'pointer' },
    btnPrimary: { background: '#fff', color: '#1e40af', padding: '7px 16px', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: 14 },
    btnOutline: { background: 'transparent', color: '#fff', border: '1px solid rgba(255,255,255,0.5)', padding: '7px 16px', borderRadius: 8, textDecoration: 'none', fontSize: 14 },
};

// ── Loading ────────────────────────────────────────────────────────────────────
export function Loading({ text = 'Učitavanje...' }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, gap: 16 }}>
            <div style={{ width: 40, height: 40, border: '4px solid #e5e7eb', borderTop: '4px solid #1e40af', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ color: '#6b7280', fontSize: 14 }}>{text}</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
}

// ── ConfirmDialog ─────────────────────────────────────────────────────────────
export function ConfirmDialog({ isOpen, title, message, onConfirm, onCancel, danger = false }) {
    if (!isOpen) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 24, maxWidth: 400, width: '90%', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 600 }}>{title}</h3>
                <p style={{ color: '#6b7280', margin: '0 0 24px', fontSize: 14 }}>{message}</p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                    <button onClick={onCancel} style={{ padding: '8px 20px', border: '1px solid #e5e7eb', borderRadius: 8, background: '#fff', cursor: 'pointer', fontSize: 14 }}>
                        Odustani
                    </button>
                    <button onClick={onConfirm} style={{ padding: '8px 20px', border: 'none', borderRadius: 8, background: danger ? '#ef4444' : '#1e40af', color: '#fff', cursor: 'pointer', fontSize: 14, fontWeight: 600 }}>
                        Potvrdi
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
export function Modal({ isOpen, onClose, title, children, width = 560 }) {
    if (!isOpen) return null;
    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 500, padding: 16 }}
            onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: '100%', maxWidth: width, maxHeight: '90vh', overflow: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>{title}</h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: '#6b7280', padding: 4 }}>✕</button>
                </div>
                {children}
            </div>
        </div>
    );
}

// ── FormField ─────────────────────────────────────────────────────────────────
export function FormField({ label, error, required, children }) {
    return (
        <div style={{ marginBottom: 16 }}>
            {label && (
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>
                    {label} {required && <span style={{ color: '#ef4444' }}>*</span>}
                </label>
            )}
            {children}
            {error && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{error}</p>}
        </div>
    );
}

const inputBase = {
    width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8,
    fontSize: 14, outline: 'none', boxSizing: 'border-box', transition: 'border-color .15s',
    fontFamily: 'inherit',
};

export function Input({ style, ...props }) {
    return <input style={{ ...inputBase, ...style }} {...props} />;
}

export function Select({ children, style, ...props }) {
    return <select style={{ ...inputBase, ...style }} {...props}>{children}</select>;
}

export function Textarea({ style, ...props }) {
    return <textarea style={{ ...inputBase, minHeight: 80, resize: 'vertical', ...style }} {...props} />;
}

// ── Badge ─────────────────────────────────────────────────────────────────────
const BADGE_COLORS = {
    Planned: { bg: '#eff6ff', color: '#1d4ed8' },
    Reserved: { bg: '#fffbeb', color: '#b45309' },
    Completed: { bg: '#f0fdf4', color: '#15803d' },
    Cancelled: { bg: '#fef2f2', color: '#b91c1c' },
    Admin: { bg: '#fdf4ff', color: '#7e22ce' },
    User: { bg: '#f0f9ff', color: '#0369a1' },
};

export function Badge({ text, type }) {
    const colors = BADGE_COLORS[type || text] || { bg: '#f3f4f6', color: '#374151' };
    return (
        <span style={{ ...colors, padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap' }}>
            {text}
        </span>
    );
}

// ── Button ────────────────────────────────────────────────────────────────────
export function Button({ variant = 'primary', size = 'md', children, style, disabled, ...props }) {
    const variants = {
        primary: { background: '#1e40af', color: '#fff', border: 'none' },
        danger: { background: '#ef4444', color: '#fff', border: 'none' },
        outline: { background: '#fff', color: '#1e40af', border: '1px solid #1e40af' },
        ghost: { background: 'transparent', color: '#6b7280', border: '1px solid #e5e7eb' },
    };
    const sizes = { sm: { padding: '5px 12px', fontSize: 13 }, md: { padding: '9px 18px', fontSize: 14 }, lg: { padding: '12px 24px', fontSize: 15 } };
    return (
        <button disabled={disabled} style={{
            ...variants[variant], ...sizes[size],
            borderRadius: 8, cursor: disabled ? 'not-allowed' : 'pointer', fontWeight: 600,
            opacity: disabled ? 0.6 : 1, fontFamily: 'inherit', transition: 'all .15s', ...style,
        }} {...props}>
            {children}
        </button>
    );
}

// ── EmptyState ────────────────────────────────────────────────────────────────
export function EmptyState({ icon = '📭', title, description, action }) {
    return (
        <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>{icon}</div>
            <h3 style={{ margin: '0 0 8px', color: '#374151', fontSize: 18 }}>{title}</h3>
            {description && <p style={{ color: '#9ca3af', margin: '0 0 24px', fontSize: 14 }}>{description}</p>}
            {action}
        </div>
    );
}
