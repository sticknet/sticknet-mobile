import {NativeModules, Platform} from 'react-native';
import FileSystem from 'react-native-fs';
import BlobUtil from 'react-native-blob-util';
import ImageResizer from 'react-native-image-resizer';

const CommonNativeManager = NativeModules.CommonNative;

const CommonNative = {
    classifyImage(uri: string): Promise<any> {
        return CommonNativeManager.classifyImage(uri);
    },
    classifyImages(uris: string[]): Promise<any> {
        return CommonNativeManager.classifyImages(uris);
    },
    flipImage(uri: string): Promise<any> {
        return CommonNativeManager.flipImage(uri);
    },
    rotateImage(uri: string, orientation: number): Promise<any> {
        return CommonNativeManager.rotateImage(uri, orientation);
    },
    oneTapSavePassword(username: string, password: string): Promise<any> {
        return CommonNativeManager.oneTapSavePassword(username, password);
    },
    oneTapRecoverPassword(userId: string, passwordKey: string): Promise<any> {
        return CommonNativeManager.oneTapRecoverPassword(userId, passwordKey);
    },
    blockStoreSavePassword(key: string): Promise<any> {
        return CommonNativeManager.blockStoreSavePassword(key);
    },
    blockStoreRecoverPassword(key: string): Promise<any> {
        return CommonNativeManager.blockStoreRecoverPassword(key);
    },
    encryptPassword(password: string): Promise<any> {
        return CommonNativeManager.encryptPassword(password);
    },
    getSizeAndResize(
        path: string,
        type: string,
        mirror = false,
        resizeWidth = 2500,
        resizeHeight = 2500,
    ): Promise<any> {
        return CommonNativeManager.getSizeAndResize(path, type, mirror, resizeWidth, resizeHeight);
    },
    saveFile(path: string, type: string): Promise<any> {
        return CommonNativeManager.saveFile(path, type);
    },
    generateSecureRandom(count: number): Promise<any> {
        return CommonNativeManager.generateSecureRandom(count);
    },
    raiseTestNativeError(): Promise<any> {
        return CommonNativeManager.raiseTestNativeError();
    },
    generateUUID(): Promise<string> {
        return CommonNativeManager.generateUUID();
    },
    hashArray(items: any[]): Promise<any> {
        return CommonNativeManager.hashArray(items);
    },
    hash(text: string): Promise<any> {
        return CommonNativeManager.hash(text);
    },
    getPhotosCount(): Promise<number> {
        return CommonNativeManager.getPhotosCount();
    },
    fetchSmartAlbums(): Promise<any> {
        return CommonNativeManager.fetchSmartAlbums();
    },
    getSmartPhotos(args: any): Promise<any> {
        return CommonNativeManager.getSmartPhotos(args);
    },
    readNativeDB(key: string): Promise<any> {
        return CommonNativeManager.readNativeDB(key);
    },
    removeItemNativeDB(key: string): Promise<any> {
        return CommonNativeManager.removeItemNativeDB(key);
    },
    convertVideo(params: any): Promise<any> {
        return CommonNativeManager.convertVideo(params);
    },
    async cacheUri(id: string, uri: string): Promise<any | null> {
        if ((!id || !uri) && !__DEV__) return null;
        let fileUri;

        const uid = await CommonNativeManager.generateUUID();
        const outputPath = `${CommonNativeManager.groupDirectoryPath}/${uid}.jpg`;
        if (uri.startsWith('ph://')) {
            fileUri = await FileSystem.copyAssetsFileIOS(uri, outputPath, 200, 200);
        } else if (Platform.OS === 'ios') {
            fileUri = uri;
            const x = await ImageResizer.createResizedImage(uri.slice(7), 200, 200, 'JPEG', 0.5);
            await FileSystem.copyFile(x.uri, outputPath);
            fileUri = outputPath;
        } else fileUri = uri;

        if (Platform.OS === 'ios' && fileUri.startsWith('file://')) fileUri = fileUri.slice(7);
        return CommonNativeManager.cacheUri(id, fileUri);
    },
    cacheDirectoryPath: Platform.OS === 'ios' ? CommonNativeManager.groupDirectoryPath : BlobUtil.fs.dirs.DocumentDir,
    mainURL: CommonNativeManager.mainURL,
};

export default CommonNative;
