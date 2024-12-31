import {Alert, Linking, Platform} from 'react-native';
import {CameraRoll, GroupTypes} from '@react-native-camera-roll/camera-roll';
import FileSystem from 'react-native-fs';
import DeviceInfo from 'react-native-device-info';
import Keychain from '@sticknet/react-native-keychain';
import Rate, {AndroidMarket} from 'react-native-rate';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Share from 'react-native-share';
import {NavigationProp} from '@react-navigation/native';
import axios from '../../actions/myaxios';
import {URL} from '../../actions/URL';
import CommonNative from '../../native-modules/common-native';
import {globalData} from '../../actions/globalVariables';
import {TChatStorage, TUser, TFile, TGroup, TMessage, IAlbum, TAlbumItem} from '../../types';
import {IChatsStoragesState} from '../../reducers/stick-room/chatsStorages';

const bundleId = DeviceInfo.getBundleId();

export const nEveryRow = (data: any[], n: number) => {
    const result: any[][] = [];
    let temp: any[] = [];
    for (let i = 0; i < data.length; ++i) {
        if (i > 0 && i % n === 0) {
            result.push(temp);
            temp = [];
        }
        temp.push(data[i]);
    }
    if (temp.length > 0) {
        while (temp.length !== n) {
            temp.push(null);
        }
        result.push(temp);
    }
    return result;
};

export const createBlobsIds = (imagesIds: string[], images: Record<string, any>) => {
    if (imagesIds.length === 0) return [];
    const allIds: {imageId: string; blobIndex: number}[] = [];
    imagesIds.forEach((imageId) => {
        const image = images[imageId];
        if (image) {
            image.blobs.forEach((blob: any, blobIndex: number) => {
                allIds.push({imageId, blobIndex});
            });
        }
    });
    return allIds;
};

export const createFavoritesIds = (favoritesIds: string[], images: Record<string, any>) => {
    const arr: {imageId: string; blobIndex: number}[] = [];
    favoritesIds.forEach((item) => {
        const ids = item.split('-');
        const image = images[ids[0]];
        if (image) {
            for (let i = 0; i < image.blobs.length; i++) {
                if (image.blobs[i].id.toString() === ids[1]) {
                    arr.push({imageId: image.id, blobIndex: i});
                    break;
                }
            }
        }
    });
    return arr;
};

export const createCategoriesBlobsIds = (
    imagesIds: Record<string, any>,
    images: Record<string, any>,
    hidden: string[] = [],
) => {
    const entries = Object.entries(imagesIds);
    const arr: {imageId: string; blobId: string}[] = [];
    entries.forEach(([key, blobIds]) => {
        if (images[key] && !hidden.includes(images[key].id)) {
            blobIds.forEach((blobId: string) => {
                arr.push({imageId: key, blobId});
            });
        }
    });
    return arr;
};

export const arrayUnique = (a: any[]) => {
    for (let i = 0; i < a.length; ++i) {
        for (let j = i + 1; j < a.length; ++j) {
            if (a[i] === a[j]) a.splice(j--, 1);
        }
    }
    return a;
};

export const hashCode = (id: string) => {
    let hash = 0;
    if (id) {
        for (let i = 0; i < id.length; i++) {
            const character = id.charCodeAt(i);
            hash = (hash << 5) - hash + character;
            hash &= hash; // Convert to 32bit integer
        }
    }
    return hash;
};

export const getParameterByName = (name: string, url: string) => {
    name = name.replace(/[[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`);
    const results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2]);
};

export const saveToGallery = async (
    uri: string,
    image: {type: string; name: string; width: number; height: number},
    callback: (message: string) => void,
) => {
    const type = image.type.startsWith('image') ? 'photo' : 'video';
    const album = type === 'photo' ? 'Sticknet Photos' : 'Sticknet Videos';
    const noun = type === 'photo' ? 'Photo' : 'Video';
    if (Platform.OS === 'ios') {
        const isAssetsLibrary = uri.startsWith('ph://');
        if (isAssetsLibrary) {
            await setTimeout(async () => {
                const outputPath = `${CommonNative.cacheDirectoryPath}/${image.name}`;
                uri = await FileSystem.copyAssetsFileIOS(uri, outputPath, image.width, image.height);
                await CameraRoll.save(uri, {type, album});
                FileSystem.unlink(uri);
            }, 300);
        } else {
            await CameraRoll.save(uri, {type, album});
        }
    } else {
        if (uri.startsWith('content://')) {
            Alert.alert(`${noun} already in gallery!`);
            return;
        }
        if (uri.startsWith('file://')) uri = uri.slice(7);
        await CommonNative.saveFile(uri, type);
    }
    callback(`${noun} saved!`);
};

export const saveToGalleryMultiple = async (
    image: any,
    isItemAction: boolean,
    viewableItem: any,
    photosCache: Record<string, any>,
    videosCache: Record<string, any>,
    callback: () => void,
) => {
    let blobsIds: {id: string}[] = [];
    if (isItemAction) {
        blobsIds.push({id: viewableItem || image.blobs[0].id});
    } else {
        blobsIds = image.blobs;
    }
    blobsIds.forEach((item, index) => {
        let uri: string | null = null;
        if (photosCache[item.id]) uri = photosCache[item.id].uri;
        else if (videosCache[item.id]) uri = videosCache[item.id].uri;
        const done = index === blobsIds.length - 1 ? callback : () => {};
        if (uri) saveToGallery(uri, image, done);
    });
};

export const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.round(seconds % 60);
    return `${min}:${sec < 10 ? `0${sec}` : sec}`;
};

export const parseNumber = (dialCode: string, number: string) => {
    if (!dialCode || !number) return '';
    return `${dialCode} ${number.slice(-(number.length - dialCode.length), -7)} ${number.slice(-7, -4)} ${number.slice(
        -4,
    )}`;
};

export const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
];

export const timeSince = (timestamp: string) => {
    if (process.env.LOCAL_TEST) return 'just now';
    const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
    let interval = seconds / 31536000;

    if (interval >= 1) {
        const value = Math.floor(interval);
        return `${value} yr${value > 1 ? 's' : ''}`;
    }
    interval = seconds / 2592000;
    if (interval >= 1) {
        return `${Math.floor(interval)} mon`;
    }
    interval = seconds / 86400;
    if (interval >= 1) {
        const value = Math.floor(interval);
        return `${value} day${value > 1 ? 's' : ''}`;
    }
    interval = seconds / 3600;
    if (interval >= 1) {
        const value = Math.floor(interval);
        return `${value}h`;
    }
    interval = seconds / 60;
    if (interval >= 1) {
        return `${Math.floor(interval)}m`;
    }
    if (Math.floor(seconds) < 1) return 'just now';
    return `${Math.floor(seconds)}s`;
};

export const parseBirthDay = (date: string) => {
    if (!date) return '';
    const parts = date.split('-');
    return `${parts[0]} ${monthNames[parseInt(parts[1], 10) - 1]}`;
};

export const getGalleryAlbums = async () => {
    let albums: IAlbum[] = await CameraRoll.getAlbums();
    if (Platform.OS === 'ios') {
        const smartAlbums = await CommonNative.fetchSmartAlbums();
        albums = albums.concat(smartAlbums);
    } else {
        albums.unshift({title: 'Recents', recents: true, count: 100});
    }
    return albums;
};

export const dispatchAlbums = async (props: any) => {
    props.dispatchReadingCameraAlbums();
    const albums = await getGalleryAlbums();
    const main: TAlbumItem[] = [{sectionTitle: 'main'}];
    const myAlbums: TAlbumItem[] = [{sectionTitle: 'My Albums'}];
    const mediaTypes: TAlbumItem[] = [{sectionTitle: 'Media Types'}];
    let coversDone = 0;
    albums.forEach(async (album) => {
        const params = album.recents
            ? {first: 1, groupTypes: 'All' as GroupTypes}
            : {
                  groupTypes: 'Album' as GroupTypes,
                  first: 1,
                  groupName: album.title,
              };
        let data;
        if (album.smart) {
            data = await CommonNative.getSmartPhotos(params);
        } else {
            data = await CameraRoll.getPhotos(params);
        }
        if (data.edges.length > 0) {
            const updateAlbum = {...album, uri: data.edges[0].node.image.uri};
            if (album.recents) main.push(updateAlbum);
            else if (!album.smart || album.title === 'Favorites') {
                if (Platform.OS === 'ios' && album.title === 'Favorites') myAlbums.unshift(updateAlbum);
                else myAlbums.push(updateAlbum);
            } else {
                mediaTypes.push(updateAlbum);
            }
        }
        coversDone += 1;
        if (coversDone === albums.length) {
            let data = main.concat(myAlbums);
            if (Platform.OS === 'ios') data = data.concat(mediaTypes);
            props.dispatchCameraAlbums(data);
        }
    });
};

export const getUniqueDeviceId = async () => {
    let deviceId: string;
    if (Platform.OS === 'android') {
        deviceId = await DeviceInfo.getUniqueId();
        return deviceId;
    }
    const model = DeviceInfo.getModel();
    const res = await Keychain.getGenericPassword({service: `${bundleId}.${model}`});
    if (!res) {
        deviceId = await CommonNative.generateUUID();
        await Keychain.setGenericPassword(model, deviceId, {service: `${bundleId}.${model}`});
        return deviceId;
    }
    return res.password;
};

export const getTabName = (navigation: NavigationProp<any>) => {
    let tabName = navigation.getState().routeNames[0];
    if (tabName === 'Messages' || tabName === 'Albums') tabName = 'Chats';
    else if (tabName === 'Files' || tabName === 'Photos' || tabName === 'VaultNotes') tabName = 'Vault';
    return tabName;
};

export const requestAppReview = async (date_joined: string) => {
    let timestamp: string | null = await AsyncStorage.getItem('@appReviewTimestamp');
    if (timestamp === null) timestamp = '0';
    const parsedTimestamp = parseInt(timestamp, 10);
    if (
        new Date().getTime() - new Date(date_joined).getTime() > 86400000 &&
        new Date().getTime() - parsedTimestamp > 86400000 * 10
    ) {
        setTimeout(() => {
            const options = {
                AppleAppID: '1576169188',
                GooglePackageName: 'com.stiiick',
                preferredAndroidMarket: AndroidMarket.Google,
                preferInApp: true,
                openAppStoreIfInAppFails: false,
            };
            AsyncStorage.setItem('@appReviewTimestamp', new Date().getTime().toString());
            Rate.rate(options, (success, errorMessage) => {});
        }, 2000);
    }
};

export const getDeviceName = async () => {
    let deviceName = await DeviceInfo.getDeviceName();
    if (Platform.OS === 'ios') {
        const deviceModel = await DeviceInfo.getModel();
        deviceName = `${deviceName} (${deviceModel})`;
    }
    return deviceName;
};

function isVersionLessThan(currentAppVersion: string, minViableVersion: string) {
    // Split version strings into parts
    const currentParts = currentAppVersion.split('.').map(Number);
    const minParts = minViableVersion.split('.').map(Number);

    // Compare each part from left to right
    for (let i = 0; i < Math.max(currentParts.length, minParts.length); i++) {
        // Treat missing parts as 0 (e.g., "1" is equivalent to "1.0.0")
        const currentPart = i < currentParts.length ? currentParts[i] : 0;
        const minPart = i < minParts.length ? minParts[i] : 0;

        // If current part is less than minimum viable part, return true
        if (currentPart < minPart) {
            return true;
        }
        // If current part is greater than minimum viable part, return false
        if (currentPart > minPart) {
            return false;
        }
        // If parts are equal, continue to next part
    }

    // If all parts are equal, return false since current version is not less than minimum viable version
    return false;
}

export const getAppSettings = async () => {
    const {data} = await axios.get(`${URL}/api/get-app-settings/`);
    const minVersion = Platform.OS === 'ios' ? data.minViableIOSVersion : data.minViableAndroidVersion;
    const appVersion = DeviceInfo.getVersion();
    if (isVersionLessThan(appVersion, minVersion)) {
        const word = Platform.OS === 'ios' ? 'App' : 'Play';
        const url =
            Platform.OS === 'ios'
                ? 'https://apps.apple.com/app/sticknet-encrypted-platform/id1576169188'
                : 'https://play.google.com/store/apps/details?id=com.stiiick';
        Alert.alert(
            'App needs update!',
            `To continue using the app, please get the latest update from the ${word} Store.`,
            [
                {
                    text: 'Open Store',
                    onPress: () => Linking.openURL(url),
                },
            ],
        );
    }
};

export const formDataToObject = (formData: any) => {
    const obj: Record<string, any> = {};
    const arr = formData._parts;
    arr.forEach((item: [string, any]) => {
        if (item[1] !== undefined) {
            if ((item[0] === 'groupsId' || item[0] === 'connectionsId') && typeof item[1] !== 'object')
                obj[item[0]] = [item[1]];
            else {
                obj[item[0]] = item[1];
            }
        }
    });
    return obj;
};

export const createFileSections = (filesTree: Record<string, any>, files: Record<string, any>) => {
    const tempSections: Record<string, any[]> = {};
    let fileIndex = 0;
    Object.values(filesTree || {}).forEach((uriKey) => {
        const item = files[uriKey];
        if (!item) return;
        const title = item.isFolder ? 'Folders' : item.name[0].match(/[a-zA-Z]/) ? item.name[0].toUpperCase() : '#';
        if (!tempSections[title]) tempSections[title] = [];
        tempSections[title].push(item);
    });
    // Convert the tempSections object into an ordered array
    return Object.keys(tempSections)
        .sort((a, b) => {
            if (a === 'Folders') return -1;
            if (b === 'Folders') return 1;
            if (a === '#') return 1;
            if (b === '#') return -1;
            return a.localeCompare(b);
        })
        .map((key) => {
            tempSections[key]
                .sort((a, b) => {
                    if (a.folderType === 'camera_uploads') return -1;
                    if (b.folderType === 'camera_uploads') return 1;
                    return a.name.localeCompare(b.name);
                })
                .forEach((item) => {
                    if (!item.isFolder) {
                        item.fileIndex = fileIndex;
                        fileIndex += 1;
                    }

                    return item;
                });
            return {title: key, data: tempSections[key]};
        });
};

export const createFilesList = (filesTree: any[], files: Record<string, any>) => {
    const fileList: any[] = [];

    filesTree.forEach((uriKey) => {
        const item = files[uriKey];

        if (!item || item.isFolder) return;

        fileList.push(item);
    });

    return fileList.sort((a, b) => {
        const aStartsWithAlpha = /^[a-zA-Z]/.test(a.name);
        const bStartsWithAlpha = /^[a-zA-Z]/.test(b.name);

        // If one name starts with an alphabetical character and the other doesn't
        if (aStartsWithAlpha && !bStartsWithAlpha) {
            return -1; // a comes first
        }
        if (!aStartsWithAlpha && bStartsWithAlpha) {
            return 1; // b comes first
        }

        // If both start with the same type of character, sort alphabetically
        return a.name.localeCompare(b.name);
    });
};

export const prepareFiles = (filesTree: any[], files: Record<string, any>) => {
    if (!filesTree) return [];
    const result: any[] = [];
    let fileIndex = 0;
    filesTree.forEach((uriKey) => {
        if (files[uriKey]) {
            result.push({...files[uriKey], fileIndex});
            fileIndex += 1;
        }
    });
    return result;
};

export const getNewPostsNetwork = (connections: any[], groups: any[]) => {
    const network: any[] = [];
    connections.forEach((item) => {
        if (item.newPostsCount > 0) network.push(item);
    });
    groups.forEach((item) => {
        if (item.newPostsCount > 0) network.push(item);
    });
    if (network.length < 3) {
        groups.sort((a, b) => {
            const dateA = new Date(a.lastActivity);
            const dateB = new Date(b.lastActivity);

            return dateB.getTime() - dateA.getTime();
        });
        if (groups.length > 0) network.push(groups[0]);
        if (groups.length > 1 && network.length < 3) network.push(groups[1]);
        if (connections.length > 0 && network.length < 3) network.push(connections[0]);
        if (connections.length > 1 && network.length < 3) network.push(connections[1]);
    }
    return [...new Set(network)];
};

export const isCloseToBottom = (e: any, paddingToBottom = 200) => {
    const {layoutMeasurement, contentOffset, contentSize} = e.nativeEvent;
    const y = contentSize.height - layoutMeasurement.height - paddingToBottom;
    return y <= contentOffset.y;
};

export const exportFile = async (url: string, item: any) => {
    const isAssetsLibrary = url.startsWith('ph://');
    if (isAssetsLibrary) {
        const outputPath = `${CommonNative.cacheDirectoryPath}/${item.name}`;
        url = await FileSystem.copyAssetsFileIOS(url, outputPath, item.width, item.height);
    }
    Share.open({url})
        .then(() => {
            if (isAssetsLibrary) {
                FileSystem.unlink(url);
            }
        })
        .catch((err) => console.log('share error', err));
};

export const validateEmail = (email: string) => {
    // Regular expression for email validation
    const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$/i;

    return emailRegex.test(email);
};

export function formatBytes(bytes: number, decimals = 1) {
    if (!+bytes) return '0 Bytes';

    const k = 1000;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}

export function nav(navigation: NavigationProp<any>, routeName: string, params?: any) {
    // A workaround when navigating to a screen with no tab bar on iOS. Otherwise the bottom tab bar area will be white space.
    if (Platform.OS === 'ios') {
        globalData.hideTabBar = true;
        navigation.setParams({hideTabBar: true});
        setTimeout(() => navigation.navigate(routeName, params), 0);
    } else {
        navigation.navigate(routeName, params);
    }
}

export function n(noun: string, count: number) {
    return `${count} ${noun}${count > 1 ? 's' : ''}`;
}

export function findKeyByValue(obj: Record<string, any>, targetValue: any): string | null {
    return Object.keys(obj || {}).find((key) => obj[key] === targetValue) || null;
}

export function getAllNestedKeys(obj: Record<string, Record<string, any>>): string[] {
    const nestedKeys: string[] = [];
    Object.keys(obj).forEach((outerKey) => {
        const innerObject = obj[outerKey];
        Object.keys(innerObject).forEach((innerKey) => {
            nestedKeys.push(innerKey);
        });
    });
    return nestedKeys;
}

export function prepareAsset(file: TFile) {
    return {
        createdAt: file.createdAt,
        duration: file.duration,
        fileSize: file.fileSize,
        name: file.name,
        height: file.height,
        width: file.width,
        type: file.type,
    };
}

export function lightenRGBColor(rgbColor: string, amount = 64) {
    if (!rgbColor) return 'rgb(0,0,0)';
    const match = rgbColor.match(/\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (!match) {
        return rgbColor;
    }
    let red = parseInt(match[1]);
    let green = parseInt(match[2]);
    let blue = parseInt(match[3]);
    red = Math.min(255, red + amount);
    green = Math.min(255, green + amount);
    blue = Math.min(255, blue + amount);
    return `rgb(${red},${green},${blue})`;
}

export const createActiveChatsList = (
    groups: Record<string, TGroup>,
    connections: Record<string, TUser>,
    users: Record<string, TUser>,
    currentUser: TUser,
    messages: Record<string, Record<string, TMessage>>,
) => {
    if (!currentUser) return [];
    const keys = Object.keys(messages);
    const response: Record<string, {target: TGroup | TUser; message: TMessage}> = {};
    keys.forEach((key) => {
        let target: TGroup | TUser | undefined = groups[key];
        if (!target) {
            target = Object.values(connections).filter((connection) => connection.roomId === key)[0];
        }
        if (!target) {
            target = Object.values(users).filter((user) => user.roomId === key)[0];
        }
        if (!target && currentUser.roomId === key) target = currentUser;
        if (target && !response[target.id]) {
            const latestMessageKey = Object.keys(messages[target.roomId] || {})[0];
            let message = messages[target.roomId] ? messages[target.roomId][latestMessageKey] : null;
            if (!message) {
                message = {timestamp: new Date(target.timestamp).getTime()} as TMessage;
            }
            response[target.id] = {target, message};
        }
    });
    return Object.values(response).sort((a, b) => {
        const aTimestamp = a.message?.timestamp ?? 0;
        const bTimestamp = b.message?.timestamp ?? 0;
        return bTimestamp - aTimestamp;
    });
};

export const createChatsStoragesList = (
    chatsStorages: IChatsStoragesState,
    connections: Record<string, TUser>,
    user: TUser,
): TChatStorage[] => {
    if (!chatsStorages.partyStorages) return [];
    const response: TChatStorage[] = [];

    chatsStorages.partyStorages.forEach((item) => {
        let target: TUser | undefined;
        if (user.roomId === item.id) {
            target = user;
        } else {
            target = Object.values(connections).find((connection) => connection.roomId === item.id);
        }
        if (target) {
            response.push({id: target.id, storage: item.storage, isParty: true});
        }
    });

    return chatsStorages.groupStorages.concat(response);
};

const oneHour = 60 * 60 * 1000;
export const getUnreadCount = (
    groups: Record<string, TGroup>,
    connections: Record<string, TUser>,
    users: Record<string, TUser>,
    currentUser: TUser,
    messages: Record<string, Record<string, TMessage>>,
    activeRooms: Record<string, Record<string, number>>,
    lastSeen: Record<string, number>,
    requests: Record<string, any>,
) => {
    const chatList = createActiveChatsList(groups, connections, users, currentUser, messages);
    let count = 0;
    chatList.forEach((item) => {
        const {message, target} = item;
        const isSelf = target.id === currentUser.id;
        let isActive = false;
        const activeDevices = Object.values(activeRooms[target.roomId] || {});
        activeDevices.forEach((timestamp) => {
            if (new Date().getTime() - timestamp < oneHour) isActive = true;
        });
        const roomLastSeen = lastSeen[target.roomId];
        const notSeen = !isSelf && !isActive && (!roomLastSeen || roomLastSeen < message.timestamp);
        if (notSeen) count += 1;
    });
    return count + Object.keys(requests || {}).length;
};

export function shortenAddress(address: string) {
    if (!address.startsWith('0x') || address.length < 42) {
        throw new Error('Invalid Ethereum address');
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
