import {NativeModule, requireNativeModule} from 'expo';

import {StickProtocolModuleEvents} from './StickProtocol.types';

declare class StickProtocolModule extends NativeModule<StickProtocolModuleEvents> {
    // Initialization & Database
    initialize(userId: string, password: string): Promise<any>;
    reInitialize(bundle: object, password: string, userId: string): Promise<boolean>;
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
    ): Promise<string | null>;

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
    decryptFileVault(filePath: string, cipher: string, size: number, outputPath: string): Promise<string | null>;
    encryptTextVault(text: string): Promise<string | null>;
    decryptTextVault(cipher: string): Promise<string>;

    // Listeners (iOS specific)
    registerPhotoLibraryListener(): void;
}

export default requireNativeModule<StickProtocolModule>('StickProtocol');
