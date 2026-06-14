import { useState } from 'react';
import { useTrip } from '../Context/TripContext';
import { Button, Input, ConfirmDialog, EmptyState } from './common';
import toast from 'react-hot-toast';

export function ChecklistSection({ planId }) {
    const { checklist, createChecklistItem, updateChecklistItem, deleteChecklistItem } = useTrip();
    const [newItem, setNewItem] = useState('');
    const [deleting, setDeleting] = useState(null);
    const [adding, setAdding] = useState(false);

    const completed = checklist.filter(c => c.isCompleted).length;
    const total = checklist.length;
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    const handleAdd = async (e) => {
        e.preventDefault();
        if (!newItem.trim()) return;
        setAdding(true);
        try {
            await createChecklistItem(planId, { name: newItem.trim(), order: checklist.length });
            setNewItem('');
        } catch { toast.error('Greška pri dodavanju'); }
        finally { setAdding(false); }
    };

    const handleToggle = async (item) => {
        try { await updateChecklistItem(planId, item.id, { isCompleted: !item.isCompleted }); }
        catch { toast.error('Greška'); }
    };

    const handleDelete = async () => {
        try { await deleteChecklistItem(planId, deleting.id); toast.success('Stavka obrisana'); }
        catch { toast.error('Greška pri brisanju'); }
        setDeleting(null);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>✅ Packing lista / Checklista</h3>
                {total > 0 && (
                    <span style={{ fontSize: 13, color: '#6b7280', fontWeight: 600 }}>{completed}/{total} ({pct}%)</span>
                )}
            </div>

            {total > 0 && (
                <div style={{ marginBottom: 16 }}>
                    <div style={{ background: '#e5e7eb', borderRadius: 99, height: 8, overflow: 'hidden' }}>
                        <div style={{ background: pct === 100 ? '#10b981' : '#1e40af', height: '100%', width: `${pct}%`, borderRadius: 99, transition: 'width .4s' }} />
                    </div>
                </div>
            )}

            <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
                <Input value={newItem} onChange={e => setNewItem(e.target.value)} placeholder="Dodaj stavku (npr. pasoš, punjač...)" style={{ flex: 1 }} />
                <Button type="submit" size="sm" disabled={adding || !newItem.trim()}>
                    {adding ? '...' : '+ Dodaj'}
                </Button>
            </form>

            {checklist.length === 0 ? (
                <EmptyState icon="✅" title="Packing lista je prazna"
                    description="Dodajte stvari koje trebate ponijeti na put" />
            ) : (
                <div style={{ display: 'grid', gap: 4 }}>
                    {checklist.map(item => (
                        <div key={item.id} style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                            background: item.isCompleted ? '#f0fdf4' : '#fff',
                            border: `1px solid ${item.isCompleted ? '#bbf7d0' : '#e5e7eb'}`,
                            borderRadius: 8, transition: 'all .2s',
                        }}>
                            <input type="checkbox" checked={item.isCompleted} onChange={() => handleToggle(item)}
                                style={{ width: 18, height: 18, cursor: 'pointer', accentColor: '#10b981' }} />
                            <span style={{
                                flex: 1, fontSize: 14, fontWeight: 500,
                                textDecoration: item.isCompleted ? 'line-through' : 'none',
                                color: item.isCompleted ? '#6b7280' : '#111827',
                            }}>
                                {item.name}
                            </span>
                            <button onClick={() => setDeleting(item)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db', fontSize: 16, padding: '2px 6px', borderRadius: 4 }}
                                title="Obriši">✕</button>
                        </div>
                    ))}

                    {checklist.length > 3 && (
                        <div style={{ textAlign: 'center', padding: '12px 0', fontSize: 13, color: '#6b7280' }}>
                            {completed === total
                                ? '🎉 Sve stavke su označene!'
                                : `Preostaje ${total - completed} stavka`}
                        </div>
                    )}
                </div>
            )}

            <ConfirmDialog isOpen={!!deleting} title="Obriši stavku"
                message={`Obrisati "${deleting?.name}"?`}
                onConfirm={handleDelete} onCancel={() => setDeleting(null)} danger />
        </div>
    );
}
