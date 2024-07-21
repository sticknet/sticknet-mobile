import {waitFor} from '@testing-library/react-native';
import configureStore from '../../store';
import axiosMock from '../test_data/axiosMock';
import state from '../test_data/state.json';
import {iap} from '..';

describe('IAP actions', () => {
    let store: ReturnType<typeof configureStore>['store'];

    beforeAll(() => {
        axiosMock();
    });

    beforeEach(() => {
        const config = configureStore(state);
        store = config.store;
    });

    test('fetchSubscriptions()', async () => {
        const func = iap.fetchSubscriptions();
        await waitFor(() => func(store.dispatch));

        const newState = store.getState();
        expect(newState.subs).toBeDefined();
        expect(newState.subs.length).toBeGreaterThan(0);
        expect(newState.subs[0].productId).toBe('com.example.app.premium.1');
    });

    test('verifyReceipt()', async () => {
        const purchase = {
            transactionReceipt: 'receipt',
            transactionId: 'transactionId',
            productId: 'productId',
            transactionDate: 123,
        };
        const callback = jest.fn();

        const func = iap.verifyReceipt({purchase, callback});
        await waitFor(() => func(store.dispatch));

        const newState = store.getState();
        expect(newState.finishedTransactions.transactions).toEqual(['transactionId']);
        expect(newState.auth.user.subscription).toBe('premium');
    });

    test('fetchSubscriptionDetails()', async () => {
        const func = iap.fetchSubscriptionDetails();
        await waitFor(() => func(store.dispatch));

        const newState = store.getState();
        expect(newState.app.subscription.expires).toBe(123);
    });
});
