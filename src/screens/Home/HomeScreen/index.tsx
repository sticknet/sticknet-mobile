import React, {useState, useEffect, useRef} from 'react';
import {Pressable, RefreshControl, ScrollView, View} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import LottieView from 'lottie-react-native';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import FontistoIcon from '@expo/vector-icons/Fontisto';
import EntypoIcon from '@expo/vector-icons/Entypo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NavigationProp, RouteProp} from '@react-navigation/native';
import {
    ChatItemSeparator,
    ChatModal,
    EmptyContent,
    Folder,
    Icon,
    PreviewImageFile,
    Text,
    VaultNote,
} from '@/src/components';
import {vault, create, iap, common, stickRoom, app, users, notifications, auth} from '@/src/actions';
import {createActiveChatsList, nav, prepareFiles} from '@/src/utils';
import {colors} from '@/src/foundations';
import {globalData} from '@/src/actions/globalVariables';
import {emptyAnimation} from '@/assets/lottie';
import {commonInitializations} from './utils';
import type {ICommonInitializationsProps} from './utils';
import StartupModals from './StartupModals';
import ChatHomeItem from '@/src/components/StickRoom/ChatHomeItem';
import type {IApplicationState, TUser} from '@/src/types';
import type {HomeStackParamList} from '@/src/navigators/types';

interface HomeScreenOwnProps extends ICommonInitializationsProps {
    navigation: NavigationProp<HomeStackParamList, 'Home'>;
    route: RouteProp<HomeStackParamList, 'Home'>;
}

type ReduxProps = ConnectedProps<typeof connector>;
type Props = ReduxProps & HomeScreenOwnProps;

const HomeScreen: React.FC<Props> = (props) => {
    const listRef = useRef<ScrollView>(null);
    const [refreshing, setRefreshing] = useState(false);
    let tabListener: any = null;

    useEffect(() => {
        if (!globalData.initialized) {
            globalData.initialized = true;
            commonInitializations(props);
        }
        AsyncStorage.setItem('@focusedTab', 'HomeTab');
        const parentNav = props.navigation.getParent();
        if (parentNav) {
            // @ts-ignore
            tabListener = parentNav.addListener('tabPress', () => {
                if (listRef.current && props.navigation.isFocused()) {
                    listRef.current.scrollTo({y: 0, animated: true});
                }
                AsyncStorage.setItem('@focusedTab', 'HomeTab');
            });
        }
        const unsubscribe = props.navigation.addListener('focus', () => {
            props.navigation.setParams({hideTabBar: false});
        });
        return () => {
            if (tabListener) tabListener();
            unsubscribe();
        };
    }, []);

    useEffect(() => {
        if (!globalData.connectedToSocket || globalData.connectedToSocket === 'Home') {
            globalData.connectedToSocket = 'Home';
            props.fetchMessages({groups: props.groups, connections: props.connections, user: props.user});
        }
    }, [Object.keys(props.groups).length + Object.keys(props.connections).length]);

    const refresh = () => {
        setRefreshing(true);
        props.fetchHomeItems({callback: () => setRefreshing(false)});
        props.refreshUser({});
        props.fetchConnections();
    };

    const data = [
        {
            type: 'Files',
            titleIcon: 'files',
            titleText: 'Files - Vault',
            items: props.files,
            render: () =>
                props.files.map((item, index) => {
                    return (
                        <Folder
                            testID={`home-file-${index}`}
                            key={`file-${item.timestamp}`}
                            item={item}
                            folder="mostRecent"
                        />
                    );
                }),
            emptyProps: {
                graphic: (
                    <LottieView source={emptyAnimation} autoPlay loop style={{width: w('80%'), marginBottom: 20}} />
                ),
                text: 'Looks like there are no files here yet. Start adding some to get going!',
                actionText: 'Upload files',
                actionIcon: 'upload',
                testID: 'upload-files',
                action: () => props.openModal({modalName: 'create'}),
            },
        },
        {
            type: 'Photos',
            titleIcon: 'images',
            titleText: 'Photos - Vault',
            items: props.photos,
            render: () => (
                <View style={{flexDirection: 'row', marginHorizontal: -12}}>
                    {props.photos.map((item, index) => (
                        <Pressable
                            key={`photo-${item.timestamp}`}
                            style={{marginLeft: index % 5 !== 0 ? 1.25 : 0, marginBottom: 1.25}}
                            onPress={() =>
                                nav(props.navigation, 'FileView', {
                                    index,
                                    title: item.name,
                                    context: 'vaultPhotos',
                                })
                            }
                        >
                            <PreviewImageFile file={item} context="vault" size={w('20%') - 1} />
                        </Pressable>
                    ))}
                </View>
            ),
            emptyProps: {
                graphic: <FontistoIcon color="lightgrey" name="photograph" size={80} style={{marginVertical: 20}} />,
                text: "Your memories vault is empty, but it won't be for long. Begin by adding your first photo.",
                actionText: 'Upload photos',
                actionIcon: 'upload',
                action: () => props.openModal({modalName: 'create'}),
            },
        },
        {
            type: 'VaultNotes',
            titleIcon: 'notes',
            titleText: 'Notes - Vault',
            items: props.notes,
            render: () =>
                props.notes.map((item) => <VaultNote key={item.timestamp} note={item} style={{marginTop: 12}} />),
            emptyProps: {
                graphic: <EntypoIcon color="lightgrey" name="text" size={80} style={{marginVertical: 20}} />,
                text: 'Secret notes, hidden treasures, all secured in your private Vault.',
                actionText: 'New note',
                actionIcon: 'note-medical',
                action: () => props.navigation.navigate('CreateNote'),
            },
        },
        {
            type: 'Chats',
            titleIcon: 'comment',
            titleText: 'Chats',
            items: props.chats,
            render: () =>
                props.chats.map((item, index) => (
                    <View key={item.target.roomId}>
                        <ChatHomeItem target={item.target} message={item.message} />
                        {index < props.chats.length - 1 && <ChatItemSeparator />}
                    </View>
                )),
            emptyProps: {
                graphic: <Icon color="lightgrey" name="messages" size={80} style={{marginVertical: 20}} />,
                text: 'No new messages at the moment. Start a new chat now!',
                actionText: 'New chat',
                actionIcon: 'comment-plus',
                action: () => props.navigation.navigate('NewChat'),
            },
        },
    ];

    return (
        <ScrollView
            ref={listRef}
            testID="home-screen"
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={refresh}
                    tintColor={colors.primary}
                    colors={[colors.primary]}
                />
            }
        >
            {data.map((section) => {
                const {type, titleIcon, titleText, items} = section;
                return (
                    <View key={type}>
                        <View style={{paddingVertical: 20, paddingHorizontal: 12}}>
                            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                                <View style={{flexDirection: 'row', marginBottom: 20}}>
                                    <Icon name={titleIcon} size={20} />
                                    <Text style={{marginLeft: 8, fontWeight: 'bold'}}>{titleText}</Text>
                                </View>
                                <Pressable
                                    onPress={() => {
                                        if (type !== 'Chats') {
                                            globalData.targetTab = type;
                                            props.navigation.navigate('VaultTab', {screen: 'Vault'});
                                        } else {
                                            props.navigation.navigate('ChatsTab');
                                        }
                                    }}
                                >
                                    <Text style={{color: colors.primary}}>See all</Text>
                                </Pressable>
                            </View>
                            {items.length > 0 ? section.render() : <EmptyContent {...section.emptyProps} />}
                        </View>
                        <View style={{height: 8, backgroundColor: '#f3f3f3'}} />
                    </View>
                );
            })}
            {/* @ts-ignore */}
            <StartupModals />
            <ChatModal />
        </ScrollView>
    );
};

const mapStateToProps = (state: IApplicationState) => ({
    files: prepareFiles(state.filesTree.mostRecent, state.files),
    photos: Object.values(state.photos.recents || {}).slice(0, 5),
    notes: Object.values(state.vaultNotes).slice(0, 3),
    chats: createActiveChatsList(
        state.groups,
        state.connections,
        state.users,
        state.auth.user as TUser,
        state.messages,
    ).slice(0, 3),
    connections: state.connections,
    users: state.users,
    appState: state.appState,

    // init props
    user: state.auth.user as TUser,
    isConnected: state.appTemp.isConnected,
    finishedRegistration: state.auth.finishedRegistration,
    appTemp: state.appTemp,
    groups: state.groups,
    requestSavePasswordCount: state.app.requestSavePasswordCount,
    seenPasswordModal: state.app.seenPasswordModal,
    finishedTransactions: state.finishedTransactions,
    isBasic: !state.auth.user || state.auth.user.subscription === 'basic',
});

const connector = connect(mapStateToProps, {
    ...vault,
    ...create,
    ...iap,
    ...common,
    ...stickRoom,
    ...app,
    ...users,
    ...notifications,
    ...auth,
});

export default connector(HomeScreen);
