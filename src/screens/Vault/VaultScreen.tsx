import React, {useState, useEffect} from 'react';
import {Text, View, SectionList, RefreshControl, Alert, StyleSheet, ScrollView} from 'react-native';
import {connect} from 'react-redux';
import {useBottomTabBarHeight} from '@react-navigation/bottom-tabs';
import {heightPercentageToDP as h} from 'react-native-responsive-screen';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {Folder, ActionButton, InputModal, Icon, Empty, SmallLoading, UploadingView} from '../../components';
import {app, common, iap, stickRoom, vault, create, auth} from '../../actions';
import {createFileSections, isCloseToBottom, photosPermission} from '../../utils';
import {colors} from '../../foundations';
import {globalData} from '../../actions/globalVariables';
import {commonInitializations} from '../Home/HomeScreen/utils';
import StartupModals from '../Home/HomeScreen/StartupModals';
import type {IApplicationState, TUser, TFile, TFolder, TGroup} from '../../types';
import type {IVaultActions, IAppActions, IStickRoomActions} from '../../actions/types';
import type {VaultStackParamList} from '../../navigators/types';

interface VaultScreenProps extends IVaultActions, IAppActions, IStickRoomActions {
    files: {title: string; data: TFile[]}[];
    currentFolder: TFolder;
    fetchedFolders: {[key: string]: boolean};
    url: string;
    tabBarHeight: number;
    isMovingFile: boolean;
    count: number;
    user: TUser | null;
    groups: Record<string, TGroup>;
    connections: Record<string, TUser>;
}

const VaultScreen: React.FC<VaultScreenProps> = (props) => {
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [folderName, setFolderName] = useState('');
    const tabBarHeight = useBottomTabBarHeight();
    const navigation = useNavigation<NavigationProp<VaultStackParamList>>();

    if (!props.tabBarHeight) props.dispatchAppTempProperty({tabBarHeight});

    const didMount = () => {
        if (!props.fetchedFolders.home)
            props.fetchFiles({currentUrl: null, folderId: 'home', firstFetch: false, refresh: true});
    };

    useEffect(() => {
        if (!globalData.initialized) {
            globalData.initialized = true;
            // @ts-ignore
            commonInitializations(props, () => didMount());
        } else didMount();
        AsyncStorage.setItem('@focusedTab', 'VaultTab');
        const unsubscribe = navigation.addListener('focus', () => {
            navigation.setParams({hideTabBar: false});
            if (globalData.targetTab) {
                navigation.navigate(globalData.targetTab);
                globalData.targetTab = null;
            }
        });
        return () => {
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!globalData.connectedToSocket || globalData.connectedToSocket === 'Vault') {
            globalData.connectedToSocket = 'Vault';
            props.fetchMessages({groups: props.groups, connections: props.connections, user: props.user!});
        }
    }, [Object.keys(props.groups).length + Object.keys(props.connections).length]);

    const {currentFolder} = props;
    let loadingMore = false;

    const refresh = () => {
        setRefreshing(true);
        props.fetchFiles({
            currentUrl: null,
            folderId: currentFolder.id,
            firstFetch: false,
            refresh: true,
            callback: () => setRefreshing(false),
        });
    };

    const renderFile = ({item}: {item: TFile}) => <Folder testID={`file-${item.fileIndex}`} item={item} />;
    const fileKeyExtractor = (item: TFile, index: number) => `${item.name}${index}`;
    const renderSectionHeader = ({section}: {section: {title: string}}) => (
        <Text style={s.sectionHeader}>{section.title}</Text>
    );

    const onScroll = (e: any) => {
        if (isCloseToBottom(e) && !loadingMore && props.url) {
            loadingMore = true;
            props.fetchFiles({
                currentUrl: props.url,
                folderId: props.currentFolder.id,
                firstFetch: false,
                refresh: false,
                callback: () => (loadingMore = false),
            });
        }
    };

    const footer = () => (
        <View style={s.infoContainer}>
            <View style={s.infoItem}>
                <Icon name="shield-check" solid color="darkgrey" space />
                <Text style={s.infoText}>End-to-end encrypted</Text>
            </View>
            <View style={s.infoItem}>
                <Icon name="shield-check" solid color="darkgrey" space />
                <Text style={s.infoText}>Decentralized storage</Text>
            </View>
        </View>
    );

    return (
        <View style={{flex: 1, paddingLeft: 8}}>
            <InputModal
                visible={modalVisible}
                onPress={() => {
                    if (folderName.length === 0) {
                        Alert.alert("Folder name can't be empty");
                    } else {
                        props.createFolder({parentFolderId: props.currentFolder.id, name: folderName});
                        setModalVisible(false);
                    }
                }}
                cancel={() => setModalVisible(false)}
                title="New Folder"
                placeholder="Folder name..."
                doneText="Create"
                onChangeText={(text) => setFolderName(text)}
            />
            <View style={s.buttonsContainer}>
                <ActionButton
                    onPress={() =>
                        photosPermission(() => navigation.navigate('SelectPhotos', {option: 6, context: 'vault'}))
                    }
                    text="Upload"
                    icon={<Icon regular name="upload" size={15} />}
                />
                <ActionButton
                    onPress={() => setModalVisible(true)}
                    text="Folder"
                    icon={<Icon regular name="folder-plus" size={15} />}
                    style={{marginLeft: 12}}
                />
                <ActionButton
                    onPress={() => {
                        navigation.navigate('VaultNotes');
                        navigation.navigate('CreateNote');
                    }}
                    text="Note"
                    icon={<Icon regular name="note-medical" size={15} />}
                    style={{marginLeft: 12}}
                />
            </View>
            {props.files.length > 0 ? (
                <SectionList
                    refreshControl={
                        <RefreshControl
                            onRefresh={refresh}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                            refreshing={refreshing}
                        />
                    }
                    ListFooterComponent={footer}
                    ListFooterComponentStyle={{flex: 1, justifyContent: 'flex-end'}}
                    sections={props.files}
                    renderItem={renderFile}
                    renderSectionHeader={renderSectionHeader}
                    keyExtractor={fileKeyExtractor}
                    contentContainerStyle={{
                        paddingRight: 8,
                        paddingBottom: props.isMovingFile ? h('12%') : props.count ? 40 : 0,
                        flexGrow: 1,
                    }}
                    onScroll={onScroll}
                />
            ) : props.fetchedFolders[props.currentFolder.id] ? (
                <ScrollView
                    style={{paddingTop: h('30%')}}
                    refreshControl={
                        <RefreshControl
                            onRefresh={refresh}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                            refreshing={refreshing}
                        />
                    }>
                    <Empty text="This folder is empty" />
                </ScrollView>
            ) : (
                <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
                    <SmallLoading />
                </View>
            )}
            <UploadingView />
            {/* @ts-ignore */}
            <StartupModals />
        </View>
    );
};

const s = StyleSheet.create({
    sectionHeader: {
        fontWeight: 'bold',
        fontSize: 15,
        paddingVertical: 4,
        backgroundColor: '#ffffff',
    },
    buttonsContainer: {
        flexDirection: 'row',
        marginTop: 12,
        marginBottom: 8,
    },
    infoContainer: {
        paddingBottom: 12,
        alignSelf: 'center',
    },
    infoItem: {
        flexDirection: 'row',
        marginTop: 12,
        alignItems: 'center',
    },
    infoText: {
        color: 'darkgrey',
        fontSize: 13,
    },
});

const mapStateToProps = (state: IApplicationState) => {
    const currentFolder = state.appTemp.folderStack[0];
    let lastFolderName =
        state.appTemp.folderStack.length === 1
            ? 'home'
            : state.appTemp.folderStack[state.appTemp.folderStack.length - 2].name;
    if (lastFolderName === 'home') lastFolderName = 'Vault';
    return {
        files: createFileSections(state.filesTree[currentFolder.id] || {}, state.files),
        currentFolder,
        fetchedFolders: state.fetched.folders,
        url: state.url.filesUrls[currentFolder.id],
        tabBarHeight: state.appTemp.tabBarHeight,
        isMovingFile: state.appTemp.movingFile !== null,
        count: Object.keys(state.upload).length,
        user: state.auth.user as TUser,
        groups: state.groups,
        connections: state.connections,
        appTemp: state.appTemp,
        appState: state.appState,
    };
};

export default connect(mapStateToProps, {
    ...vault,
    ...app,
    ...iap,
    ...common,
    ...stickRoom,
    ...create,
    ...auth,
})(VaultScreen);
