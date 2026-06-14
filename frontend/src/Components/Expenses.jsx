/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { useTrip } from '../Context/TripContext';
import { Button, Modal, FormField, Input, Select, Textarea, ConfirmDialog, EmptyState } from './common';
import { EXPENSE_CATEGORIES, CATEGORY_COLORS } from '../Models';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

function ExpenseForm({ initial = null, onSubmit, onCancel, loading }) {
    const { currentTrip } = useTrip();
    const minDate = currentTrip?.startDate?.split('T')[0] || '';
    const maxDate = currentTrip?.endDate?.split('T')[0] || '';
    const [form, setForm] = useState({
        name: initial?.name || '',
        category: initial?.category || 'Other',
        amount: initial?.amount?.toString() || '',
        date: initial?.date?.split('T')[0] || minDate || new Date().toISOString().split('T')[0],
        description: initial?.description || '',
    });
    const [errors, setErrors] = useState({});
    const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }));

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Naziv troška je obavezan';
        if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) e.amount = 'Iznos mora biti pozitivan';
        if (!form.date) e.date = 'Datum je obavezan';
        if (form.date && minDate && form.date < minDate) e.date = `Datum mora biti poslije ${minDate}`;
        if (form.date && maxDate && form.date > maxDate) e.date = `Datum mora biti prije ${maxDate}`;
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;
        onSubmit({ name: form.name.trim(), category: form.category, amount: Number(form.amount), date: form.date, description: form.description || null });
    };

    const catLabel = (c) => ({ Transport: 'Prevoz', Accommodation: 'Smještaj', Food: 'Hrana', Tickets: 'Ulaznice', Shopping: 'Kupovina', Other: 'Ostalo' }[c] || c);

    return (
        <form onSubmit={handleSubmit}>
            <FormField label="Naziv troška" error={errors.name} required>
                <Input value={form.name} onChange={set('name')} placeholder="npr. Let Beograd–Dubrovnik" />
            </FormField>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormField label="Kategorija">
                    <Select value={form.category} onChange={set('category')}>
                        {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{catLabel(c)}</option>)}
                    </Select>
                </FormField>
                <FormField label="Iznos (€)" error={errors.amount} required>
                    <Input type="number" value={form.amount} onChange={set('amount')} placeholder="0.00" min="0.01" step="0.01" />
                </FormField>
            </div>
            <FormField label="Datum" error={errors.date} required>
                <Input type="date" value={form.date} onChange={set('date')} min={minDate || undefined} max={maxDate || undefined} />
            </FormField>
            <FormField label="Opis">
                <Textarea value={form.description} onChange={set('description')} placeholder="Opis troška..." rows={2} />
            </FormField>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <Button type="button" variant="ghost" onClick={onCancel}>Odustani</Button>
                <Button type="submit" disabled={loading}>{loading ? 'Čuvanje...' : initial ? 'Sačuvaj' : 'Dodaj trošak'}</Button>
            </div>
        </form>
    );
}

function BudgetBar({ spent, budget }) {
    const pct = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
    const remaining = budget - spent;
    const color = pct > 90 ? '#ef4444' : pct > 70 ? '#f59e0b' : '#10b981';

    return (
        <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: 20, marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Ukupno potrošeno</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: '#111827' }}>€{Number(spent).toFixed(2)}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 2 }}>Preostali budžet</div>
                    <div style={{ fontSize: 24, fontWeight: 800, color: remaining >= 0 ? '#15803d' : '#dc2626' }}>
                        {remaining >= 0 ? '+' : ''}€{Number(remaining).toFixed(2)}
                    </div>
                </div>
            </div>
            {budget > 0 && (
                <>
                    <div style={{ background: '#e5e7eb', borderRadius: 99, height: 10, overflow: 'hidden' }}>
                        <div style={{ background: color, height: '100%', width: `${pct}%`, borderRadius: 99, transition: 'width .5s' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 12, color: '#6b7280' }}>
                        <span>{pct.toFixed(1)}% iskorišteno</span>
                        <span>Budžet: €{Number(budget).toFixed(2)}</span>
                    </div>
                </>
            )}
        </div>
    );
}

const catLabel = (c) => ({ Transport: 'Prevoz', Accommodation: 'Smještaj', Food: 'Hrana', Tickets: 'Ulaznice', Shopping: 'Kupovina', Other: 'Ostalo' }[c] || c);

export function ExpensesSection({ planId, budget }) {
    const { expenses, budgetSummary, fetchExpenseSummary, createExpense, updateExpense, deleteExpense } = useTrip();
    const [showAdd, setShowAdd] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => { fetchExpenseSummary(planId); }, [planId]);

    const handleCreate = async (data) => {
        setFormLoading(true);
        try {
            await createExpense(planId, data);
            await fetchExpenseSummary(planId);
            toast.success('Trošak dodat');
            setShowAdd(false);
        } catch (err) { toast.error(err.response?.data?.message || 'Greška'); }
        finally { setFormLoading(false); }
    };

    const handleUpdate = async (data) => {
        setFormLoading(true);
        try {
            await updateExpense(planId, editing.id, data);
            await fetchExpenseSummary(planId);
            toast.success('Trošak ažuriran');
            setEditing(null);
        } catch (err) { toast.error(err.response?.data?.message || 'Greška'); }
        finally { setFormLoading(false); }
    };

    const handleDelete = async () => {
        try {
            await deleteExpense(planId, deleting.id);
            await fetchExpenseSummary(planId);
            toast.success('Trošak obrisan');
        } catch { toast.error('Greška pri brisanju'); }
        setDeleting(null);
    };

    const totalSpent = budgetSummary?.totalExpenses || 0;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>💶 Troškovi i budžet</h3>
                <Button size="sm" onClick={() => setShowAdd(true)}>+ Dodaj trošak</Button>
            </div>

            <BudgetBar spent={totalSpent} budget={budget} />

            {budgetSummary?.byCategory && Object.keys(budgetSummary.byCategory).length > 0 && (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                    {Object.entries(budgetSummary.byCategory).map(([cat, amt]) => (
                        <div key={cat} style={{ background: '#f8fafc', border: `2px solid ${CATEGORY_COLORS[cat] || '#6b7280'}20`, borderRadius: 8, padding: '8px 14px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600 }}>{catLabel(cat)}</span>
                            <span style={{ fontSize: 16, fontWeight: 700, color: CATEGORY_COLORS[cat] || '#374151' }}>€{Number(amt).toFixed(2)}</span>
                        </div>
                    ))}
                </div>
            )}

            {expenses.length === 0 ? (
                <EmptyState icon="💶" title="Nema troškova" description="Počnite evidentirati troškove putovanja"
                    action={<Button size="sm" onClick={() => setShowAdd(true)}>+ Dodaj prvi trošak</Button>} />
            ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                    {expenses.map(exp => (
                        <div key={exp.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderLeft: `4px solid ${CATEGORY_COLORS[exp.category] || '#6b7280'}`, borderRadius: 8, padding: '12px 16px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                                        <span style={{ fontWeight: 700, fontSize: 15 }}>{exp.name}</span>
                                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 10, background: `${CATEGORY_COLORS[exp.category] || '#6b7280'}15`, color: CATEGORY_COLORS[exp.category] || '#6b7280', fontWeight: 600 }}>
                                            {catLabel(exp.category)}
                                        </span>
                                    </div>
                                    {exp.date && <p style={{ margin: '2px 0 0', fontSize: 12, color: '#9ca3af' }}>{format(new Date(exp.date), 'dd.MM.yyyy')}</p>}
                                    {exp.description && <p style={{ margin: '4px 0 0', fontSize: 13, color: '#4b5563' }}>{exp.description}</p>}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <span style={{ fontSize: 18, fontWeight: 800, color: '#111827' }}>€{Number(exp.amount).toFixed(2)}</span>
                                    <div style={{ display: 'flex', gap: 6 }}>
                                        <Button size="sm" variant="ghost" onClick={() => setEditing(exp)}>Uredi</Button>
                                        <Button size="sm" variant="danger" onClick={() => setDeleting(exp)}>Obriši</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Dodaj trošak">
                <ExpenseForm onSubmit={handleCreate} onCancel={() => setShowAdd(false)} loading={formLoading} />
            </Modal>
            <Modal isOpen={!!editing} onClose={() => setEditing(null)} title="Uredi trošak">
                <ExpenseForm initial={editing} onSubmit={handleUpdate} onCancel={() => setEditing(null)} loading={formLoading} />
            </Modal>
            <ConfirmDialog isOpen={!!deleting} title="Obriši trošak"
                message={`Obrisati trošak "${deleting?.name}"?`}
                onConfirm={handleDelete} onCancel={() => setDeleting(null)} danger />
        </div>
    );
}
