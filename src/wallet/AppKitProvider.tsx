import '@walletconnect/react-native-compat';
import React, {FC, ReactNode} from 'react';
import {mainnet, polygon, arbitrum, optimism} from '@wagmi/core/chains';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {createAppKit, defaultWagmiConfig, AppKit} from '@reown/appkit-wagmi-react-native';
import {WagmiProvider} from 'wagmi';
import DeviceInfo from 'react-native-device-info';
import {coinbaseConnector} from '@reown/appkit-coinbase-wagmi-react-native';
import siweConfig from './siweConfig';

const queryClient = new QueryClient();

const projectId = '858fe7c1b740043cb35051384b89859b';

const bundleId = DeviceInfo.getBundleId();

const metadata = {
    name: 'Sticknet',
    description: 'Secure Social Storage',
    url: 'https://www.sticknet.org',
    icons: [
        'https://firebasestorage.googleapis.com/v0/b/stiiick-1545628981656.appspot.com/o/sticknet-small.png?alt=media&token=145ee059-7a0f-42b4-b03e-7547a0429411',
    ],
    redirect: {
        native: `${bundleId}://`,
        universal: 'https://www.sticknet.org',
    },
};

const coinbase = coinbaseConnector({
    redirect: `${bundleId}://`,
});

const chains = [mainnet, polygon, arbitrum, optimism] as const;

const wagmiConfig = defaultWagmiConfig({chains, projectId, metadata, extraConnectors: [coinbase]});

createAppKit({
    projectId,
    wagmiConfig,
    defaultChain: mainnet,
    enableAnalytics: true,
    siweConfig,
    metadata,
});

const AppKitProvider: FC<{children: ReactNode}> = ({children}) => {
    return (
        <WagmiProvider config={wagmiConfig}>
            <QueryClientProvider client={queryClient}>
                {children}
                <AppKit />
            </QueryClientProvider>
        </WagmiProvider>
    );
};

export default AppKitProvider;
