import {applyMiddleware, createStore, compose, Store} from 'redux';
import {persistReducer, persistStore, Persistor} from 'redux-persist';
import thunk from 'redux-thunk';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Config from 'react-native-config';
import reducers from '../reducers';
import whitelist from './whitelist';

const persistConfig = {
    key: 'root',
    storage: AsyncStorage,
    whitelist,
};

const persistedReducer = persistReducer(persistConfig, reducers);

export default function configureStore(preloadedState: object = {}): {store: Store; persistor: Persistor} {
    let store: Store;
    if (__DEV__) {
        const Reactotron = require('reactotron-react-native').default;
        if (Config.TESTING !== '1' && Reactotron.createEnhancer) {
            // DEV
            store = createStore(
                persistedReducer,
                preloadedState,
                compose(applyMiddleware(thunk), Reactotron.createEnhancer()),
            );
        } else if (Config.TESTING !== '1') {
            // LOCAL TESTING
            store = createStore(reducers, preloadedState, applyMiddleware(thunk));
        } else {
            // E2E TESTING
            store = createStore(persistedReducer, preloadedState, applyMiddleware(thunk));
        }
    } else {
        // PRODUCTION
        store = createStore(persistedReducer, preloadedState, applyMiddleware(thunk));
    }
    const persistor = persistStore(store);
    return {store, persistor};
}
