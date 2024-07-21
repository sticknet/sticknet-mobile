import {
    nEveryRow,
    arrayUnique,
    hashCode,
    getParameterByName,
    formatTime,
    parseNumber,
    monthNames,
    timeSince,
    parseBirthDay,
    getTabName,
    createBlobsIds,
    createCategoriesBlobsIds,
    createFavoritesIds,
    formDataToObject,
    createFileSections,
    createFilesList,
    prepareFiles,
    getNewPostsNetwork,
    isCloseToBottom,
    validateEmail,
    formatBytes,
    nav,
    n,
    findKeyByValue,
    getAllNestedKeys,
    lightenRGBColor,
    createActiveChatsList,
    createChatsStoragesList,
    getUnreadCount,
} from './index';
import {TUser} from '../../types';

describe('common.js actions functions', () => {
    test('nEveryRow splits the array into subarrays of n elements', () => {
        const data = [1, 2, 3, 4, 5, 6];
        const n = 2;
        const result = nEveryRow(data, n);
        expect(result).toEqual([
            [1, 2],
            [3, 4],
            [5, 6],
        ]);
    });

    test('nEveryRow fills the last subarray with nulls if needed', () => {
        const data = [1, 2, 3, 4, 5];
        const n = 2;
        const result = nEveryRow(data, n);
        expect(result).toEqual([
            [1, 2],
            [3, 4],
            [5, null],
        ]);
    });

    // Test for createBlobsIds
    test('createBlobsIds creates an array of blob IDs', () => {
        const imagesIds = ['img1', 'img2'];
        const images = {
            img1: {blobs: [{}, {}]},
            img2: {blobs: [{}]},
        };
        const result = createBlobsIds(imagesIds, images);
        expect(result).toEqual([
            {imageId: 'img1', blobIndex: 0},
            {imageId: 'img1', blobIndex: 1},
            {imageId: 'img2', blobIndex: 0},
        ]);
    });

    // Test for createFavoritesIds
    test('createFavoritesIds creates an array of favorite blob IDs', () => {
        const favoritesIds = ['img1-0', 'img2-1'];
        const images = {
            img1: {id: 'img1', blobs: [{id: 0}, {id: 1}]},
            img2: {id: 'img2', blobs: [{id: 1}]},
        };
        const result = createFavoritesIds(favoritesIds, images);
        expect(result).toEqual([
            {imageId: 'img1', blobIndex: 0},
            {imageId: 'img2', blobIndex: 0},
        ]);
    });

    // Test for createCategoriesBlobsIds
    test('createCategoriesBlobsIds creates an array of category blob IDs', () => {
        const imagesIds = {img1: [0, 1], img2: [0]};
        const images = {img1: {id: 'img1'}, img2: {id: 'img2'}};
        const hidden = ['img2'];
        const result = createCategoriesBlobsIds(imagesIds, images, hidden);
        expect(result).toEqual([
            {imageId: 'img1', blobId: 0},
            {imageId: 'img1', blobId: 1},
        ]);
    });

    // Test for arrayUnique
    test('arrayUnique removes duplicate values from an array', () => {
        const array = [1, 2, 2, 3, 3, 3];
        const result = arrayUnique(array);
        expect(result).toEqual([1, 2, 3]);
    });

    // Test for hashCode
    test('hashCode generates a hash code for a given string', () => {
        const id = 'test';
        const result = hashCode(id);
        expect(result).toBe(3556498);
    });

    // Test for getParameterByName
    test('getParameterByName retrieves a parameter from a URL', () => {
        const url = 'http://example.com/?name=test&age=30';
        const name = getParameterByName('name', url);
        const age = getParameterByName('age', url);
        expect(name).toBe('test');
        expect(age).toBe('30');
    });

    // Test for formatTime
    test('formatTime formats seconds into mm:ss', () => {
        const result = formatTime(125);
        expect(result).toBe('2:05');
    });

    // Test for parseNumber
    test('parseNumber formats phone number with dial code', () => {
        const dialCode = '+1';
        const number = '1234567890';
        const result = parseNumber(dialCode, number);
        expect(result).toBe('+1 3 456 7890');
    });

    // Test for monthNames
    test('monthNames contains correct month names', () => {
        expect(monthNames).toEqual([
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
        ]);
    });

    // Test for timeSince
    test('timeSince returns correct time string', () => {
        const now = new Date().getTime();
        const oneHourAgo = new Date(now - 3600 * 1000).toISOString();
        const result = timeSince(oneHourAgo);
        expect(result).toBe('1h');
    });

    // Test for parseBirthDay
    test('parseBirthDay returns correct birthday string', () => {
        const date = '1990-05';
        const result = parseBirthDay(date);
        expect(result).toBe('1990 May');
    });

    // Test for getTabName
    test('getTabName returns correct tab name', () => {
        const navigation = {getState: () => ({routeNames: ['Messages']})};
        // @ts-ignore
        const tabName = getTabName(navigation);
        expect(tabName).toBe('Chats');
    });

    // Test for formDataToObject
    test('formDataToObject converts FormData to an object', () => {
        const formData = {
            _parts: [
                ['key1', 'value1'],
                ['key2', 'value2'],
            ],
        };
        const result = formDataToObject(formData);
        expect(result).toEqual({key1: 'value1', key2: 'value2'});
    });

    // Test for createFileSections
    test('createFileSections creates sections from filesTree and files', () => {
        const filesTree = {a: 'file1', b: 'file2'};
        const files = {file1: {name: 'aFile', isFolder: false}, file2: {name: 'bFile', isFolder: true}};
        const result = createFileSections(filesTree, files);
        expect(result).toEqual([
            {title: 'Folders', data: [{name: 'bFile', isFolder: true}]},
            {title: 'A', data: [{name: 'aFile', isFolder: false, fileIndex: 0}]},
        ]);
    });

    // Test for createFilesList
    test('createFilesList creates a sorted file list', () => {
        const filesTree = ['file1', 'file2'];
        const files = {file1: {name: 'bFile', isFolder: false}, file2: {name: 'aFile', isFolder: false}};
        const result = createFilesList(filesTree, files);
        expect(result).toEqual([
            {name: 'aFile', isFolder: false},
            {name: 'bFile', isFolder: false},
        ]);
    });

    // Test for prepareFiles
    test('prepareFiles prepares a list of files', () => {
        const filesTree = ['file1', 'file2'];
        const files = {file1: {name: 'file1'}, file2: {name: 'file2'}};
        const result = prepareFiles(filesTree, files);
        expect(result).toEqual([
            {name: 'file1', fileIndex: 0},
            {name: 'file2', fileIndex: 1},
        ]);
    });

    // Test for getNewPostsNetwork
    test('getNewPostsNetwork returns connections and groups with new posts', () => {
        const connections = [{newPostsCount: 1}, {newPostsCount: 0}];
        const groups = [{newPostsCount: 2}];
        const result = getNewPostsNetwork(connections, groups);
        expect(result).toEqual([{newPostsCount: 1}, {newPostsCount: 2}]);
    });

    // Test for isCloseToBottom
    test('isCloseToBottom checks if scroll is close to bottom', () => {
        const e = {
            nativeEvent: {
                layoutMeasurement: {height: 800},
                contentOffset: {y: 1800},
                contentSize: {height: 2000},
            },
        };
        const result = isCloseToBottom(e);
        expect(result).toBe(true);
    });

    // Test for validateEmail
    test('validateEmail validates email format', () => {
        const validEmail = 'test@example.com';
        const invalidEmail = 'test@';
        expect(validateEmail(validEmail)).toBe(true);
        expect(validateEmail(invalidEmail)).toBe(false);
    });

    // Test for formatBytes
    test('formatBytes formats bytes into human-readable string', () => {
        const bytes = 1024;
        const result = formatBytes(bytes);
        expect(result).toBe('1 KB');
    });

    // Test for nav
    test('nav navigates to a route and hides tab bar on iOS', () => {
        const navigation = {navigate: jest.fn(), setParams: jest.fn()};
        // @ts-ignore
        nav(navigation, 'RouteName', {param: 'value'});
        expect(navigation.setParams).toHaveBeenCalledWith({hideTabBar: true});
    });

    // Test for n
    test('n returns correctly pluralized string', () => {
        expect(n('apple', 1)).toBe('1 apple');
        expect(n('apple', 2)).toBe('2 apples');
    });

    // Test for findKeyByValue
    test('findKeyByValue finds key by value in object', () => {
        const obj = {key1: 'value1', key2: 'value2'};
        const result = findKeyByValue(obj, 'value1');
        expect(result).toBe('key1');
    });

    // Test for getAllNestedKeys
    test('getAllNestedKeys returns all nested keys', () => {
        const obj = {key1: {nestedKey1: 'value1'}, key2: {nestedKey2: 'value2'}};
        const result = getAllNestedKeys(obj);
        expect(result).toEqual(['nestedKey1', 'nestedKey2']);
    });

    // Test for lightenRGBColor
    test('lightenRGBColor lightens an RGB color', () => {
        const rgbColor = 'rgb(100,100,100)';
        const result = lightenRGBColor(rgbColor);
        expect(result).toBe('rgb(164,164,164)');
    });

    // Test for createActiveChatsList
    test('createActiveChatsList creates a list of active chats', () => {
        const groups = {group1: {id: 'group1', roomId: 'room1', timestamp: '2023-05-10T12:00:00Z'}};
        const connections = {conn1: {id: 'conn1', roomId: 'room2', timestamp: '2023-05-10T12:00:00Z'}};
        const users = {user1: {id: 'user1', roomId: 'room3', timestamp: '2023-05-10T12:00:00Z'}};
        const currentUser = {id: 'user1', roomId: 'room1'};
        const messages = {room1: {msg1: {timestamp: '2023-05-10T12:00:00Z'}}};
        // @ts-ignore
        const result = createActiveChatsList(groups, connections, users, currentUser, messages);
        expect(result).toHaveLength(1);
    });

    // Test for createChatsStoragesList
    test('createChatsStoragesList creates a list of chat storages', () => {
        const chatsStorages = {partyStorages: [{id: 'room1', storage: 'storage1'}], groupStorages: []};
        const connections = {conn1: {id: 'conn1', roomId: 'room1'}};
        const user = {id: 'user1', roomId: 'room1'};
        // @ts-ignore
        const result = createChatsStoragesList(chatsStorages, connections, user);
        expect(result).toEqual([{id: 'user1', storage: 'storage1', isParty: true}]);
    });

    // Test for getUnreadCount
    test('getUnreadCount returns count of unread messages', () => {
        const groups = {};
        const connections = {conn1: {id: 'conn1', roomId: 'room1'}} as unknown as Record<string, TUser>;
        const users = {};
        const currentUser = {id: 'user1', roomId: 'room1'} as unknown as TUser;
        const messages = {room1: {msg1: {timestamp: new Date('2023-05-10T11:00:00Z').getTime()}}};
        const activeRooms = {};
        const lastSeen = {room1: new Date('2023-05-10T10:00:00Z').getTime()};
        const requests = {};
        const result = getUnreadCount(
            groups,
            connections,
            users,
            currentUser,
            // @ts-ignore
            messages,
            activeRooms,
            lastSeen,
            requests,
        );
        expect(result).toBe(1);
    });
});
