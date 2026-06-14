/* eslint-disable react-hooks/immutability */
import { useState, useEffect } from 'react';
import { userService } from '../Services';
import { Button, Badge, ConfirmDialog, Loading } from './common';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export function AdminPanel() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deleting, setDeleting] = useState(null);

    useEffect(() => { loadUsers(); }, []);

    const loadUsers = async () => {
        try {
            const { data } = await userService.getAll();
            setUsers(data);
        } catch { toast.error('Greška pri učitavanju korisnika'); }
        finally { setLoading(false); }
    };

    const handleDelete = async () => {
        try {
            await userService.delete(deleting.id);
            setUsers(prev => prev.filter(u => u.id !== deleting.id));
            toast.success('Korisnik obrisan');
        } catch { toast.error('Greška pri brisanju'); }
        setDeleting(null);
    };

    const handleRoleToggle = async (user) => {
        const newRole = user.role === 'Admin' ? 'User' : 'Admin';
        try {
            await userService.adminUpdate(user.id, { role: newRole });
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
            toast.success(`Uloga promijenjena na ${newRole}`);
        } catch { toast.error('Greška pri promjeni uloge'); }
    };

    const handleToggleActive = async (user) => {
        try {
            await userService.adminUpdate(user.id, { isActive: !user.isActive });
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u));
            toast.success(user.isActive ? 'Nalog deaktiviran' : 'Nalog aktiviran');
        } catch { toast.error('Greška'); }
    };

    if (loading) return <Loading />;

    const stats = {
        total: users.length,
        admins: users.filter(u => u.role === 'Admin').length,
        active: users.filter(u => u.isActive).length,
    };

    return (
        <div style={{ padding: '0 0 40px' }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 4 }}>👤 Admin panel</h2>
            <p style={{ color: '#6b7280', marginBottom: 24 }}>Upravljanje korisničkim nalozima</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
                {[
                    { label: 'Ukupno korisnika', value: stats.total, icon: '👥', color: '#1e40af' },
                    { label: 'Admini', value: stats.admins, icon: '🔑', color: '#7c3aed' },
                    { label: 'Aktivni nalozi', value: stats.active, icon: '✅', color: '#059669' },
                ].map(stat => (
                    <div key={stat.label} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, padding: 20 }}>
                        <div style={{ fontSize: 28, marginBottom: 4 }}>{stat.icon}</div>
                        <div style={{ fontSize: 28, fontWeight: 800, color: stat.color }}>{stat.value}</div>
                        <div style={{ fontSize: 12, color: '#6b7280' }}>{stat.label}</div>
                    </div>
                ))}
            </div>

            <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', borderBottom: '1px solid #e5e7eb', fontWeight: 700, fontSize: 16 }}>
                    Lista korisnika ({users.length})
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f9fafb' }}>
                                {['ID', 'Ime', 'Email', 'Uloga', 'Status', 'Registrovan', 'Akcije'].map(h => (
                                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user, i) => (
                                <tr key={user.id} style={{ borderTop: '1px solid #f3f4f6', background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                                    <td style={td}><span style={{ color: '#9ca3af', fontSize: 12 }}>#{user.id}</span></td>
                                    <td style={td}><span style={{ fontWeight: 600 }}>{user.name}</span></td>
                                    <td style={td}><span style={{ color: '#6b7280', fontSize: 13 }}>{user.email}</span></td>
                                    <td style={td}><Badge text={user.role} type={user.role} /></td>
                                    <td style={td} status={user.isActive.toString()}>
                                        <span style={{ fontSize: 12, padding: '3px 8px', borderRadius: 20, background: user.isActive ? '#f0fdf4' : '#fef2f2', color: user.isActive ? '#15803d' : '#dc2626', fontWeight: 600 }}>
                                            {user.isActive ? 'Aktivan' : 'Neaktivan'}
                                        </span>
                                    </td>
                                    <td style={td}><span style={{ fontSize: 12, color: '#9ca3af' }}>{user.createdAt ? format(new Date(user.createdAt), 'dd.MM.yyyy') : '–'}</span></td>
                                    <td style={td}>
                                        <div style={{ display: 'flex', gap: 6 }}>
                                            <Button size="sm" variant="ghost" onClick={() => handleRoleToggle(user)}>
                                                {user.role === 'Admin' ? 'Skini admin' : 'Postavi admin'}
                                            </Button>
                                            <Button size="sm" variant="ghost" onClick={() => handleToggleActive(user)}>
                                                {user.isActive ? 'Deaktiviraj' : 'Aktiviraj'}
                                            </Button>
                                            <Button size="sm" variant="danger" onClick={() => setDeleting(user)}>Obriši</Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <ConfirmDialog isOpen={!!deleting} title="Obriši korisnika"
                message={`Da li ste sigurni da želite da obrišete korisnika "${deleting?.name}" (${deleting?.email})?`}
                onConfirm={handleDelete} onCancel={() => setDeleting(null)} danger />
        </div>
    );
}

const td = { padding: '12px 16px', verticalAlign: 'middle' };