import React, {Component} from 'react';
import {LogBox, StatusBar, Text, TextInput} from 'react-native';
import * as Animatable from 'react-native-animatable';
import Orientation from 'react-native-orientation-locker';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import * as Sentry from '@sentry/react-native';
import {DefaultTheme, NavigationContainer} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import '@walletconnect/react-native-compat';
import {WagmiProvider} from 'wagmi';
import {mainnet, polygon, arbitrum, optimism} from '@wagmi/core/chains';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import {createAppKit, defaultWagmiConfig, AppKit} from '@reown/appkit-wagmi-react-native';

import DeviceInfo from 'react-native-device-info';
import {coinbaseConnector} from '@reown/appkit-coinbase-wagmi-react-native';
import animations from './utils/animations';
import TabNavigator from './navigators/TabNavigator';
import {ConnectionAlert, Loading, CreateModal, Update, MovingFileView} from './components';
import NavigationService from './actions/NavigationService';
import {getAppSettings} from './utils';
import configureStore from './store';

Sentry.init({
    dsn: 'https://3fcf3d773d8da9bf5d5a6d3eb66a7fbb@o4506009368199168.ingest.sentry.io/4506009458114560',
    tracesSampleRate: 0.5,
    environment: __DEV__ ? 'development' : 'production',
});

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
        'https://firebasestorage.googleapis.com/v0/b/stiiick-1545628981656.appspot.com/o/sticknet-icon.png?alt=media&token=2b665dae-a63d-4884-a92e-59d5899530dc',
    ],
    redirect: {
        native: `${bundleId}://`,
        universal: 'sticknet.org',
    },
};

const coinbase = coinbaseConnector({
    redirect: `${bundleId}://`,
});

const chains = [mainnet, polygon, arbitrum, optimism] as const;

const wagmiConfig = defaultWagmiConfig({chains, projectId, metadata, extraConnectors: [coinbase]});

// 3. Create modal
createAppKit({
    projectId,
    wagmiConfig,
    defaultChain: mainnet, // Optional
    enableAnalytics: true, // Optional - defaults to your Cloud configuration
});

class App extends Component {
    async componentDidMount() {
        Orientation.lockToPortrait();
        StatusBar.setHidden(false);
        StatusBar.setBarStyle('dark-content');
        Animatable.initializeRegistryWithDefinitions({
            iii: animations.iii,
            glow: animations.glow,
            circle: animations.circle,
            loadingRotation: animations.loadingRotation,
            loadingColor: animations.loadingColor,
        });
        // @ts-ignore
        Text.defaultProps = Text.defaultProps || {};
        // @ts-ignore
        Text.defaultProps.allowFontScaling = false; // TODO: check this
        // @ts-ignore
        TextInput.defaultProps = TextInput.defaultProps || {};
        // @ts-ignore
        TextInput.defaultProps.allowFontScaling = false;
        changeNavigationBarColor('#000000', false, true); // TODO: check this
        setTimeout(() => getAppSettings(), 2000);
    }

    render() {
        // LogBox.ignoreLogs(['Non-serializable values', 'BaseNavigationContainer', 'attempted to set', 'AutoFocus', 'new NativeEventEmitter()', 'EventEmitter.remove', 'Require cycle'])
        // LogBox.ignoreLogs(['Non-serializable values', 'BaseNavigationContainer', 'attempted to set', 'AutoFocus'])
        // LogBox.ignoreLogs([
        //     'Non-serializable values',
        //     'BaseNavigationContainer',
        //     'Require cycle',
        //     'NativeEventEmitter',
        //     'React state update',
        //     'ViewPropTypes',
        // ]);
        LogBox.ignoreAllLogs();
        const MyTheme = {
            ...DefaultTheme,
            colors: {
                ...DefaultTheme.colors,
                background: '#fff',
            },
        };
        const {persistor, store} = configureStore();
        return (
            <Provider store={store}>
                <PersistGate loading={null} persistor={persistor}>
                    <GestureHandlerRootView style={{flex: 1}}>
                        <WagmiProvider config={wagmiConfig}>
                            <QueryClientProvider client={queryClient}>
                                <NavigationContainer
                                    theme={MyTheme}
                                    ref={(navigatorRef) => NavigationService.setTopLevelNavigator(navigatorRef)}>
                                    <TabNavigator />
                                    <Loading />
                                    <Update />
                                    <CreateModal />
                                    <ConnectionAlert />
                                    <MovingFileView />
                                </NavigationContainer>
                                <AppKit />
                            </QueryClientProvider>
                        </WagmiProvider>
                    </GestureHandlerRootView>
                </PersistGate>
            </Provider>
        );
    }
}

export default App;
