import {NativeModule, requireNativeModule} from 'expo';

import {CommonNativeModuleEvents} from './CommonNative.types';

declare class CommonNativeModule extends NativeModule<CommonNativeModuleEvents> {
    // --- Constants ---
    mainURL: string;

    // --- Image Processing ---
    flipImage(uri: string): Promise<string>;
    rotateImage(uri: string, orientation: number): Promise<string>;
    getSizeAndResize(
        contentUri: string,
        type: string,
        mirror: boolean,
        resizeWidth: number,
        resizeHeight: number,
    ): Promise<{
        width: number;
        height: number;
        resizedUri?: string;
        fileSize?: string;
    }>;

    // --- Cryptography & Randomness ---
    generateSecureRandom(count: number): Promise<string | null>;
    generateUUID(): Promise<string>;
    hash(text: string): Promise<string>;
    hashArray(items: string[]): Promise<string[]>;
    encryptPassword(password: string): Promise<{
        passwordKey: string;
        ciphertext: string;
    }>;

    // --- Photos (iOS Specific) ---
    getPhotosCount(): Promise<number>;
    getPhotoByDate(creationDate: number): Promise<string>;
    fetchSmartAlbums(): Promise<any[]>;
    getSmartPhotos(args: {groupName: string; first: number; after?: string}): Promise<any>;

    // --- Google One Tap (Android Specific) ---
    oneTapSavePassword(
        username: string,
        password: string,
    ): Promise<{
        status: 'SUCCESS' | 'CANCELLED' | 'FAILED';
        error?: string;
    }>;
    oneTapRecoverPassword(
        userId: string,
        passwordKey: string,
    ): Promise<{
        password?: string;
        status: 'SUCCESS' | 'CANCELLED' | 'WRONG_ACCOUNT' | 'FAILED';
        error?: string;
    } | null>;

    // --- ML Kit Image Labeling (Android Specific) ---
    classifyImage(uriString: string): Promise<string[]>;
    classifyImages(uris: string[]): Promise<Record<string, string[]>>;

    // --- Media & File Management ---
    saveFile(path: string, type: 'photo' | 'video'): Promise<boolean>;
}

export default requireNativeModule<CommonNativeModule>('CommonNative');
