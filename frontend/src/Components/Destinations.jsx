import { useState } from 'react';
import { useTrip } from '../Context/TripContext';
import { Button, Modal, FormField, Input, Textarea, ConfirmDialog, EmptyState } from './common';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function DestinationForm({ initial = null, onSubmit, onCancel, loading }) {
    const { currentTrip } = useTrip();
    const minDate = currentTrip?.startDate?.split('T')[0] || '';
    const maxDate = currentTrip?.endDate?.split('T')[0] || '';
    const [form, setForm] = useState({
        name: initial?.name || '',
        location: initial?.location || '',
        arrivalDate: initial?.arrivalDate?.split('T')[0] || minDate || '',
        departureDate: initial?.departureDate?.split('T')[0] || minDate || '',
        description: initial?.description || '',
        notes: initial?.notes || '',
    });
    const [errors, setErrors] = useState({});
    const set = (f) => (e) => setForm(prev => ({ ...prev, [f]: e.target.value }));

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Naziv destinacije je obavezan';
        if (!form.arrivalDate) e.arrivalDate = 'Datum dolaska je obavezan';
        if (!form.departureDate) e.departureDate = 'Datum odlaska je obavezan';
        if (form.arrivalDate && minDate && form.arrivalDate < minDate) e.arrivalDate = `Datum dolaska mora biti poslije ${minDate}`;
        if (form.arrivalDate && maxDate && form.arrivalDate > maxDate) e.arrivalDate = `Datum dolaska mora biti prije ${maxDate}`;
        if (form.departureDate && minDate && form.departureDate < minDate) e.departureDate = `Datum odlaska mora biti poslije ${minDate}`;
        if (form.departureDate && maxDate && form.departureDate > maxDate) e.departureDate = `Datum odlaska mora biti prije ${maxDate}`;
        if (form.arrivalDate && form.departureDate && form.departureDate < form.arrivalDate)
            e.departureDate = 'Datum odlaska ne može biti prije dolaska';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;
        onSubmit({ name: form.name.trim(), location: form.location || null, arrivalDate: form.arrivalDate, departureDate: form.departureDate, description: form.description || null, notes: form.notes || null });
    };

    return (
        <form onSubmit={handleSubmit}>
            <FormField label="Naziv destinacije" error={errors.name} required>
                <Input value={form.name} onChange={set('name')} placeholder="npr. Dubrovnik" />
            </FormField>
            <FormField label="Lokacija / Adresa">
                <Input value={form.location} onChange={set('location')} placeholder="npr. Hrvatska" />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormField label="Datum dolaska" error={errors.arrivalDate} required>
                    <Input type="date" value={form.arrivalDate} onChange={set('arrivalDate')} min={minDate || undefined} max={maxDate || undefined} />
                </FormField>
                <FormField label="Datum odlaska" error={errors.departureDate} required>
                    <Input type="date" value={form.departureDate} min={form.arrivalDate || minDate || undefined} max={maxDate || undefined} onChange={set('departureDate')} />
                </FormField>
            </div>
            <FormField label="Opis">
                <Textarea value={form.description} onChange={set('description')} placeholder="Opis destinacije..." rows={2} />
            </FormField>
            <FormField label="Napomene">
                <Textarea value={form.notes} onChange={set('notes')} placeholder="Dodatne napomene..." rows={2} />
            </FormField>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <Button type="button" variant="ghost" onClick={onCancel}>Odustani</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Čuvanje...' : initial ? 'Sačuvaj' : 'Dodaj destinaciju'}</Button>
            </div>
        </form>
    );
}

export function DestinationsSection({ planId }) {
    const { destinations, createDestination, updateDestination, deleteDestination } = useTrip();
    const [showAdd, setShowAdd] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    const handleCreate = async (data) => {
        setFormLoading(true);
        try { await createDestination(planId, data); toast.success('Destinacija dodana'); setShowAdd(false); }
        catch (err) { toast.error(err.response?.data?.message || 'Greška'); }
        finally { setFormLoading(false); }
    };

    const handleUpdate = async (data) => {
        setFormLoading(true);
        try { await updateDestination(planId, editing.id, data); toast.success('Destinacija ažurirana'); setEditing(null); }
        catch (err) { toast.error(err.response?.data?.message || 'Greška'); }
        finally { setFormLoading(false); }
    };

    const handleDelete = async () => {
        try { await deleteDestination(planId, deleting.id); toast.success('Destinacija obrisana'); }
        catch { toast.error('Greška pri brisanju'); }
        setDeleting(null);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>📍 Destinacije</h3>
                <Button size="sm" onClick={() => setShowAdd(true)}>+ Dodaj destinaciju</Button>
            </div>

            {destinations.length === 0 ? (
                <EmptyState icon="📍" title="Nema destinacija" description="Dodajte destinacije vašeg putovanja"
                    action={<Button size="sm" onClick={() => setShowAdd(true)}>+ Dodaj prvu destinaciju</Button>} />
            ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                    {destinations.map(dest => (
                        <div key={dest.id} style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                <div>
                                    <h4 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>{dest.name}</h4>
                                    {dest.location && <p style={{ margin: '0 0 6px', color: '#6b7280', fontSize: 13 }}>📍 {dest.location}</p>}
                                    <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>
                                        📅 {dest.arrivalDate ? format(new Date(dest.arrivalDate), 'dd.MM.yyyy') : ''} –{' '}
                                        {dest.departureDate ? format(new Date(dest.departureDate), 'dd.MM.yyyy') : ''}
                                    </p>
                                    {dest.description && <p style={{ margin: '8px 0 0', fontSize: 13, color: '#4b5563' }}>{dest.description}</p>}
                                </div>
                                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                                    <Button size="sm" variant="ghost" onClick={() => setEditing(dest)}>Uredi</Button>
                                    <Button size="sm" variant="danger" onClick={() => setDeleting(dest)}>Obriši</Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Dodaj destinaciju">
                <DestinationForm planId={planId} onSubmit={handleCreate} onCancel={() => setShowAdd(false)} loading={formLoading} />
            </Modal>
            <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Uredi destinaciju">
                <DestinationForm planId={planId} initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} loading={formLoading} />
            </Modal>
            <ConfirmDialog isOpen={!!deleting} title="Obriši destinaciju"
                message={`Obrisati "${deleting?.name}"? Sve povezane aktivnosti će biti odvojene.`}
                onConfirm={handleDelete} onCancel={() => setDeleting(null)} danger />
        </div>
    );
}
