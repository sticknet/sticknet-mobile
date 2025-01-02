import {
    createSIWEConfig,
    formatMessage,
    type SIWECreateMessageArgs,
    type SIWESession,
    type SIWEVerifyMessageArgs,
} from '@reown/appkit-siwe-react-native';
import type {SIWEMessageArgs} from '@reown/appkit-siwe-react-native/lib/typescript/utils/TypeUtils';
import axios from '../actions/myaxios';
import {URL} from '../actions/URL';
import {store} from '../store';
import {appTemp} from '../actions/actionTypes';
import {globalData} from '../actions/globalVariables';
import {log} from '../actions/utils';

const siweConfig = createSIWEConfig({
    getNonce: async (): Promise<string> => {
        // The getNonce method functions as a safeguard
        // against spoofing, akin to a CSRF token.
        // It should be called before any message is signed.
        log('siwe: getNonce');
        const res = await axios.get(`${URL}/api/generate-nonce/`);
        return res.data;
    },
    verifyMessage: async ({message, signature}: SIWEVerifyMessageArgs): Promise<boolean> => {
        try {
            // This function ensures the message is valid,
            // has not been tampered with, and has been appropriately
            // signed by the wallet address.
            log('siwe: verifyMessage');
            await new Promise((resolve) => setTimeout(resolve, 500));
            const res = await axios.post(`${URL}/api/verify-siwe/`, {message, signature});
            globalData.walletVerifyResponse = res;
            return res.data.correct;
        } catch (error) {
            return false;
        }
    },
    getSession: async (): Promise<SIWESession | null> => {
        // The backend session should store the associated address and chainId
        // and return it via the `getSession` method.;
        log('siwe: getSession');
        const response = await axios.get(`${URL}/api/get-session/`);
        const session = response.data;
        if (!session.exists) return null;
        return session;
    },
    signOut: async (): Promise<boolean> => {
        try {
            // The users session must be destroyed when calling `signOut`.
            log('siwe: signOut');
            await axios.get(`${URL}/api/flush-session/`);
            return true;
        } catch {
            return false;
        }
    },
    createMessage: ({address, ...args}: SIWECreateMessageArgs): string => {
        // Method for generating an EIP-4361-compatible message.
        log('siwe: createMessage');
        return formatMessage(args, address);
    },
    getMessageParams: () => {
        // Parameters to create the SIWE message internally.
        // More info in https://github.com/ChainAgnostic/CAIPs/blob/main/CAIPs/caip-222.method
        log('siwe: getMessageParams');
        const siweMessage: SIWEMessageArgs = {
            domain: 'sticknet.org',
            uri: 'https://www.sticknet.org',
            chains: [1],
            statement: 'Please sign with your account',
            iat: new Date().toISOString(),
        };
        return Promise.resolve(siweMessage);
    },
    onSignIn: (session) => {
        log('siwe: onSignIn');
        store.dispatch({type: appTemp.DISPATCH_APPTEMP_PROPERTY, payload: {walletVerified: session?.address}});
    },
});

export default siweConfig;
