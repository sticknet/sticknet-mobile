import {
    createSIWEConfig,
    formatMessage,
    type SIWECreateMessageArgs,
    type SIWESession,
    type SIWEVerifyMessageArgs,
} from '@reown/appkit-siwe-react-native';
import type {SIWEMessageArgs} from '@reown/appkit-siwe-react-native/lib/typescript/utils/TypeUtils';
import {URL as API} from '../actions/URL';
import {globalData} from '../actions/globalVariables';
import {store} from '../store';
import {appTemp} from '../actions/actionTypes';

const siweConfig = createSIWEConfig({
    getNonce: async (): Promise<string> => {
        // The getNonce method functions as a safeguard
        // against spoofing, akin to a CSRF token.
        // It should be called before any message is signed.
        const res = await fetch(`${API}/api/generate-nonce/`);
        return res.json();
    },
    verifyMessage: async ({message, signature}: SIWEVerifyMessageArgs): Promise<boolean> => {
        try {
            // This function ensures the message is valid,
            // has not been tampered with, and has been appropriately
            // signed by the wallet address.
            const res = await fetch(`${API}/api/verify-siwe/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({message, signature}),
            });
            const verified = await res.json();
            globalData.a = '1';
            return verified;
        } catch (error) {
            return false;
        }
    },
    getSession: async (): Promise<SIWESession | null> => {
        // The backend session should store the associated address and chainId
        // and return it via the `getSession` method.;
        const response = await fetch(`${API}/api/get-session/`);
        const session = await response.json();
        if (!session.exists) return null;
        return session;
    },
    signOut: async (): Promise<boolean> => {
        try {
            // The users session must be destroyed when calling `signOut`.
            await fetch(`${API}/api/flush-session/`);
            return Promise.resolve(true);
        } catch {
            return Promise.resolve(false);
        }
    },
    createMessage: ({address, ...args}: SIWECreateMessageArgs): string => {
        // Method for generating an EIP-4361-compatible message.
        return formatMessage(args, address);
    },
    getMessageParams: () => {
        // Parameters to create the SIWE message internally.
        // More info in https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-222.method
        const siweMessage: SIWEMessageArgs = {
            domain: 'sticknet.org',
            uri: 'https://sticknet.org',
            chains: [1],
            statement: 'Please sign with your account',
            iat: new Date().toISOString(),
        };
        return Promise.resolve(siweMessage);
    },
    onSignIn: (session) => {
        // dispatch a wallet verified state, then on trigger inside authscreen call props.handlecodeverified and navigate
        store.dispatch({type: appTemp.DISPATCH_APPTEMP_PROPERTY, payload: {walletVerified: session?.address}});
    },
});

export default siweConfig;

// 1. onSignIn, call wallet-verified to navigate to create new account
// 2. Create new wallet password screen
// 3. sign and generate a password, then finish registrations
