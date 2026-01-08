import {registerWebModule, NativeModule} from 'expo';

import {ChangeEventPayload} from './StickProtocol.types';

type StickProtocolModuleEvents = {
    onChange: (params: ChangeEventPayload) => void;
};

class StickProtocolModule extends NativeModule<StickProtocolModuleEvents> {
    PI = Math.PI;
    async setValueAsync(value: string): Promise<void> {
        this.emit('onChange', {value});
    }
    hello() {
        return 'Hello world! 👋';
    }
}

export default registerWebModule(StickProtocolModule, 'StickProtocolModule');
