import {NativeModule, requireNativeModule} from 'expo';
import {StickProtocolModuleEvents} from './StickProtocol.types';

declare class NativeStickProtocolModule extends NativeModule<StickProtocolModuleEvents> {
    // Initialization & Database
    initialize(userId: string, password: string): Promise<any>;
    reInitialize(bundle: object, password: string, userId: string): Promise<any>;
    resetDatabase(): Promise<void>;
    checkRegistration(): Promise<boolean>;

    // Re-Encryption
    reEncryptKeys(password: string): Promise<any>;
    reEncryptCiphers(ciphers: object, currentPass: string, newPass: string): Promise<any>;

    // Pre-Keys & DSKs
    generatePreKeys(nextPreKeyId: number, count: number): Promise<any[]>;
    decryptPreKeys(preKeys: object[]): Promise<boolean>;
    decryptDSKs(DSKs: object[]): Promise<boolean>;

    // Pairwise Sessions
    initPairwiseSession(bundle: object): Promise<void>;
    pairwiseSessionExists(oneTimeId: string): Promise<boolean>;
    encryptTextPairwise(userId: string, text: string): Promise<string | null>;
    decryptTextPairwise(oneTimeId: string, cipher: string): Promise<string | null>;
    encryptFilePairwise(userId: string, filePath: string): Promise<any>;
    decryptFilePairwise(
        senderId: string,
        filePath: string,
        cipher: string,
        size: number,
        outputPath: string,
    ): Promise<string | null>;

    // Sticky Sessions
    createStickySession(userId: string, stickId: string): Promise<any | null>;
    initStickySession(senderId: string, stickId: string, cipherSenderKey: string, identityKeyId: number): Promise<void>;
    initStandardGroupSession(senderId: string, chatId: string, cipherSenderKey: string): Promise<void>;
    sessionExists(senderId: string, stickId: string): Promise<boolean>;
    getSenderKey(senderId: string, targetId: string, stickId: string, isSticky: boolean): Promise<string | null>;
    reinitMyStickySession(userId: string, senderKey: object): Promise<boolean>;
    getChainStep(userId: string, stickId: string): Promise<number>;
    ratchetChain(userId: string, stickId: string, steps: number): Promise<boolean>;

    // Encryption / Decryption - Text
    encryptText(senderId: string, stickId: string, text: string, isSticky: boolean): Promise<string | null>;
    decryptText(senderId: string, stickId: string, cipher: string, isSticky: boolean): Promise<string | null>;

    // Encryption / Decryption - Files
    encryptFile(senderId: string, stickId: string, filePath: string, isSticky: boolean, type: string): Promise<any>;
    decryptFile(
        senderId: string,
        stickId: string,
        filePath: string,
        cipher: string,
        size: number,
        outputPath: string,
        isSticky: boolean,
    ): Promise<any>;

    // Key Management
    refreshSignedPreKey(): Promise<any | null>;
    refreshIdentityKey(): Promise<any | null>;

    // Password Management
    createPasswordHash(password: string, salt: string): Promise<string>;
    createNewPasswordHash(password: string): Promise<any>;
    recoverPassword(userId: string): Promise<string | null>;
    updateKeychainPassword(password: string): Promise<void>;

    // Vault Encryption / Decryption
    encryptFileVault(filePath: string, type: string): Promise<any>;
    decryptFileVault(filePath: string, cipher: string, size: number, outputPath: string): Promise<any>;
    encryptTextVault(text: string): Promise<string | null>;
    decryptTextVault(cipher: string): Promise<string>;

    // Listeners (iOS specific)
    registerPhotoLibraryListener(): void;
}

const nativeModule = requireNativeModule<NativeStickProtocolModule>('StickProtocol');

const StickProtocolModule = {
    // Initialization & Database
    initialize: nativeModule.initialize.bind(nativeModule),
    reInitialize: nativeModule.reInitialize.bind(nativeModule),
    resetDatabase: nativeModule.resetDatabase.bind(nativeModule),
    checkRegistration: nativeModule.checkRegistration.bind(nativeModule),

    // Re-Encryption
    reEncryptKeys: nativeModule.reEncryptKeys.bind(nativeModule),
    reEncryptCiphers: nativeModule.reEncryptCiphers.bind(nativeModule),

    // Pre-Keys & DSKs
    generatePreKeys: nativeModule.generatePreKeys.bind(nativeModule),
    decryptPreKeys: nativeModule.decryptPreKeys.bind(nativeModule),
    decryptDSKs: nativeModule.decryptDSKs.bind(nativeModule),

    // Pairwise Sessions
    initPairwiseSession: nativeModule.initPairwiseSession.bind(nativeModule),
    pairwiseSessionExists: nativeModule.pairwiseSessionExists.bind(nativeModule),

    encryptTextPairwise(userId: string, text: string): Promise<string | null> | null {
        if (!userId || !text) return null;
        return nativeModule.encryptTextPairwise(userId, text);
    },

    decryptTextPairwise(senderId: string, cipher: string): Promise<string | null> | null {
        if (!senderId || !cipher) return null;
        return nativeModule.decryptTextPairwise(senderId, cipher);
    },

    encryptFilePairwise(filePath: string, userId: string): Promise<any> | null {
        if (!filePath || !userId) return null;
        return nativeModule.encryptFilePairwise(userId, filePath);
    },

    decryptFilePairwise(
        senderId: string,
        filePath: string,
        secret: string,
        size: string,
        outputPath: string,
    ): Promise<string | null> | null {
        if (!senderId || !filePath || !secret) return null;
        return nativeModule.decryptFilePairwise(senderId, filePath, secret, parseInt(size, 10), outputPath);
    },

    // Sticky Sessions
    createStickySession: nativeModule.createStickySession.bind(nativeModule),

    sessionExists(senderId: string, stickId: string): boolean | Promise<boolean> {
        if ((!senderId || !stickId) && !__DEV__) return true;
        return nativeModule.sessionExists(senderId, stickId);
    },

    getSenderKey: nativeModule.getSenderKey.bind(nativeModule),

    initStickySession(
        senderId: string,
        stickId: string,
        cipherSenderKey: string,
        identityKeyId: number,
    ): Promise<void> | null {
        if ((!senderId || !stickId || !cipherSenderKey) && !__DEV__) return null;
        return nativeModule.initStickySession(senderId, stickId, cipherSenderKey, identityKeyId);
    },

    initStandardGroupSession(senderId: string, chatId: string, cipherSenderKey: string): Promise<void> | null {
        if ((!senderId || !chatId || !cipherSenderKey) && !__DEV__) return null;
        return nativeModule.initStandardGroupSession(senderId, chatId, cipherSenderKey);
    },

    reinitMyStickySession(userId: string, senderKey: object): Promise<boolean> | null {
        if (!userId || !senderKey) return null;
        return nativeModule.reinitMyStickySession(userId, senderKey);
    },

    getChainStep: nativeModule.getChainStep.bind(nativeModule),
    ratchetChain: nativeModule.ratchetChain.bind(nativeModule),

    // Encryption / Decryption - Text
    encryptText(senderId: string, stickId: string, text: string, isSticky = true): Promise<string | null> | null {
        if (!senderId || !stickId || !text) return null;
        return nativeModule.encryptText(senderId, stickId, text, isSticky);
    },

    decryptText(senderId: string, stickId: string, cipher: string, isSticky = true): Promise<string | null> | null {
        if (!senderId || !stickId || !cipher) return null;
        return nativeModule.decryptText(senderId, stickId, cipher, isSticky);
    },

    // Encryption / Decryption - Files
    encryptFile(senderId: string, stickId: string, filePath: string, isSticky = true, type = ''): Promise<any> | null {
        if (!senderId || !stickId || !filePath) return null;
        return nativeModule.encryptFile(senderId, stickId, filePath, isSticky, type);
    },

    decryptFile(
        senderId: string,
        stickId: string,
        filePath: string,
        secret: string,
        size: string,
        outputPath: string,
        isSticky = true,
    ): Promise<any> | null {
        if (!senderId || !stickId || !filePath || !secret) return null;
        return nativeModule.decryptFile(senderId, stickId, filePath, secret, parseInt(size, 10), outputPath, isSticky);
    },

    // Key Management
    refreshSignedPreKey: nativeModule.refreshSignedPreKey.bind(nativeModule),
    refreshIdentityKey: nativeModule.refreshIdentityKey.bind(nativeModule),

    // Password Management
    createPasswordHash: nativeModule.createPasswordHash.bind(nativeModule),
    createNewPasswordHash: nativeModule.createNewPasswordHash.bind(nativeModule),
    recoverPassword: nativeModule.recoverPassword.bind(nativeModule),
    updateKeychainPassword: nativeModule.updateKeychainPassword.bind(nativeModule),

    // Vault Encryption / Decryption
    encryptFileVault: nativeModule.encryptFileVault.bind(nativeModule),

    decryptFileVault(filePath: string, cipher: string, size: string, outputPath: string): Promise<any> {
        return nativeModule.decryptFileVault(filePath, cipher, parseInt(size, 10), outputPath);
    },

    encryptTextVault: nativeModule.encryptTextVault.bind(nativeModule),
    decryptTextVault: nativeModule.decryptTextVault.bind(nativeModule),

    // Listeners (iOS specific)
    registerPhotoLibraryListener: nativeModule.registerPhotoLibraryListener?.bind(nativeModule),

    // Event methods
    addListener: nativeModule.addListener?.bind(nativeModule),
    removeListeners: nativeModule.removeListeners?.bind(nativeModule),
};

export default StickProtocolModule;
