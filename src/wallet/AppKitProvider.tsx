import '@walletconnect/react-native-compat';
import React, {FC, ReactNode} from 'react';
import DeviceInfo from 'react-native-device-info';
import {createAppKit, AppKit, defaultConfig} from '@reown/appkit-ethers-react-native';
import {CoinbaseProvider} from '@reown/appkit-coinbase-ethers-react-native';
import siweConfig from './siweConfig';

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

const mainnet = {
    chainId: 1,
    name: 'Ethereum',
    currency: 'ETH',
    explorerUrl: 'https://etherscan.io',
    rpcUrl: `https://eth.drpc.org`,
};

const coinbaseProvider = new CoinbaseProvider({
    redirect: `${bundleId}://`,
    rpcUrl: mainnet.rpcUrl,
});

const chains = [mainnet];

const config = defaultConfig({metadata, extraConnectors: [coinbaseProvider]});

createAppKit({
    projectId,
    chains,
    config,
    defaultChain: mainnet,
    enableAnalytics: true,
    siweConfig,
    metadata,
});

const AppKitProvider: FC<{children: ReactNode}> = ({children}) => {
    return (
        <>
            {children}
            <AppKit />
        </>
    );
};

export default AppKitProvider;
