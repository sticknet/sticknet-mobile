import MockAsyncStorage from 'mock-async-storage';
import * as ReactNative from 'react-native';
import {AccessibilityInfo, TextInput} from 'react-native';
import 'react-native-gesture-handler/jestSetup';
import mock from 'react-native-permissions/mock';

const mockImpl = new MockAsyncStorage();
jest.useFakeTimers();

jest.mock('@react-native-async-storage/async-storage', () => mockImpl);
// React Native
jest.doMock('react-native', () => {
    const {
        StyleSheet,
        PermissionsAndroid,
        ImagePickerManager,
        requireNativeComponent,
        Alert: RNAlert,
        InteractionManager: RNInteractionManager,
        NativeModules: RNNativeModules,
        Linking: RNLinking,
    } = ReactNative;

    const Alert = {
        ...RNAlert,
        alert: jest.fn(),
    };

    const InteractionManager = {
        ...RNInteractionManager,
        runAfterInteractions: jest.fn((cb) => cb()),
    };

    const NativeModules = {
        ...RNNativeModules,
        KeyboardTrackingViewTempManager: {},
        CommonNative: {
            cacheUri: jest.fn(),
            convertVideo: jest.fn(),
            mainURL: 'https://www.mockurl.org',
            generateUUID: () => {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    let r = (new Date().getTime() + Math.random() * 16) % 16 | 0;
                    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
                });
            },
            classifyImages: () => {
                return {
                    'blob_0': ['Cat', 'Pet'],
                    'blob_1': ['Mountain', 'Flower', 'Field'],
                };
            },
            classifyImage: () => Promise.resolve(['Bird']),
            generateSecureRandom: () => 'securely_random_string',
            hash: () => '!@#$%^',
            fetchSmartAlbums: () => jest.fn()
        },
        UIManager: {
            RCTView: {
                directEventTypes: {},
            },
        },
        PlatformConstants: {
            forceTouchAvailable: false,
        },
        KeyboardObserver: {},
        RNCNetInfo: {
            getCurrentState: jest.fn().mockResolvedValue({isConnected: true}),
            addListener: jest.fn(),
            removeListeners: jest.fn(),
            addEventListener: jest.fn(),
        },
        RNKeychainManager: {
            SECURITY_LEVEL_ANY: 'ANY',
            SECURITY_LEVEL_SECURE_SOFTWARE: 'SOFTWARE',
            SECURITY_LEVEL_SECURE_HARDWARE: 'HARDWARE',
        },
        StatusBarManager: {
            getHeight: jest.fn(),
        },
        RNPermissions: {},
        RNFBAnalyticsModule: {
            logEvent: jest.fn(),
        },
        RNFBAppModule: {
            NATIVE_FIREBASE_APPS: [
                {
                    appConfig: {
                        name: '[DEFAULT]',
                    },
                    options: {},
                },

                {
                    appConfig: {
                        name: 'secondaryFromNative',
                    },
                    options: {},
                },
            ],
            FIREBASE_RAW_JSON: '{}',
            addListener: jest.fn(),
            eventsAddListener: jest.fn(),
            eventsNotifyReady: jest.fn(),
            removeListeners: jest.fn(),
        },
        RNFBAuthModule: {
            APP_LANGUAGE: {
                '[DEFAULT]': 'en-US',
            },
            APP_USER: {
                '[DEFAULT]': 'jestUser',
            },
            addAuthStateListener: jest.fn(),
            addIdTokenListener: jest.fn(),
            useEmulator: jest.fn(),
        },
        RNFBCrashlyticsModule: {},
        RNFBDatabaseModule: {
            on: jest.fn(),
            off: jest.fn(),
            ref: jest.fn(),
            useEmulator: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            set: jest.fn(),
            child: jest.fn(),
        },
        RNFBFirestoreModule: {
            settings: jest.fn(),
            documentSet: jest.fn(),
        },
        RNFBMessagingModule: {
            onMessage: jest.fn(),
        },
        RNFBPerfModule: {},
        RNFBStorageModule: {
            useEmulator: jest.fn(),
        },
        RNFBDynamicLinksModule: {
            buildShortLink: () => Promise.resolve('link'),
        },
    };

    const Linking = {
        ...RNLinking,
        openURL: jest.fn().mockImplementation(() => Promise.resolve('')),
    };

    return Object.setPrototypeOf(
        {
            Platform: {
                // ...Platform,
                select: jest.fn(),
                OS: 'ios',
                Version: 11,
            },
            StyleSheet,
            PermissionsAndroid,
            ImagePickerManager,
            requireNativeComponent,
            Alert,
            InteractionManager,
            NativeModules,
            Linking,
        },
        ReactNative,
    );
});


// jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');


jest.mock('@react-navigation/native', () => ({
    ...jest.requireActual('@react-navigation/native'),
    useNavigation: () => ({getState: () => ({routeNames: []})}),
    useRoute: jest.fn(),
}));

let logs = [];
let warns = [];
let errors = [];
// beforeAll(() => {
//     console.originalLog = console.log;
//     console.log = jest.fn((...params) => {
//         console.originalLog(...params);
//         logs.push(params);
//     });
//
//     console.originalWarn = console.warn;
//     console.warn = jest.fn((...params) => {
//         console.originalWarn(...params);
//         warns.push(params);
//     });
//
//     console.originalError = console.error;
//     console.error = jest.fn((...params) => {
//         console.originalError(...params);
//         errors.push(params);
//     });
// });

beforeEach(() => {
    logs = [];
    warns = [];
    errors = [];
});

global.requestAnimationFrame = (callback) => {
    setTimeout(callback, 0);
};

jest.mock('react-native/Libraries/EventEmitter/NativeEventEmitter');

jest.mock('redux-persist', () => {
    const real = jest.requireActual('redux-persist');
    return {
        ...real,
        persistReducer: jest.fn().mockImplementation((config, reducers) => reducers),
    };
});

jest.mock('react-native-screens', () => ({
    // ...jest.requireActual('react-native-screens'),
    enableScreens: jest.fn(),
}));

jest.mock('@sticknet/react-native-vector-icons/Entypo', () => 'MockedEntypo');
jest.mock('@sticknet/react-native-vector-icons/EvilIcons', () => 'MockedEvilIcons');
jest.mock('@sticknet/react-native-vector-icons/FontAwesome', () => 'MockedFontAwesome');
jest.mock('@sticknet/react-native-vector-icons/FontAwesome5', () => 'MockedFontAwesome5');
jest.mock('@sticknet/react-native-vector-icons/FontAwesome6Pro', () => 'MockedFontAwesome6Pro');
jest.mock('@sticknet/react-native-vector-icons/Fontisto', () => 'MockedFontisto');
jest.mock('@sticknet/react-native-vector-icons/Feather', () => 'MockedFeather');
jest.mock('@sticknet/react-native-vector-icons/Ionicons', () => 'MockedIonicons');
jest.mock('@sticknet/react-native-vector-icons/AntDesign', () => 'MockedAntDesign');
jest.mock('@sticknet/react-native-vector-icons/MaterialIcons', () => 'MockedMaterialIcons');
jest.mock('@sticknet/react-native-vector-icons/SimpleLineIcons', () => 'MockedSimpleLineIcons');
jest.mock('@sticknet/react-native-vector-icons/MaterialCommunityIcons', () => 'MockedMaterialCommunityIcons');
jest.mock('@sticknet/react-native-vector-icons/Octicons', () => 'MockedOcticons');

jest.mock('react-native-fs', () => {
    return {
        mkdir: jest.fn(),
        moveFile: jest.fn(),
        copyFile: jest.fn(),
        pathForBundle: jest.fn(),
        pathForGroup: jest.fn(),
        getFSInfo: jest.fn(),
        getAllExternalFilesDirs: jest.fn(),
        unlink: jest.fn(),
        exists: jest.fn(),
        stopDownload: jest.fn(),
        resumeDownload: jest.fn(),
        isResumable: jest.fn(),
        stopUpload: jest.fn(),
        completeHandlerIOS: jest.fn(),
        readDir: jest.fn(),
        readDirAssets: jest.fn(),
        existsAssets: jest.fn(),
        readdir: jest.fn(),
        setReadable: jest.fn(),
        stat: jest.fn(),
        readFile: () => 'VyqjRDD/EPc=',
        read: jest.fn(),
        readFileAssets: jest.fn(),
        hash: jest.fn(),
        copyFileAssets: jest.fn(),
        copyAssetsFileIOS: jest.fn(),
        copyAssetsVideoIOS: jest.fn(),
        writeFile: jest.fn(),
        appendFile: jest.fn(),
        write: jest.fn(),
        downloadFile: jest.fn(),
        uploadFiles: jest.fn(),
        touch: jest.fn(),
        MainBundlePath: jest.fn(),
        CachesDirectoryPath: jest.fn(),
        DocumentDirectoryPath: jest.fn(),
        ExternalDirectoryPath: jest.fn(),
        ExternalStorageDirectoryPath: jest.fn(),
        TemporaryDirectoryPath: jest.fn(),
        LibraryDirectoryPath: jest.fn(),
        PicturesDirectoryPath: jest.fn(),
    };
});
jest.mock('react-native-blob-util', () => {
    return {
        DocumentDir: () => {
        },
        polyfill: () => {
        },
        fs: {
            unlink: jest.fn(),
            dirs: jest.fn(),
        },
        fetch: jest.fn(() => ({
            uploadProgress: jest.fn(() => Promise.resolve({
                respInfo: {status: 200},
                data: 'downloaded_uri',
            })),
        })),
        config: jest.fn(() => ({
            fetch: jest.fn(() => ({
                progress: jest.fn(() => Promise.resolve({
                    respInfo: {status: 200},
                    data: 'downloaded_uri',
                })),
            })),
        })),
        progress: () => {
        },
        wrap: jest.fn(),

    };
});

jest.mock('@sticknet/react-native-keychain', () => ({
    setGenericPassword: jest.fn(() => Promise.resolve('mockPass')),
    getGenericPassword: jest.fn(() => Promise.resolve('mockPass')),
    resetGenericPassword: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('react-native-device-info', () => {
    return {
        getVersion: () => 4,
        hasNotch: () => jest.fn(),
        getModel: () => jest.fn(),
        getDeviceName: () => 'iPhone 13 Pro',
        getUniqueId: () => 'unique_id',
        hasDynamicIsland: () => false,
        getBundleId: () => 'com.stiiick',
    };
});

jest.mock('react-native-ui-lib', () => ({
    default: jest.fn(),
}));

jest.doMock('react-native-ui-lib/keyboard', () => ({
    KeyboardAccessoryView: TextInput,
}));

jest.mock('react-native-ui-lib/lib/components/Keyboard', () => ({
    default: jest.fn(),
}));
// jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled').mockImplementation(() => new Promise.resolve(false));

jest.mock('react-navigation-collapsible/lib/src/utils', () => ({
    default: jest.fn(),
}));

jest.mock('react-navigation-collapsible', () => ({
    default: jest.fn(),
}));

jest.mock('react-native-share', () => ({
    default: jest.fn(),
}));

 
jest.spyOn(AccessibilityInfo, 'isScreenReaderEnabled').mockImplementation(() => new Promise.resolve(false));

// mock native modules
jest.mock('@react-native-community/netinfo', () => ({
    addEventListener: jest.fn(),
}));

jest.mock('react-native-push-notification', () => ({
    configure: jest.fn(),
    onRegister: jest.fn(),
    onNotification: jest.fn(),
    addEventListener: jest.fn(),
    requestPermissions: jest.fn(),
    getDeliveredNotifications: jest.fn(),
    removeDeliveredNotifications: jest.fn(),
    getApplicationIconBadgeNumber: jest.fn(),
    getChannels: jest.fn(),
    popInitialNotification: jest.fn(),
}));

jest.mock('@react-native-community/audio-toolkit', () => ({
    Recorder: () => ({
        prepare: jest.fn(),
        record: jest.fn(),
        stop: (callback) => callback(),
    }),
    Player: () => ({
        prepare: jest.fn(),
        pause: jest.fn(),
        play: jest.fn(),
        destroy: jest.fn(),
        seek: jest.fn(),
    }),
}));

jest.mock('react-native-permissions', () => {
    return mock;
});

jest.mock('stick-protocol-handlers', () => {
    return (sp) => ({
        StickProtocol: sp,
        getStickId: () => ({
            stickId: 'mock-stick-id',
            groupsIds: [require('../src/actions/test_data/state.json').auth.user.groupsIds[0]],
            connectionsIds: [],
        }),
        uploadSenderKeys: jest.fn(),
        checkPairwiseSession: jest.fn(),
        uploadPendingKey: jest.fn(),
        syncChain: jest.fn(),
        getActiveStickId: () => 'mock-stick-id',
        fetchStandardSenderKey: jest.fn(),
        checkStandardSessionKeys: jest.fn(),
        refreshSignedPreKey: jest.fn(),
        refreshIdentityKey: jest.fn(),
        refillPreKeys: jest.fn(),
        canDecrypt: () => true,
        setUp: jest.fn(),
        decryptProfile: jest.fn(),
        decryptGroups: jest.fn(),
        decryptGroupField: jest.fn(),
        decryptImagesData: jest.fn(),
        decryptAlbums: jest.fn(),
        decryptNotes: jest.fn(),
        decryptNotifications: jest.fn(),
        decryptInvitations: jest.fn(),
        parsePreKeys: () => Promise.resolve({firstPreKeysSet: [], secondPreKeysSet: []}),
    });
});

jest.mock('react-navigation-collapsible/lib/src/utils', () => ({
    getDefaultHeaderHeight: jest.fn(),
    getNavigationHeight: jest.fn(),
    getScrollIndicatorInsetTop: jest.fn(),
}));

jest.mock('@react-native-camera-roll/camera-roll', () => ({
    CameraRoll: jest.fn(),
}));

// jest.mock('./src/actions/SPHandlers.js', () => {
//     const sph = () => (sp) => sp;
//     Object.assign(sph, {
//         getStickId: jest.fn(),
//         canDecrypt: () => true,
//     });
//     return sph;
// });


jest.mock('@react-native-firebase/messaging', () => {
    return () => ({
        requestPermission: jest.fn(),
        hasPermission: jest.fn(),
        getToken: jest.fn(),
        onMessage: jest.fn(),
        onNotificationOpenedApp: jest.fn(),
    });
});

jest.mock('react-native-image-resizer', () => ({createResizedImage: jest.fn(() => Promise.resolve({uri: 'file://uri'}))}));

jest.mock('@react-native-firebase/database', () => {
    // Mock the firebase module
    const database = jest.fn(() => ({
        ref: jest.fn(() => ({
            on: jest.fn(),
            once: jest.fn(),
            set: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
        })),
    }));
    return {
        firebase: {
            app: jest.fn(() => ({
                database,
            })),
            auth: jest.fn(() => ({
                signInWithCustomToken: jest.fn(),
            })),
            database: {
                ServerValue: 1,
            },
        },
    };
});


jest.mock('react-native-iap', () => ({
    finishTransaction: jest.fn(),
    getSubscriptions: () => Promise.resolve([
            {productId: 'com.example.app.premium.1', localizedPrice: '$4.99', introductoryPriceNumberOfPeriodsIOS: '1'},
        ]),
    requestSubscription: () => Promise.resolve({productId: 'com.example.app.premium.1', offerToken: 'token', price: '$4.99', hasFreeTrial: true}),
}));
