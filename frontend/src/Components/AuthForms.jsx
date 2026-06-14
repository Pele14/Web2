import  { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { Button, Input, FormField } from './common';
import toast from 'react-hot-toast';

const cardStyle = {
    minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)', padding: 16,
};

const formCard = {
    background: '#fff', borderRadius: 16, padding: 40, width: '100%', maxWidth: 440,
    boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
};

export function LoginForm() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const validate = () => {
        const e = {};
        if (!email) e.email = 'Email je obavezan';
        else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Email nije validan';
        if (!password) e.password = 'Lozinka je obavezna';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setServerError('');
        setLoading(true);
        try {
            await login(email, password);
            toast.success('Dobrodošli!');
            navigate('/trips');
        } catch (err) {
            const message = err.response?.data?.message || 'Greška pri prijavi';
            setServerError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={cardStyle}>
            <div style={formCard}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ fontSize: 40 }}>✈️</div>
                    <h1 style={{ margin: '8px 0 4px', fontSize: 26, fontWeight: 700, color: '#111827' }}>Prijava</h1>
                    <p style={{ color: '#6b7280', fontSize: 14 }}>Dobrodošli nazad u TravelPlanner</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <FormField label="Email" error={errors.email} required>
                        <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="vas@email.com" style={{ borderColor: errors.email ? '#ef4444' : undefined }} />
                    </FormField>
                    <FormField label="Lozinka" error={errors.password} required>
                        <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
                            placeholder="••••••••" style={{ borderColor: errors.password ? '#ef4444' : undefined }} />
                    </FormField>
                    {serverError && (
                        <p style={{ color: '#ef4444', marginBottom: 12, textAlign: 'center' }}>{serverError}</p>
                    )}
                    <Button type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
                        {loading ? 'Prijavljivanje...' : 'Prijavi se'}
                    </Button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 20, color: '#6b7280', fontSize: 14 }}>
                    Nemate nalog?{' '}
                    <Link to="/register" style={{ color: '#1e40af', fontWeight: 600 }}>Registrujte se</Link>
                </p>
            </div>
        </div>
    );
}

export function RegisterForm() {
    const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Ime je obavezno';
        if (!form.email) e.email = 'Email je obavezan';
        else if (!/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email nije validan';
        if (!form.password) e.password = 'Lozinka je obavezna';
        else if (form.password.length < 6) e.password = 'Minimalno 6 karaktera';
        if (form.password !== form.confirmPassword) e.confirmPassword = 'Lozinke se ne poklapaju';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        setServerError('');
        setLoading(true);
        try {
            await register(form.name, form.email, form.password);
            toast.success('Nalog je kreiran!');
            navigate('/trips');
        } catch (err) {
            const message = err.response?.data?.message || 'Greška pri registraciji';
            setServerError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={cardStyle}>
            <div style={formCard}>
                <div style={{ textAlign: 'center', marginBottom: 32 }}>
                    <div style={{ fontSize: 40 }}>✈️</div>
                    <h1 style={{ margin: '8px 0 4px', fontSize: 26, fontWeight: 700, color: '#111827' }}>Registracija</h1>
                    <p style={{ color: '#6b7280', fontSize: 14 }}>Kreirajte nalog i počnite planirati</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <FormField label="Ime i prezime" error={errors.name} required>
                        <Input value={form.name} onChange={set('name')} placeholder="Vaše ime"
                            style={{ borderColor: errors.name ? '#ef4444' : undefined }} />
                    </FormField>
                    <FormField label="Email" error={errors.email} required>
                        <Input type="email" value={form.email} onChange={set('email')} placeholder="vas@email.com"
                            style={{ borderColor: errors.email ? '#ef4444' : undefined }} />
                    </FormField>
                    <FormField label="Lozinka" error={errors.password} required>
                        <Input type="password" value={form.password} onChange={set('password')} placeholder="••••••••"
                            style={{ borderColor: errors.password ? '#ef4444' : undefined }} />
                    </FormField>
                    <FormField label="Potvrda lozinke" error={errors.confirmPassword} required>
                        <Input type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="••••••••"
                            style={{ borderColor: errors.confirmPassword ? '#ef4444' : undefined }} />
                    </FormField>
                    {serverError && (
                        <p style={{ color: '#ef4444', marginBottom: 12, textAlign: 'center' }}>{serverError}</p>
                    )}
                    <Button type="submit" disabled={loading} style={{ width: '100%', marginTop: 8 }}>
                        {loading ? 'Kreiranje naloga...' : 'Registruj se'}
                    </Button>
                </form>

                <p style={{ textAlign: 'center', marginTop: 20, color: '#6b7280', fontSize: 14 }}>
                    Već imate nalog?{' '}
                    <Link to="/login" style={{ color: '#1e40af', fontWeight: 600 }}>Prijavite se</Link>
                </p>
            </div>
        </div>
    );
}
