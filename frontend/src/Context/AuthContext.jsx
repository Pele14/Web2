/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, useEffect } from 'react';
import { authService } from '../Services';

const AuthContext = createContext(null);

const initialState = {
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
};

function authReducer(state, action) {
    switch (action.type) {
        case 'LOGIN_SUCCESS':
            return {
                ...state,
                user: action.payload.user,
                token: action.payload.token,
                isAuthenticated: true,
                isLoading: false,
            };
        case 'LOGOUT':
            return { ...initialState, isLoading: false };
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'UPDATE_USER':
            return { ...state, user: { ...state.user, ...action.payload } };
        default:
            return state;
    }
}

export function AuthProvider({ children }) {
    const [state, dispatch] = useReducer(authReducer, initialState);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const userStr = localStorage.getItem('user');
        if (token && userStr) {
            try {
                const user = JSON.parse(userStr);
                dispatch({ type: 'LOGIN_SUCCESS', payload: { user, token } });
            } catch {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                dispatch({ type: 'SET_LOADING', payload: false });
            }
        } else {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    }, []);

    const login = async (email, password) => {
        const { data } = await authService.login({ email, password });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: data.user, token: data.token } });
        return data;
    };

    const register = async (name, email, password) => {
        const { data } = await authService.register({ name, email, password });
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        dispatch({ type: 'LOGIN_SUCCESS', payload: { user: data.user, token: data.token } });
        return data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        dispatch({ type: 'LOGOUT' });
    };

    const updateUser = (userData) => {
        const updated = { ...state.user, ...userData };
        localStorage.setItem('user', JSON.stringify(updated));
        dispatch({ type: 'UPDATE_USER', payload: userData });
    };

    const isAdmin = state.user?.role === 'Admin';

    return (
        <AuthContext.Provider value={{ ...state, login, register, logout, updateUser, isAdmin }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
};