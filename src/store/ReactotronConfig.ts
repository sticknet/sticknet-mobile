import Reactotron from 'reactotron-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {reactotronRedux} from 'reactotron-redux';

if (__DEV__) {
    // @ts-ignore
    Reactotron.setAsyncStorageHandler(AsyncStorage) // AsyncStorage would either come from `react-native` or `@react-native-community/async-storage` depending on where you get it from
        .configure({name: 'sticknet'}) // controls connection & communication settings
        .useReactNative() // add all built-in react native plugins
        .use(reactotronRedux())
        .connect(); // let's connect!
    // @ts-ignore
    Reactotron.clear();
}

export default Reactotron;
