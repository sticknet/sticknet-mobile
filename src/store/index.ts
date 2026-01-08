import {applyMiddleware, createStore, Middleware, Store} from 'redux';
import thunk from 'redux-thunk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';

import reducers from '@/src/reducers';
import whitelist from './whitelist';

const STORAGE_KEY = 'root';

let store: Store;

/**
 * Load persisted state (only whitelisted reducers)
 */
async function loadPersistedState(): Promise<object | undefined> {
    try {
        const raw = await AsyncStorage.getItem(STORAGE_KEY);
        if (!raw) return undefined;

        const persisted = JSON.parse(raw);

        // Safety: only hydrate whitelisted keys
        const preloadedState: Record<string, any> = {};
        for (const key of whitelist) {
            if (persisted[key] !== undefined) {
                preloadedState[key] = persisted[key];
            }
        }

        return preloadedState;
    } catch (e) {
        console.warn('[store] Failed to load persisted state', e);
        return undefined;
    }
}

/**
 * Persist middleware (writes whitelisted slices only)
 */
const persistMiddleware: Middleware = storeAPI => next => action => {
    const result = next(action);

    try {
        const state = storeAPI.getState();
        const toPersist: Record<string, any> = {};

        for (const key of whitelist) {
            toPersist[key] = state[key];
        }

        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(toPersist));
    } catch (e) {
        console.warn('[store] Failed to persist state', e);
    }

    return result;
};

/**
 * Configure store (async rehydration)
 */
export default async function configureStore(
    preloadedState: object = {},
): Promise<{ store: Store }> {
    const persistedState = await loadPersistedState();

    const initialState = {
        ...preloadedState,
        ...persistedState,
    };

    const middlewares = applyMiddleware(thunk, persistMiddleware);

    if (__DEV__) {

        if (Config.TESTING !== '1') {
            store = createStore(reducers, initialState, middlewares);
        } else {
            // LOCAL / TESTING
            store = createStore(reducers, initialState, middlewares);
        }
    } else {
        // PRODUCTION
        store = createStore(reducers, initialState, middlewares);
    }

    return { store };
}

export { store };
