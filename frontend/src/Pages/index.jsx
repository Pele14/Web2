/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
/* eslint-disable no-undef */
import  { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTrip } from '../Context/TripContext';
import { useAuth } from '../Context/AuthContext';
import { TripList } from '../Components/TripList';
import { TripForm } from '../Components/TripForm';
import { DestinationsSection } from '../Components/Destinations';
import { ActivitiesSection } from '../Components/Activities';
import { ExpensesSection } from '../Components/Expenses';
import { ChecklistSection } from '../Components/Checklist';
import { ShareSection } from '../Components/Share';
import { AdminPanel } from '../Components/AdminPanel';
import { Loading, Button, Modal } from '../Components/common';
import { tripService } from '../Services';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

// ── TripsPage ────────────────────────────────────────────────────────────────
export function TripsPage() {
    const { trips, loading, fetchTrips, createTrip } = useTrip();
    const [showCreate, setShowCreate] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);

    useEffect(() => { fetchTrips(); }, );

    const handleCreate = async (data) => {
        setCreateLoading(true);
        try {
            await createTrip(data);
            toast.success('Putovanje kreirano!');
            setShowCreate(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Greška pri kreiranju');
        } finally {
            setCreateLoading(false);
        }
    };

    if (loading) return <Loading />;

    return (
        <div style={pageStyle}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: 28, fontWeight: 800 }}>Moja putovanja</h1>
                    <p style={{ color: '#6b7280', margin: '4px 0 0', fontSize: 14 }}>{trips.length} {trips.length === 1 ? 'putovanje' : 'putovanj'}</p>
                </div>
                <Button onClick={() => setShowCreate(true)} size="lg">+ Novo putovanje</Button>
            </div>

            <TripList trips={trips} onCreateClick={() => setShowCreate(true)} />

            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Kreiraj novo putovanje" width={580}>
                <TripForm onSubmit={handleCreate} onCancel={() => setShowCreate(false)} loading={createLoading} />
            </Modal>
        </div>
    );
}

// ── TripDetailPage ────────────────────────────────────────────────────────────
const TABS = [
    { id: 'overview', label: '📋 Pregled' },
    { id: 'destinations', label: '📍 Destinacije' },
    { id: 'activities', label: '🗓 Aktivnosti' },
    { id: 'expenses', label: '💶 Troškovi' },
    { id: 'checklist', label: '✅ Checklista' },
    { id: 'share', label: '🔗 Dijeljenje' },
];

export function TripDetailPage() {
    const { id } = useParams();
    const { currentTrip, loading, fetchTrip } = useTrip();
    const [activeTab, setActiveTab] = useState('overview');
    const navigate = useNavigate();

    useEffect(() => { fetchTrip(id); }, [id]);

    if (loading) return <Loading />;
    if (!currentTrip) return (
        <div style={{ ...pageStyle, textAlign: 'center', paddingTop: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>😕</div>
            <h2>Putovanje nije pronađeno</h2>
            <Button onClick={() => navigate('/trips')}>Nazad na listu</Button>
        </div>
    );

    const startDate = currentTrip.startDate ? format(new Date(currentTrip.startDate), 'dd.MM.yyyy') : '';
    const endDate = currentTrip.endDate ? format(new Date(currentTrip.endDate), 'dd.MM.yyyy') : '';

    return (
        <div style={pageStyle}>
            {/* Header */}
            <div style={{ marginBottom: 24 }}>
                <button onClick={() => navigate('/trips')} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14, padding: '0 0 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    ← Nazad na listu
                </button>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 style={{ margin: '0 0 4px', fontSize: 28, fontWeight: 800 }}>{currentTrip.name}</h1>
                        <p style={{ color: '#6b7280', margin: 0, fontSize: 14 }}>📅 {startDate} – {endDate} · 💶 Budžet: €{Number(currentTrip.budget || 0).toFixed(0)}</p>
                    </div>
                </div>
                {currentTrip.description && (
                    <p style={{ color: '#4b5563', margin: '12px 0 0', lineHeight: 1.6 }}>{currentTrip.description}</p>
                )}
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', gap: 4, marginBottom: 24, borderBottom: '1px solid #e5e7eb', paddingBottom: 0, overflowX: 'auto' }}>
                {TABS.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                        background: 'none', border: 'none', borderBottom: activeTab === tab.id ? '2px solid #1e40af' : '2px solid transparent',
                        color: activeTab === tab.id ? '#1e40af' : '#6b7280', cursor: 'pointer', padding: '10px 16px', fontSize: 13,
                        fontWeight: activeTab === tab.id ? 700 : 500, whiteSpace: 'nowrap', transition: 'all .15s',
                    }}>{tab.label}</button>
                ))}
            </div>

            {/* Tab content */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #e5e7eb', padding: 28 }}>
                {activeTab === 'overview' && (
                    <div>
                        <h3 style={{ margin: '0 0 16px', fontSize: 18, fontWeight: 700 }}>📋 Pregled putovanja</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
                            {[
                                { label: 'Destinacije', value: currentTrip.destinationCount || 0, icon: '📍' },
                                { label: 'Aktivnosti', value: currentTrip.activityCount || 0, icon: '🗓' },
                                { label: 'Budžet', value: `€${Number(currentTrip.budget || 0).toFixed(0)}`, icon: '💶' },
                                { label: 'Trajanje', value: `${Math.ceil((new Date(currentTrip.endDate) - new Date(currentTrip.startDate)) / (1000 * 60 * 60 * 24)) + 1} dana`, icon: '📅' },
                            ].map(stat => (
                                <div key={stat.label} style={{ background: '#f8fafc', borderRadius: 10, padding: '16px 20px', textAlign: 'center' }}>
                                    <div style={{ fontSize: 28 }}>{stat.icon}</div>
                                    <div style={{ fontSize: 24, fontWeight: 800, color: '#111827', margin: '4px 0' }}>{stat.value}</div>
                                    <div style={{ fontSize: 12, color: '#9ca3af' }}>{stat.label}</div>
                                </div>
                            ))}
                        </div>
                        {currentTrip.notes && (
                            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 10, padding: 16 }}>
                                <div style={{ fontWeight: 700, marginBottom: 6, fontSize: 13, color: '#92400e' }}>📝 Napomene</div>
                                <p style={{ margin: 0, color: '#78350f', fontSize: 14, lineHeight: 1.6 }}>{currentTrip.notes}</p>
                            </div>
                        )}
                    </div>
                )}
                {activeTab === 'destinations' && <DestinationsSection planId={parseInt(id)} />}
                {activeTab === 'activities' && <ActivitiesSection planId={parseInt(id)} />}
                {activeTab === 'expenses' && <ExpensesSection planId={parseInt(id)} budget={currentTrip.budget} />}
                {activeTab === 'checklist' && <ChecklistSection planId={parseInt(id)} />}
                {activeTab === 'share' && <ShareSection planId={parseInt(id)} />}
            </div>
        </div>
    );
}

// ── SharedPlanPage ─────────────────────────────────────────────────────────────
export function SharedPlanPage() {
    const { token } = useParams();
    const [plan, setPlan] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        tripService.getByShareToken(token)
            .then(({ data }) => setPlan(data))
            .catch(() => setError(true))
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) return <Loading text="Učitavanje plana putovanja..." />;
    if (error || !plan) return (
        <div style={{ ...pageStyle, textAlign: 'center', paddingTop: 80 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
            <h2>Link nije validan ili je istekao</h2>
            <p style={{ color: '#6b7280' }}>Provjerite link ili kontaktirajte osobu koja vam je podijelila plan.</p>
        </div>
    );

    return (
        <div style={{ ...pageStyle, maxWidth: 860 }}>
            <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 16px', marginBottom: 20, fontSize: 13, color: '#1d4ed8' }}>
                👁 Gledate dijeljeni plan putovanja (read-only)
            </div>
            <h1 style={{ margin: '0 0 4px', fontSize: 26, fontWeight: 800 }}>{plan.name}</h1>
            {plan.description && <p style={{ color: '#4b5563', marginBottom: 20 }}>{plan.description}</p>}
            {plan.destinations?.length > 0 && (
                <div style={{ marginBottom: 24 }}>
                    <h3>📍 Destinacije</h3>
                    {plan.destinations.map(d => (
                        <div key={d.id} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
                            <strong>{d.name}</strong>{d.location && ` – ${d.location}`}
                        </div>
                    ))}
                </div>
            )}
            {plan.activities?.length > 0 && (
                <div>
                    <h3>🗓 Aktivnosti</h3>
                    {plan.activities.map(a => (
                        <div key={a.id} style={{ background: '#f8fafc', borderRadius: 8, padding: '10px 14px', marginBottom: 8 }}>
                            <strong>{a.name}</strong>
                            {a.date && ` · ${format(new Date(a.date), 'dd.MM.yyyy')}`}
                            {a.location && ` · 📍 ${a.location}`}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── AdminPage ─────────────────────────────────────────────────────────────────
export function AdminPage() {
    const { isAdmin } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!isAdmin) { navigate('/trips'); toast.error('Nemate pristup ovoj stranici'); }
    }, [isAdmin]);

    return <div style={pageStyle}><AdminPanel /></div>;
}

// ── HomePage ──────────────────────────────────────────────────────────────────
export function HomePage() {
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) navigate('/trips');
    }, [isAuthenticated]);

    return (
        <div style={{ minHeight: 'calc(100vh - 64px)', background: 'linear-gradient(135deg, #eff6ff 0%, #e0f2fe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 72, marginBottom: 20 }}>✈️</div>
                <h1 style={{ fontSize: 42, fontWeight: 900, margin: '0 0 16px', color: '#111827' }}>TravelPlanner</h1>
                <p style={{ fontSize: 18, color: '#6b7280', maxWidth: 500, margin: '0 auto 36px', lineHeight: 1.6 }}>
                    Planirajte savršeno putovanje — destinacije, aktivnosti, troškovi i packing lista na jednom mjestu.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                    <Button size="lg" onClick={() => navigate('/register')}>Počni planirati</Button>
                    <Button size="lg" variant="outline" onClick={() => navigate('/login')}>Prijavi se</Button>
                </div>
            </div>
        </div>
    );
}

// ── ProfilePage ───────────────────────────────────────────────────────────────
export function ProfilePage() {
    const { user, updateUser } = useAuth();
    const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', password: '', confirmPassword: '' });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const { userService: us } = require('../services');
    const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = {};
        if (!form.name.trim()) errs.name = 'Ime je obavezno';
        if (form.password && form.password.length < 6) errs.password = 'Minimalno 6 karaktera';
        if (form.password !== form.confirmPassword) errs.confirmPassword = 'Lozinke se ne poklapaju';
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setLoading(true);
        try {
            const payload = { name: form.name };
            if (form.password) payload.password = form.password;
            const { userService } = await import('../services');
            const { data } = await userService.update(user.id, payload);
            updateUser(data);
            toast.success('Profil ažuriran');
        } catch (err) { toast.error(err.response?.data?.message || 'Greška'); }
        finally { setLoading(false); }
    };

    return (
        <div style={{ ...pageStyle, maxWidth: 520 }}>
            <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>👤 Moj profil</h1>
            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 28 }}>
                <form onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>Ime i prezime *</label>
                        <input value={form.name} onChange={set('name')} style={inputS} />
                        {errors.name && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{errors.name}</p>}
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>Email</label>
                        <input value={form.email} disabled style={{ ...inputS, background: '#f9fafb', color: '#9ca3af' }} />
                        <p style={{ fontSize: 11, color: '#9ca3af', margin: '4px 0 0' }}>Email ne može biti promijenjen</p>
                    </div>
                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>Nova lozinka (opciono)</label>
                        <input type="password" value={form.password} onChange={set('password')} placeholder="Ostavite prazno za zadržavanje iste" style={inputS} />
                        {errors.password && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{errors.password}</p>}
                    </div>
                    {form.password && (
                        <div style={{ marginBottom: 16 }}>
                            <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 600, color: '#374151' }}>Potvrda nove lozinke</label>
                            <input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} style={inputS} />
                            {errors.confirmPassword && <p style={{ color: '#ef4444', fontSize: 12, margin: '4px 0 0' }}>{errors.confirmPassword}</p>}
                        </div>
                    )}
                    <Button type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
                        {loading ? 'Ažuriranje...' : 'Sačuvaj izmjene'}
                    </Button>
                </form>
            </div>
        </div>
    );
}

const pageStyle = { maxWidth: 1100, margin: '0 auto', padding: '32px 24px' };
const inputS = { width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
