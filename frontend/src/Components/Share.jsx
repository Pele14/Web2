/* eslint-disable react-hooks/immutability */
/* eslint-disable react-hooks/exhaustive-deps */
import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { shareService } from '../Services';
import { Button, Modal, FormField, Select, ConfirmDialog } from './common';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export function ShareSection({ planId }) {
    const [tokens, setTokens] = useState([]);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [form, setForm] = useState({ accessType: 'View', expiryDays: '' });
    const [selectedQR, setSelectedQR] = useState(null);

    useEffect(() => { loadTokens(); }, [planId]);

    const loadTokens = async () => {
        try {
            const { data } = await shareService.getAll(planId);
            setTokens(data);
        } catch {
            // Silently fail - not critical
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        setCreating(true);
        try {
            const { data } = await shareService.create(planId, {
                accessType: form.accessType,
                expiryDays: form.expiryDays ? Number(form.expiryDays) : null,
            });
            setTokens(prev => [...prev, data]);
            toast.success('Link za dijeljenje kreiran');
            setShowCreate(false);
            setForm({ accessType: 'View', expiryDays: '' });
        } catch {
            toast.error('Greška pri kreiranju linka');
        } finally {
            setCreating(false);
        }
    };

    const handleDelete = async () => {
        try {
            await shareService.delete(planId, deleting.id);
            setTokens(prev => prev.filter(t => t.id !== deleting.id));
            toast.success('Link obrisan');
        } catch {
            toast.error('Greška pri brisanju');
        }
        setDeleting(null);
    };

    const copyLink = (url) => {
        navigator.clipboard.writeText(url).then(() => toast.success('Link kopiran!'));
    };

    const accessLabel = (t) => t === 'View' ? '👁 Pregled' : '✏️ Uređivanje';

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>🔗 Dijeljenje plana</h3>
                <Button size="sm" onClick={() => setShowCreate(true)}>+ Novi link</Button>
            </div>

            {tokens.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '32px 20px', background: '#f9fafb', borderRadius: 12, border: '1px dashed #d1d5db' }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🔗</div>
                    <p style={{ color: '#6b7280', fontSize: 14, margin: '0 0 16px' }}>Dijelite plan putovanja sa drugima putem QR koda ili linka</p>
                    <Button size="sm" onClick={() => setShowCreate(true)}>Kreiraj prvi link</Button>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: 12 }}>
                    {tokens.map(token => (
                        <div key={token.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: 16 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                        <span style={{ fontWeight: 700, fontSize: 14 }}>{accessLabel(token.accessType)}</span>
                                        {token.expiresAt && (
                                            <span style={{ fontSize: 11, color: '#6b7280', background: '#f3f4f6', padding: '2px 8px', borderRadius: 4 }}>
                                                Ističe: {format(new Date(token.expiresAt), 'dd.MM.yyyy')}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <input readOnly value={token.shareUrl} style={{ flex: 1, fontSize: 12, color: '#6b7280', border: '1px solid #e5e7eb', borderRadius: 6, padding: '5px 10px', background: '#f9fafb' }} />
                                        <Button size="sm" variant="outline" onClick={() => copyLink(token.shareUrl)}>Kopiraj</Button>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                    <Button size="sm" variant="ghost" onClick={() => setSelectedQR(token)}>QR kod</Button>
                                    <Button size="sm" variant="danger" onClick={() => setDeleting(token)}>Obriši</Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Modal */}
            <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Kreiraj link za dijeljenje">
                <form onSubmit={handleCreate}>
                    <FormField label="Nivo pristupa">
                        <Select value={form.accessType} onChange={e => setForm(f => ({ ...f, accessType: e.target.value }))}>
                            <option value="View">Pregled (VIEW) – može samo gledati</option>
                            <option value="Edit">Uređivanje (EDIT) – može mijenjati podatke</option>
                        </Select>
                    </FormField>
                    <FormField label="Isticanje linka (u danima, prazno = ne ističe)">
                        <input type="number" value={form.expiryDays}
                            onChange={e => setForm(f => ({ ...f, expiryDays: e.target.value }))}
                            placeholder="npr. 7" min="1"
                            style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14, boxSizing: 'border-box' }} />
                    </FormField>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
                        <Button type="button" variant="ghost" onClick={() => setShowCreate(false)}>Odustani</Button>
                        <Button type="submit" disabled={creating}>{creating ? 'Kreiranje...' : 'Kreiraj link'}</Button>
                    </div>
                </form>
            </Modal>

            {/* QR Modal */}
            <Modal isOpen={!!selectedQR} onClose={() => setSelectedQR(null)} title="QR kod za dijeljenje" width={380}>
                {selectedQR && (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: '#6b7280', fontSize: 14, marginBottom: 20 }}>
                            Skenirajte QR kod ili koristite link ispod za pristup putovanju
                        </p>
                        <div style={{ display: 'inline-block', padding: 16, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 12, marginBottom: 20 }}>
                            <QRCodeSVG value={selectedQR.shareUrl} size={200} level="Q" includeMargin />
                        </div>
                        <div style={{ background: '#f9fafb', borderRadius: 8, padding: 12, wordBreak: 'break-all', fontSize: 12, color: '#6b7280', marginBottom: 16 }}>
                            {selectedQR.shareUrl}
                        </div>
                        <Button onClick={() => copyLink(selectedQR.shareUrl)} style={{ width: '100%' }}>
                            📋 Kopiraj link
                        </Button>
                        <p style={{ fontSize: 12, color: '#9ca3af', marginTop: 12 }}>
                            Pristup: <strong>{accessLabel(selectedQR.accessType)}</strong>
                            {selectedQR.expiresAt && ` · Ističe: ${format(new Date(selectedQR.expiresAt), 'dd.MM.yyyy')}`}
                        </p>
                    </div>
                )}
            </Modal>

            <ConfirmDialog isOpen={!!deleting} title="Obriši link"
                message="Da li ste sigurni da želite da obrišete ovaj link? Svi koji imaju link više neće moći pristupiti planu."
                onConfirm={handleDelete} onCancel={() => setDeleting(null)} danger />
        </div>
    );
}
