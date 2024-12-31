import React, {FC, ReactNode} from 'react';
import '@walletconnect/react-native-compat';
import {mainnet, polygon, arbitrum, optimism} from '@wagmi/core/chains';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {createAppKit, defaultWagmiConfig, AppKit} from '@reown/appkit-wagmi-react-native';
import {WagmiProvider} from 'wagmi';
import DeviceInfo from 'react-native-device-info';
import {coinbaseConnector} from '@reown/appkit-coinbase-wagmi-react-native';
import siweConfig from './siweConfig';
import {globalData} from '../actions/globalVariables';

// 0. Setup queryClient
const queryClient = new QueryClient();
//
// 1. Get projectId at https://cloud.reown.com
const projectId = '858fe7c1b740043cb35051384b89859b';
//
// 2. Create config
const bundleId = DeviceInfo.getBundleId();
const metadata = {
    name: 'Sticknet',
    description: 'Secure Social Storage',
    url: 'https://sticknet.org',
    icons: [
        'https://firebasestorage.googleapis.com/v0/b/stiiick-1545628981656.appspot.com/o/sticknet-small.png?alt=media&token=145ee059-7a0f-42b4-b03e-7547a0429411',
    ],
    redirect: {
        native: `${bundleId}://`,
        universal: 'https://sticknet.org',
        linkMode: true,
    },
};

const coinbase = coinbaseConnector({
    redirect: `${bundleId}://`,
});

const chains = [mainnet, polygon, arbitrum, optimism] as const;

const wagmiConfig = defaultWagmiConfig({chains, projectId, metadata, extraConnectors: [coinbase]});

// 3. Create modal
console.log('GLGLO', globalData.loggedIn);
createAppKit({
    projectId,
    wagmiConfig,
    defaultChain: mainnet, // Optional
    enableAnalytics: true, // Optional - defaults to your Cloud configuration
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
