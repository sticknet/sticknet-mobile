import React, {Component} from 'react';
import {LogBox, StatusBar, Text, TextInput} from 'react-native';
import * as Animatable from 'react-native-animatable';
import Orientation from 'react-native-orientation-locker';
import {Provider} from 'react-redux';
import {PersistGate} from 'redux-persist/integration/react';
import changeNavigationBarColor from 'react-native-navigation-bar-color';

import {DefaultTheme, NavigationContainer} from '@react-navigation/native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import animations from './utils/animations';
import TabNavigator from './navigators/TabNavigator';
import {ConnectionAlert, Loading, CreateModal, Update, MovingFileView} from './components';
import NavigationService from './actions/NavigationService';
import {getAppSettings} from './utils';
import configureStore from './store';

// Sentry.init({
//     dsn: 'https://3fcf3d773d8da9bf5d5a6d3eb66a7fbb@o4506009368199168.ingest.sentry.io/4506009458114560',
//     tracesSampleRate: 0.5,
//     environment: __DEV__ ? 'development' : 'production',
// });

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
                    </GestureHandlerRootView>
                </PersistGate>
            </Provider>
        );
    }
}

export default App;
