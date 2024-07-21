import {NativeModules} from 'react-native';

const StickInitManager = NativeModules.StickInit;

const StickInit = {
    initialize(userId: string, password: string) {
        return StickInitManager.initialize(userId, password);
    },
    reInitialize(bundle: object, password: string, userId: string) {
        return StickInitManager.reInitialize(bundle, password, userId);
    },
    reEncryptKeys(password: string) {
        return StickInitManager.reEncryptKeys(password);
    },
    registerPhotoLibraryListener() {
        // this method not part of the Stick protocol, but adding it here for `EventEmitter`
        return StickInitManager.registerPhotoLibraryListener();
    },
    reEncryptCiphers(ciphers: object, currentPass: string, newPass: string) {
        return StickInitManager.reEncryptCiphers(ciphers, currentPass, newPass);
    },
};

export default StickInit;
