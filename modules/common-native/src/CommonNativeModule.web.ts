import {registerWebModule, NativeModule} from 'expo';

import {ChangeEventPayload} from './CommonNative.types';

type CommonNativeModuleEvents = {
    onChange: (params: ChangeEventPayload) => void;
};

class CommonNativeModule extends NativeModule<CommonNativeModuleEvents> {
    PI = Math.PI;
    async setValueAsync(value: string): Promise<void> {
        this.emit('onChange', {value});
    }
    hello() {
        return 'Hello world! 👋';
    }
}

export default registerWebModule(CommonNativeModule, 'CommonNativeModule');
