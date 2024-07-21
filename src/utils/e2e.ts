import BlobUtil from 'react-native-blob-util';
import CommonNative from '../native-modules/common-native';

// eslint-disable-next-line
export const saveTestingPhotos = async (callback: () => void): Promise<void> => {
    const outputPath = `${CommonNative.cacheDirectoryPath}/test_0.jpg`;
    await BlobUtil.config({
        fileCache: true,
        appendExt: 'jpg',
        path: outputPath,
    }).fetch(
        'GET',
        'https://firebasestorage.googleapis.com/v0/b/stiiick-1545628981656.appspot.com/o/purple-min.jpeg?alt=media&token=43d63937-d42e-46c3-8cb8-53e41feff3f3',
        {},
    );
    await CommonNative.saveFile(outputPath, 'photo');
    await callback();
};
