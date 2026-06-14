/* eslint-disable react-hooks/set-state-in-effect */
import  { useState, useEffect } from 'react';
import { Button, FormField, Input, Textarea } from './common';

const today = new Date().toISOString().split('T')[0];

export function TripForm({ initial = null, onSubmit, onCancel, loading }) {
    const [form, setForm] = useState({
        name: '',
        description: '',
        startDate: today,
        endDate: today,
        budget: '',
        notes: '',
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (initial) {
            setForm({
                name: initial.name || '',
                description: initial.description || '',
                startDate: initial.startDate?.split('T')[0] || today,
                endDate: initial.endDate?.split('T')[0] || today,
                budget: initial.budget?.toString() || '',
                notes: initial.notes || '',
            });
        }
    }, [initial]);

    const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }));

    const validate = () => {
        const e = {};
        if (!form.name.trim()) e.name = 'Naziv putovanja je obavezan';
        if (!form.startDate) e.startDate = 'Početni datum je obavezan';
        if (!form.endDate) e.endDate = 'Krajnji datum je obavezan';
        if (form.startDate && form.endDate && form.endDate < form.startDate)
            e.endDate = 'Krajnji datum ne može biti prije početnog';
        if (form.budget !== '' && (isNaN(Number(form.budget)) || Number(form.budget) < 0))
            e.budget = 'Budžet mora biti pozitivan broj';
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;
        onSubmit({
            name: form.name.trim(),
            description: form.description.trim() || null,
            startDate: form.startDate,
            endDate: form.endDate,
            budget: form.budget !== '' ? Number(form.budget) : 0,
            notes: form.notes.trim() || null,
        });
    };

    return (
        <form onSubmit={handleSubmit}>
            <FormField label="Naziv putovanja" error={errors.name} required>
                <Input value={form.name} onChange={set('name')} placeholder="npr. Odmor na Mediteranu"
                    style={{ borderColor: errors.name ? '#ef4444' : undefined }} />
            </FormField>

            <FormField label="Opis" error={errors.description}>
                <Textarea value={form.description} onChange={set('description')}
                    placeholder="Kratki opis putovanja..." rows={3} />
            </FormField>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <FormField label="Početni datum" error={errors.startDate} required>
                    <Input type="date" value={form.startDate} onChange={set('startDate')}
                        style={{ borderColor: errors.startDate ? '#ef4444' : undefined }} />
                </FormField>
                <FormField label="Krajnji datum" error={errors.endDate} required>
                    <Input type="date" value={form.endDate} onChange={set('endDate')}
                        min={form.startDate}
                        style={{ borderColor: errors.endDate ? '#ef4444' : undefined }} />
                </FormField>
            </div>

            <FormField label="Planirani budžet (€)" error={errors.budget}>
                <Input type="number" value={form.budget} onChange={set('budget')} placeholder="0.00"
                    min="0" step="0.01"
                    style={{ borderColor: errors.budget ? '#ef4444' : undefined }} />
            </FormField>

            <FormField label="Napomene" error={errors.notes}>
                <Textarea value={form.notes} onChange={set('notes')}
                    placeholder="Dodatne napomene o putovanju..." rows={3} />
            </FormField>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                <Button type="button" variant="ghost" onClick={onCancel}>Odustani</Button>
                <Button type="submit" disabled={loading}>
                    {loading ? 'Čuvanje...' : initial ? 'Sačuvaj izmjene' : 'Kreiraj putovanje'}
                </Button>
            </div>
        </form>
    );
}
