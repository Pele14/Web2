/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useReducer, useCallback } from 'react';
import { tripService, destinationService, activityService, checklistService, expenseService } from '../Services';

const TripContext = createContext(null);

const initialState = {
    trips: [],
    currentTrip: null,
    destinations: [],
    activities: [],
    checklist: [],
    expenses: [],
    budgetSummary: null,
    loading: false,
    error: null,
};

function tripReducer(state, action) {
    switch (action.type) {
        case 'SET_LOADING': return { ...state, loading: action.payload };
        case 'SET_ERROR': return { ...state, error: action.payload, loading: false };
        case 'SET_TRIPS': return { ...state, trips: action.payload, loading: false };
        case 'SET_CURRENT_TRIP': return { ...state, currentTrip: action.payload, loading: false };
        case 'ADD_TRIP': return { ...state, trips: [action.payload, ...state.trips] };
        case 'UPDATE_TRIP':
            return {
                ...state,
                trips: state.trips.map(t => t.id === action.payload.id ? action.payload : t),
                currentTrip: state.currentTrip?.id === action.payload.id ? { ...state.currentTrip, ...action.payload } : state.currentTrip,
            };
        case 'REMOVE_TRIP':
            return { ...state, trips: state.trips.filter(t => t.id !== action.payload) };

        case 'SET_DESTINATIONS': return { ...state, destinations: action.payload };
        case 'ADD_DESTINATION': return { ...state, destinations: [...state.destinations, action.payload] };
        case 'UPDATE_DESTINATION':
            return { ...state, destinations: state.destinations.map(d => d.id === action.payload.id ? action.payload : d) };
        case 'REMOVE_DESTINATION':
            return { ...state, destinations: state.destinations.filter(d => d.id !== action.payload) };

        case 'SET_ACTIVITIES': return { ...state, activities: action.payload };
        case 'ADD_ACTIVITY': return { ...state, activities: [...state.activities, action.payload] };
        case 'UPDATE_ACTIVITY':
            return { ...state, activities: state.activities.map(a => a.id === action.payload.id ? action.payload : a) };
        case 'REMOVE_ACTIVITY':
            return { ...state, activities: state.activities.filter(a => a.id !== action.payload) };

        case 'SET_CHECKLIST': return { ...state, checklist: action.payload };
        case 'ADD_CHECKLIST_ITEM': return { ...state, checklist: [...state.checklist, action.payload] };
        case 'UPDATE_CHECKLIST_ITEM':
            return { ...state, checklist: state.checklist.map(c => c.id === action.payload.id ? action.payload : c) };
        case 'REMOVE_CHECKLIST_ITEM':
            return { ...state, checklist: state.checklist.filter(c => c.id !== action.payload) };

        case 'SET_EXPENSES': return { ...state, expenses: action.payload };
        case 'SET_BUDGET_SUMMARY': return { ...state, budgetSummary: action.payload };
        case 'ADD_EXPENSE': return { ...state, expenses: [action.payload, ...state.expenses] };
        case 'UPDATE_EXPENSE':
            return { ...state, expenses: state.expenses.map(e => e.id === action.payload.id ? action.payload : e) };
        case 'REMOVE_EXPENSE':
            return { ...state, expenses: state.expenses.filter(e => e.id !== action.payload) };

        default: return state;
    }
}

export function TripProvider({ children }) {
    const [state, dispatch] = useReducer(tripReducer, initialState);

    // Expenses Summary (Podignuto gore jer ga Activity Service poziva)
    const fetchExpenseSummary = useCallback(async (planId) => {
        const { data } = await expenseService.getSummary(planId);
        dispatch({ type: 'SET_BUDGET_SUMMARY', payload: data });
        dispatch({ type: 'SET_EXPENSES', payload: data.expenses || [] });
    }, []);

    // Trips
    const fetchTrips = useCallback(async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const { data } = await tripService.getAll();
            dispatch({ type: 'SET_TRIPS', payload: data });
        } catch (e) {
            dispatch({ type: 'SET_ERROR', payload: e.response?.data?.message || 'Failed to load trips' });
        }
    }, []);

    const fetchTrip = useCallback(async (id) => {
        dispatch({ type: 'SET_LOADING', payload: true });
        try {
            const { data } = await tripService.getById(id);
            dispatch({ type: 'SET_CURRENT_TRIP', payload: data });
            dispatch({ type: 'SET_DESTINATIONS', payload: data.destinations || [] });
            dispatch({ type: 'SET_ACTIVITIES', payload: data.activities || [] });
            dispatch({ type: 'SET_CHECKLIST', payload: data.checklistItems || [] });
        } catch (e) {
            dispatch({ type: 'SET_ERROR', payload: e.response?.data?.message || 'Failed to load trip' });
        }
    }, []);

    const createTrip = async (data) => {
        const { data: trip } = await tripService.create(data);
        dispatch({ type: 'ADD_TRIP', payload: trip });
        return trip;
    };

    const updateTrip = async (id, data) => {
        const { data: trip } = await tripService.update(id, data);
        dispatch({ type: 'UPDATE_TRIP', payload: trip });
        return trip;
    };

    const deleteTrip = async (id) => {
        await tripService.delete(id);
        dispatch({ type: 'REMOVE_TRIP', payload: id });
    };

    // Destinations
    const createDestination = async (planId, data) => {
        const { data: dest } = await destinationService.create(planId, data);
        dispatch({ type: 'ADD_DESTINATION', payload: dest });
        return dest;
    };

    const updateDestination = async (planId, id, data) => {
        const { data: dest } = await destinationService.update(planId, id, data);
        dispatch({ type: 'UPDATE_DESTINATION', payload: dest });
        return dest;
    };

    const deleteDestination = async (planId, id) => {
        await destinationService.delete(planId, id);
        dispatch({ type: 'REMOVE_DESTINATION', payload: id });
    };

    // Activities
    const createActivity = async (planId, data) => {
        const { data: act } = await activityService.create(planId, data);
        dispatch({ type: 'ADD_ACTIVITY', payload: act });
        return act;
    };

    const updateActivity = async (planId, id, data) => {
        const { data: act } = await activityService.update(planId, id, data);
        dispatch({ type: 'UPDATE_ACTIVITY', payload: act });

        try {
            const prev = state.activities.find(a => a.id === id);
            const becameCompleted = prev && prev.status !== act.status && act.status === 'Completed';
            const cost = act.estimatedCost || 0;

            if (becameCompleted && cost > 0) {
                const { data: exp } = await expenseService.create(planId, {
                    name: act.name,
                    amount: cost,
                    date: act.date,
                    description: `Auto-created from activity: ${act.name}`,
                });
                dispatch({ type: 'ADD_EXPENSE', payload: exp });
                await fetchExpenseSummary(planId);
            }
        } catch (e) {
            dispatch({ type: 'SET_ERROR', payload: e.response?.data?.message || 'Failed to create expense from activity' });
        }

        return act;
    };

    const deleteActivity = async (planId, id) => {
        await activityService.delete(planId, id);
        dispatch({ type: 'REMOVE_ACTIVITY', payload: id });
    };

    // Checklist
    const createChecklistItem = async (planId, data) => {
        const { data: item } = await checklistService.create(planId, data);
        dispatch({ type: 'ADD_CHECKLIST_ITEM', payload: item });
        return item;
    };

    const updateChecklistItem = async (planId, id, data) => {
        const { data: item } = await checklistService.update(planId, id, data);
        dispatch({ type: 'UPDATE_CHECKLIST_ITEM', payload: item });
        return item;
    };

    const deleteChecklistItem = async (planId, id) => {
        await checklistService.delete(planId, id);
        dispatch({ type: 'REMOVE_CHECKLIST_ITEM', payload: id });
    };

    // Expenses CRUD
    const createExpense = async (planId, data) => {
        const { data: exp } = await expenseService.create(planId, data);
        dispatch({ type: 'ADD_EXPENSE', payload: exp });
        return exp;
    };

    const updateExpense = async (planId, id, data) => {
        const { data: exp } = await expenseService.update(planId, id, data);
        dispatch({ type: 'UPDATE_EXPENSE', payload: exp });
        return exp;
    };

    const deleteExpense = async (planId, id) => {
        await expenseService.delete(planId, id);
        dispatch({ type: 'REMOVE_EXPENSE', payload: id });
    };

    return (
        <TripContext.Provider value={{
            ...state,
            fetchTrips, fetchTrip, createTrip, updateTrip, deleteTrip,
            createDestination, updateDestination, deleteDestination,
            createActivity, updateActivity, deleteActivity,
            createChecklistItem, updateChecklistItem, deleteChecklistItem,
            fetchExpenseSummary, createExpense, updateExpense, deleteExpense,
            dispatch,
        }}>
            {children}
        </TripContext.Provider>
    );
}

export const useTrip = () => {
    const ctx = useContext(TripContext);
    if (!ctx) throw new Error('useTrip must be used within TripProvider');
    return ctx;
};