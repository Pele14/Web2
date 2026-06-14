import  { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { useTrip } from '../Context/TripContext';
import { Button, Modal, FormField, Input, Textarea, Select, ConfirmDialog, EmptyState, Badge } from './common';
import { ACTIVITY_STATUSES, ACTIVITY_STATUS_COLORS } from '../Models';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function ActivityForm({  initial = null, onSubmit, onCancel, loading, destinations }) {
    const { currentTrip } = useTrip();
    const minDate = currentTrip?.startDate?.split('T')[0] || '';
    const maxDate = currentTrip?.endDate?.split('T')[0] || '';
    const [form, setForm] = useState({
        name: initial?.name || '',
        date: initial?.date?.split('T')[0] || minDate || '',
        time: initial?.time || '',
        location: initial?.location || '',
        description: initial?.description || '',
        estimatedCost: initial?.estimatedCost?.toString() || '',
        status: initial?.status || 'Planned',
        destinationId: initial?.destinationId?.toString() || '',
    });
    const isReadOnly = initial?.status === 'Completed';
    const [errors, setErrors] = useState({});
    const set = (f) => (e) => setForm(prev => ({ ...prev, [f]: e.target.value }));

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Naziv aktivnosti je obavezan';
        if (!form.date) e.date = 'Datum je obavezan';
        if (form.date && minDate && form.date < minDate) e.date = `Datum mora biti poslije ${minDate}`;
        if (form.date && maxDate && form.date > maxDate) e.date = `Datum mora biti prije ${maxDate}`;
        if (form.estimatedCost && (isNaN(Number(form.estimatedCost)) || Number(form.estimatedCost) < 0))
            e.estimatedCost = 'Trošak mora biti pozitivan broj';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (isReadOnly) return;
        if (!validate()) return;
        onSubmit({
            name: form.name.trim(),
            date: form.date,
            time: form.time || null,
            location: form.location || null,
            description: form.description || null,
            estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : null,
            status: form.status,
            destinationId: form.destinationId ? Number(form.destinationId) : null,
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <FormField label="Naziv aktivnosti" error={errors.name} required>
                <Input value={form.name} onChange={set('name')} placeholder="npr. Razgledanje starog grada" disabled={isReadOnly} />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormField label="Datum" error={errors.date} required>
                    <Input type="date" value={form.date} onChange={set('date')} disabled={isReadOnly} min={minDate || undefined} max={maxDate || undefined} />
                </FormField>
                <FormField label="Vrijeme">
                    <Input type="time" value={form.time} onChange={set('time')} disabled={isReadOnly} />
                </FormField>
            </div>
            <FormField label="Lokacija">
                <Input value={form.location} onChange={set('location')} placeholder="npr. Stari grad, Dubrovnik" disabled={isReadOnly} />
            </FormField>
            {destinations && destinations.length > 0 && (
                <FormField label="Destinacija">
                    <Select value={form.destinationId} onChange={set('destinationId')} disabled={isReadOnly}>
                        <option value="">– Bez destinacije –</option>
                        {destinations.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </Select>
                </FormField>
            )}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormField label="Procijenjeni trošak (€)" error={errors.estimatedCost}>
                    <Input type="number" value={form.estimatedCost} onChange={set('estimatedCost')} placeholder="0.00" min="0" step="0.01" disabled={isReadOnly} />
                </FormField>
                <FormField label="Status">
                    <Select value={form.status} onChange={set('status')} disabled={isReadOnly}>
                        {ACTIVITY_STATUSES.map(s => <option key={s} value={s}>{statusLabel(s)}</option>)}
                    </Select>
                </FormField>
            </div>
            <FormField label="Opis">
                <Textarea value={form.description} onChange={set('description')} placeholder="Opis aktivnosti..." rows={3} disabled={isReadOnly} />
            </FormField>
            {isReadOnly && (
                <p style={{ color: '#065f46', background: '#ecfdf5', padding: '8px 12px', borderRadius: 6, marginTop: 8 }}>
                    Ova aktivnost je završena i više se ne može menjati.
                </p>
            )}
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <Button type="button" variant="ghost" onClick={onCancel}>Odustani</Button>
                <Button type="submit" disabled={loading || isReadOnly}>{loading ? 'Čuvanje...' : initial ? 'Sačuvaj' : 'Dodaj aktivnost'}</Button>
            </div>
        </form>
    );
}

const statusLabel = (s) => ({ Planned: 'Planirano', Reserved: 'Rezervisano', Completed: 'Završeno', Cancelled: 'Otkazano' }[s] || s);

export function ActivitiesSection({ planId }) {
    const { activities, destinations, createActivity, updateActivity, deleteActivity } = useTrip();
    const [view, setView] = useState('list'); // 'list' | 'calendar'
    const [showAdd, setShowAdd] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [completing, setCompleting] = useState(null);
    const [completingInProgress, setCompletingInProgress] = useState(new Set());
    const [formLoading, setFormLoading] = useState(false);

    const handleCreate = async (data) => {
        setFormLoading(true);
        try { await createActivity(planId, data); toast.success('Aktivnost dodana'); setShowAdd(false); }
        catch (err) { toast.error(err.response?.data?.message || 'Greška'); }
        finally { setFormLoading(false); }
    };

    const handleUpdate = async (data) => {
        setFormLoading(true);
        try { await updateActivity(planId, editing.id, data); toast.success('Aktivnost ažurirana'); setEditing(null); }
        catch (err) { toast.error(err.response?.data?.message || 'Greška'); }
        finally { setFormLoading(false); }
    };

    const handleDelete = async () => {
        try { await deleteActivity(planId, deleting.id); toast.success('Aktivnost obrisana'); }
        catch { toast.error('Greška pri brisanju'); }
        setDeleting(null);
    };

    // Group activities by date for list view
    const grouped = activities.reduce((acc, act) => {
        const date = act.date?.split('T')[0] || 'Unknown';
        if (!acc[date]) acc[date] = [];
        acc[date].push(act);
        return acc;
    }, {});

    const calendarEvents = activities.map(act => ({
        id: act.id.toString(),
        title: act.name,
        date: act.date?.split('T')[0],
        backgroundColor: ACTIVITY_STATUS_COLORS[act.status] || '#3b82f6',
        borderColor: ACTIVITY_STATUS_COLORS[act.status] || '#3b82f6',
        extendedProps: { activity: act },
    }));

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🗓 Aktivnosti</h3>
                <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 8, padding: 3 }}>
                        <button onClick={() => setView('list')} style={{ ...viewBtn, ...(view === 'list' ? viewBtnActive : {}) }}>Lista</button>
                        <button onClick={() => setView('calendar')} style={{ ...viewBtn, ...(view === 'calendar' ? viewBtnActive : {}) }}>Kalendar</button>
                    </div>
                    <Button size="sm" onClick={() => setShowAdd(true)}>+ Dodaj aktivnost</Button>
                </div>
            </div>

            {view === 'list' ? (
                activities.length === 0 ? (
                    <EmptyState icon="🗓" title="Nema aktivnosti" description="Dodajte aktivnosti i planirajte raspored"
                        action={<Button size="sm" onClick={() => setShowAdd(true)}>+ Dodaj prvu aktivnost</Button>} />
                ) : (
                    <div style={{ display: 'grid', gap: 16 }}>
                        {Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b)).map(([date, acts]) => (
                            <div key={date}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, paddingBottom: 6, borderBottom: '1px solid #e5e7eb' }}>
                                    {date !== 'Unknown' ? format(new Date(date), 'EEEE, dd. MMMM yyyy') : 'Bez datuma'}
                                </div>
                                <div style={{ display: 'grid', gap: 8 }}>
                                    {acts.sort((a, b) => (a.time || '').localeCompare(b.time || '')).map(act => (
                                        <div key={act.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderLeft: `4px solid ${ACTIVITY_STATUS_COLORS[act.status] || '#3b82f6'}`, borderRadius: 8, padding: '12px 16px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                                                        {act.time && <span style={{ fontSize: 12, fontWeight: 600, color: '#1e40af', background: '#eff6ff', padding: '2px 8px', borderRadius: 4 }}>⏰ {act.time}</span>}
                                                        <span style={{ fontWeight: 700, fontSize: 15 }}>{act.name}</span>
                                                        <Badge text={statusLabel(act.status)} type={act.status} />
                                                    </div>
                                                    {act.location && <p style={{ margin: '2px 0', color: '#6b7280', fontSize: 13 }}>📍 {act.location}</p>}
                                                    {act.estimatedCost && <p style={{ margin: '2px 0', color: '#6b7280', fontSize: 13 }}>💶 €{Number(act.estimatedCost).toFixed(2)}</p>}
                                                    {act.description && <p style={{ margin: '6px 0 0', fontSize: 13, color: '#4b5563' }}>{act.description}</p>}
                                                </div>
                                                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                                                    {act.status !== 'Completed' && (
                                                        <Button size="sm" onClick={() => setCompleting(act)} disabled={completingInProgress.has(act.id)}>Završi</Button>
                                                    )}
                                                    <Button size="sm" variant="ghost" onClick={() => setEditing(act)}>Uredi</Button>
                                                    <Button size="sm" variant="danger" onClick={() => setDeleting(act)}>Obriši</Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )
            ) : (
                <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                    <FullCalendar plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                        initialView="dayGridMonth"
                        events={calendarEvents}
                        eventClick={(info) => setEditing(info.event.extendedProps.activity)}
                        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek' }}
                        height="auto"
                        locale="sr"
                    />
                </div>
            )}

            <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Dodaj aktivnost" width={600}>
                <ActivityForm planId={planId} destinations={destinations} onSubmit={handleCreate} onCancel={() => setShowAdd(false)} loading={formLoading} />
            </Modal>
            <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Uredi aktivnost" width={600}>
                <ActivityForm planId={planId} initial={editing} destinations={destinations} onSubmit={handleUpdate} onCancel={() => setEditing(null)} loading={formLoading} />
            </Modal>
            <ConfirmDialog isOpen={!!deleting} title="Obriši aktivnost"
                message={`Obrisati aktivnost "${deleting?.name}"?`}
                onConfirm={handleDelete} onCancel={() => setDeleting(null)} danger />
            <ConfirmDialog isOpen={!!completing} title="Označi aktivnost kao završenu"
                message={`Označiti aktivnost "${completing?.name}" kao završenu?${completing?.estimatedCost ? ` Procijenjeni trošak: €${Number(completing.estimatedCost).toFixed(2)}` : ''}`}
                onConfirm={async () => {
                    setFormLoading(true);
                    // mark this activity as in-progress to prevent duplicate submissions
                    setCompletingInProgress(prev => new Set(prev).add(completing.id));
                    try {
                        await updateActivity(planId, completing.id, { status: 'Completed' });
                        toast.success('Aktivnost označena kao završena');
                    } catch (err) {
                        toast.error(err.response?.data?.message || 'Greška pri završavanju aktivnosti');
                    } finally {
                        setFormLoading(false);
                        setCompletingInProgress(prev => { const s = new Set(prev); s.delete(completing.id); return s; });
                        setCompleting(null);
                    }
                }} onCancel={() => setCompleting(null)} />
        </div>
    );
}

const viewBtn = { background: 'none', border: 'none', padding: '5px 14px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500, color: '#6b7280' };
const viewBtnActive = { background: '#fff', color: '#1e40af', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' };
