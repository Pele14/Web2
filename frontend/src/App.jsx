
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './Context/AuthContext';
import { TripProvider } from './Context/TripContext';
import { Navbar } from './Components/common';
import {
    HomePage,
    TripsPage,
    TripDetailPage,
    SharedPlanPage,
    AdminPage,
    ProfilePage,
} from './pages';
import { LoginForm, RegisterForm } from './Components/AuthForms';
import { Loading } from './Components/common';

function ProtectedRoute({ children, adminOnly = false }) {
    const { isAuthenticated, isLoading, isAdmin } = useAuth();

    if (isLoading) return <Loading />;
    if (!isAuthenticated) return <Navigate to="/login" replace />;
    if (adminOnly && !isAdmin) return <Navigate to="/trips" replace />;

    return children;
}

function GuestRoute({ children }) {
    const { isAuthenticated, isLoading } = useAuth();
    if (isLoading) return <Loading />;
    if (isAuthenticated) return <Navigate to="/trips" replace />;
    return children;
}

function AppRoutes() {
    return (
        <>
            <Navbar />
            <Routes>
                {/* Public */}
                <Route path="/" element={<HomePage />} />
                <Route path="/shared/:token" element={<SharedPlanPage />} />

                {/* Guest only */}
                <Route path="/login" element={<GuestRoute><LoginForm /></GuestRoute>} />
                <Route path="/register" element={<GuestRoute><RegisterForm /></GuestRoute>} />

                {/* Protected */}
                <Route path="/trips" element={<ProtectedRoute><TripProvider><TripsPage /></TripProvider></ProtectedRoute>} />
                <Route path="/trips/:id" element={<ProtectedRoute><TripProvider><TripDetailPage /></TripProvider></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute adminOnly><AdminPage /></ProtectedRoute>} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </>
    );
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
                <Toaster
                    position="top-right"
                    toastOptions={{
                        duration: 3500,
                        style: { borderRadius: 10, fontSize: 14, fontWeight: 500 },
                        success: { iconTheme: { primary: '#10b981', secondary: '#fff' } },
                        error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
                    }}
                />
            </AuthProvider>
        </BrowserRouter>
    );
}
