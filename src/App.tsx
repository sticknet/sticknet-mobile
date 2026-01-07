import React, {Component} from 'react';
import {LogBox, StatusBar, Text, TextInput} from 'react-native';
import * as Animatable from 'react-native-animatable';
import Orientation from 'react-native-orientation-locker';
import {Provider} from 'react-redux';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import * as Sentry from '@sentry/react-native';
import {DefaultTheme, NavigationContainer} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';

import animations from './utils/animations';
import TabNavigator from './navigators/TabNavigator';
import {ConnectionAlert, CreateModal, Loading, MovingFileView, Update} from './components';
import NavigationService from './actions/NavigationService';
import configureStore from './store';
import AppKitProvider from '@/src/wallet/AppKitProvider';

Sentry.init({
    dsn: 'https://3fcf3d773d8da9bf5d5a6d3eb66a7fbb@o4506009368199168.ingest.sentry.io/4506009458114560',
    tracesSampleRate: 0.5,
    environment: __DEV__ ? 'development' : 'production',
});

type State = {
    store: any | null;
};

class App extends Component<{}, State> {
    state: State = {
        store: null,
    };

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

        // Disable font scaling
        // @ts-ignore
        Text.defaultProps = Text.defaultProps || {};
        // @ts-ignore
        Text.defaultProps.allowFontScaling = false;
        // @ts-ignore
        TextInput.defaultProps = TextInput.defaultProps || {};
        // @ts-ignore
        TextInput.defaultProps.allowFontScaling = false;

        changeNavigationBarColor('#000000', false, true);

        const { store } = await configureStore();
        this.setState({ store });
    }

    render() {
        const { store } = this.state;
        if (!store) {
            return null;
        }
        LogBox.ignoreAllLogs(true);
        const MyTheme = {
            ...DefaultTheme,
            colors: {
                ...DefaultTheme.colors,
                background: '#fff',
            },
        };
        return (
            <AppKitProvider>
                <Provider store={store}>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                        <NavigationContainer
                            theme={MyTheme}
                            ref={(navigatorRef) =>
                                NavigationService.setTopLevelNavigator(navigatorRef)
                            }
                        >
                            <TabNavigator />
                            <Loading />
                            <Update />
                            <CreateModal />
                            <ConnectionAlert />
                            <MovingFileView />
                        </NavigationContainer>
                    </GestureHandlerRootView>
                </Provider>
            </AppKitProvider>
        );
    }
}

export default App;
