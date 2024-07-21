import {NativeModules, Platform} from 'react-native';
import StickInit from './StickInit';

const StickProtocolManager = Platform.OS === 'ios' ? NativeModules.StickProtocolModule : NativeModules.StickProtocol;

const StickProtocol = {
    initialize(userId: string, password: string): Promise<any> {
        return Platform.OS === 'android'
            ? StickProtocolManager.initialize(userId, password)
            : StickInit.initialize(userId, password);
    },
    reInitialize(bundle: object, password: string, userId: string): Promise<any> {
        return Platform.OS === 'android'
            ? StickProtocolManager.reInitialize(bundle, password, userId)
            : StickInit.reInitialize(bundle, password, userId);
    },
    reEncryptKeys(password: string): Promise<any> {
        return Platform.OS === 'android'
            ? StickProtocolManager.reEncryptKeys(password)
            : StickInit.reEncryptKeys(password);
    },
    decryptPreKeys(preKeys: object[]): Promise<any> {
        return StickProtocolManager.decryptPreKeys(preKeys);
    },
    decryptDSKs(DSKs: object[]): Promise<any> {
        return StickProtocolManager.decryptDSKs(DSKs);
    },
    generatePreKeys(nextPreKeyId: number, count: number): Promise<any> {
        return StickProtocolManager.generatePreKeys(nextPreKeyId, count);
    },
    initPairwiseSession(bundle: object): Promise<any> {
        return StickProtocolManager.initPairwiseSession(bundle);
    },
    encryptTextPairwise(userId: string, text: string): Promise<any> | null {
        if (!userId || !text) return null;
        return StickProtocolManager.encryptTextPairwise(userId, text);
    },
    decryptTextPairwise(senderId: string, cipher: string): Promise<any> | null {
        if (!senderId || !cipher) return null;
        return StickProtocolManager.decryptTextPairwise(senderId, cipher);
    },
    decryptFilePairwise(
        senderId: string,
        filePath: string,
        secret: string,
        size: string,
        outputPath: string,
    ): Promise<any> | null {
        if (!senderId || !filePath || !secret) return null;
        return StickProtocolManager.decryptFilePairwise(senderId, filePath, secret, parseInt(size, 10), outputPath);
    },
    encryptFilePairwise(filePath: string, userId: string): Promise<any> | null {
        if (!filePath || !userId) return null;
        return StickProtocolManager.encryptFilePairwise(filePath, userId);
    },
    encryptText(senderId: string, stickId: string, text: string, isSticky = true): Promise<any> | null {
        if (!senderId || !stickId || !text) return null;
        return StickProtocolManager.encryptText(senderId, stickId, text, isSticky);
    },
    decryptText(senderId: string, stickId: string, cipher: string, isSticky = true): Promise<any> | null {
        if (!senderId || !stickId || !cipher) return null;
        return StickProtocolManager.decryptText(senderId, stickId, cipher, isSticky);
    },
    encryptFile(senderId: string, stickId: string, filePath: string, isSticky = true, type = ''): Promise<any> | null {
        if (!senderId || !stickId || !filePath) return null;
        return StickProtocolManager.encryptFile(senderId, stickId, filePath, isSticky, type);
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
        return StickProtocolManager.decryptFile(
            senderId,
            stickId,
            filePath,
            secret,
            parseInt(size, 10),
            outputPath,
            isSticky,
        );
    },
    getSenderKey(senderId: string, roomId: string, stickId: string, isSticky = true): Promise<any> {
        return StickProtocolManager.getSenderKey(senderId, roomId, stickId, isSticky);
    },
    createStickySession(userId: string, stickId: string): Promise<any> {
        return StickProtocolManager.createStickySession(userId, stickId);
    },
    sessionExists(senderId: string, stickId: string): boolean {
        if ((!senderId || !stickId) && !__DEV__) return true;
        return StickProtocolManager.sessionExists(senderId, stickId);
    },
    pairwiseSessionExists(oneTimeId: string): boolean {
        return StickProtocolManager.pairwiseSessionExists(oneTimeId);
    },
    initStickySession(
        senderId: string,
        stickId: string,
        cipherSenderKey: string,
        identityKeyId: number,
    ): Promise<any> | null {
        if ((!senderId || !stickId || !cipherSenderKey) && !__DEV__) return null;
        return StickProtocolManager.initStickySession(senderId, stickId, cipherSenderKey, identityKeyId);
    },
    initStandardGroupSession(senderId: string, stickId: string, cipherSenderKey: string): Promise<any> | null {
        if ((!senderId || !stickId || !cipherSenderKey) && !__DEV__) return null;
        return StickProtocolManager.initStandardGroupSession(senderId, stickId, cipherSenderKey);
    },
    reinitMyStickySession(userId: string, senderKey: object): Promise<any> | null {
        if (!userId || !senderKey) return null;
        return StickProtocolManager.reinitMyStickySession(userId, senderKey);
    },
    checkRegistration(): Promise<any> {
        return StickProtocolManager.checkRegistration();
    },
    resetDatabase(): Promise<any> {
        return StickProtocolManager.resetDatabase();
    },
    getChainStep(userId: string, stickId: string): Promise<any> {
        return StickProtocolManager.getChainStep(userId, stickId);
    },
    ratchetChain(userId: string, stickId: string, steps: number): Promise<any> {
        return StickProtocolManager.ratchetChain(userId, stickId, steps);
    },
    refreshSignedPreKey(): Promise<any> {
        return StickProtocolManager.refreshSignedPreKey();
    },
    refreshIdentityKey(): Promise<any> {
        return StickProtocolManager.refreshIdentityKey();
    },
    createPasswordHash(password: string, salt: string): Promise<any> {
        return StickProtocolManager.createPasswordHash(password, salt);
    },
    createNewPasswordHash(password: string): Promise<any> {
        return StickProtocolManager.createNewPasswordHash(password);
    },
    recoverPassword(userId: string): Promise<any> {
        return StickProtocolManager.recoverPassword(userId);
    },
    encryptFileVault(filePath: string, type: string): Promise<any> {
        return StickProtocolManager.encryptFileVault(filePath, type);
    },
    decryptFileVault(filePath: string, cipher: string, size: string, outputPath: string): Promise<any> {
        return StickProtocolManager.decryptFileVault(filePath, cipher, parseInt(size, 10), outputPath);
    },
    encryptTextVault(text: string): Promise<any> {
        return StickProtocolManager.encryptTextVault(text);
    },
    decryptTextVault(cipher: string): Promise<any> {
        return StickProtocolManager.decryptTextVault(cipher);
    },
    reEncryptCiphers(ciphers: object, currentPass: string, newPass: string): Promise<any> {
        return Platform.OS === 'android'
            ? StickProtocolManager.reEncryptCiphers(ciphers, currentPass, newPass)
            : StickInit.reEncryptCiphers(ciphers, currentPass, newPass);
    },
    updateKeychainPassword(password: string): Promise<any> {
        return StickProtocolManager.updateKeychainPassword(password);
    },
};

export default StickProtocol;
