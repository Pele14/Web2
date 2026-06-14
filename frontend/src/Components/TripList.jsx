import{ useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrip } from '../Context/TripContext';
import { Button, Badge, ConfirmDialog, EmptyState, Modal } from './common';
import { TripForm } from './TripForm';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export function TripCard({ trip }) {
    const navigate = useNavigate();
    const { deleteTrip, updateTrip } = useTrip();
    const [showDelete, setShowDelete] = useState(false);
    const [showEdit, setShowEdit] = useState(false);
    const [editLoading, setEditLoading] = useState(false);

    const handleDelete = async () => {
        try {
            await deleteTrip(trip.id);
            toast.success('Putovanje je obrisano');
        } catch {
            toast.error('Greška pri brisanju');
        }
        setShowDelete(false);
    };

    const handleUpdate = async (data) => {
        setEditLoading(true);
        try {
            await updateTrip(trip.id, data);
            toast.success('Putovanje je ažurirano');
            setShowEdit(false);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Greška pri ažuriranju');
        } finally {
            setEditLoading(false);
        }
    };

    const startDate = trip.startDate ? format(new Date(trip.startDate), 'dd.MM.yyyy') : '';
    const endDate = trip.endDate ? format(new Date(trip.endDate), 'dd.MM.yyyy') : '';
    const isUpcoming = trip.startDate && new Date(trip.startDate) > new Date();
    const isPast = trip.endDate && new Date(trip.endDate) < new Date();

    return (
        <>
            <div style={cardStyle} onClick={() => navigate(`/trips/${trip.id}`)}>
                <div style={cardHeader}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#111827' }}>{trip.name}</h3>
                            {isUpcoming && <Badge text="Predstojeće" type="Planned" />}
                            {isPast && <Badge text="Završeno" type="Completed" />}
                            {!isUpcoming && !isPast && <Badge text="Aktivno" type="Reserved" />}
                        </div>
                        <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>
                            📅 {startDate} – {endDate}
                        </p>
                    </div>
                </div>

                {trip.description && (
                    <p style={{ margin: '10px 0', color: '#4b5563', fontSize: 14, lineHeight: 1.5 }}>
                        {trip.description.length > 100 ? trip.description.slice(0, 100) + '...' : trip.description}
                    </p>
                )}

                <div style={statsRow}>
                    <Stat icon="📍" label="Destinacije" value={trip.destinationCount || 0} />
                    <Stat icon="🗓" label="Aktivnosti" value={trip.activityCount || 0} />
                    <Stat icon="💶" label="Budžet" value={`€${Number(trip.budget || 0).toFixed(0)}`} />
                </div>

                <div style={cardFooter} onClick={e => e.stopPropagation()}>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/trips/${trip.id}`)}>
                        Detalji →
                    </Button>
                    <div style={{ display: 'flex', gap: 8 }}>
                        <Button variant="ghost" size="sm" onClick={() => setShowEdit(true)}>Uredi</Button>
                        <Button variant="danger" size="sm" onClick={() => setShowDelete(true)}>Obriši</Button>
                    </div>
                </div>
            </div>

            <ConfirmDialog isOpen={showDelete} title="Obriši putovanje"
                message={`Da li ste sigurni da želite da obrišete "${trip.name}"? Ova akcija je nepovratna.`}
                onConfirm={handleDelete} onCancel={() => setShowDelete(false)} danger />

            <Modal isOpen={showEdit} onClose={() => setShowEdit(false)} title="Uredi putovanje">
                <TripForm initial={trip} onSubmit={handleUpdate} onCancel={() => setShowEdit(false)} loading={editLoading} />
            </Modal>
        </>
    );
}

function Stat({ icon, label, value }) {
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18 }}>{icon}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#111827' }}>{value}</div>
            <div style={{ fontSize: 11, color: '#9ca3af' }}>{label}</div>
        </div>
    );
}

const cardStyle = {
    background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: 20,
    cursor: 'pointer', transition: 'box-shadow .2s, transform .2s',
    ':hover': { boxShadow: '0 4px 20px rgba(0,0,0,0.1)', transform: 'translateY(-2px)' },
};
const cardHeader = { display: 'flex', alignItems: 'flex-start', gap: 12 };
const statsRow = { display: 'flex', gap: 24, margin: '16px 0', paddingTop: 12, borderTop: '1px solid #f3f4f6' };
const cardFooter = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid #f3f4f6', marginTop: 4 };

export function TripList({ trips, onCreateClick }) {
    if (!trips || trips.length === 0) {
        return (
            <EmptyState icon="✈️" title="Nema putovanja"
                description="Kreirajte vaše prvo putovanje i počnite planirati avanturu!"
                action={<Button onClick={onCreateClick}>+ Novo putovanje</Button>} />
        );
    }

    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
            {trips.map(trip => <TripCard key={trip.id} trip={trip} />)}
        </div>
    );
}
