import React, {useRef, useEffect} from 'react';
import {View, StyleSheet, FlatList, Platform, TouchableOpacity, NativeScrollEvent} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import {KeyboardAccessoryView} from 'react-native-ui-lib/keyboard';
import type {NavigationProp, RouteProp} from '@react-navigation/native';
import {Composer, Icon, Post, RepliedModal, Text} from '../../components';
import {globalData} from '../../actions/globalVariables';
import {app, groups, stickRoom} from '../../actions';
import {colors} from '../../foundations';
import {isCloseToBottom} from '../../utils';
import MessageModal from '../../components/Modals/MessageModal';
import ReactionsModal from '../../components/Modals/ReactionsModal';
import PendingModal from '../../components/Modals/PendingModal';
import type {IApplicationState, TGroup, TMessage, TUser} from '../../types';
import type {ChatStackParamList} from '../../navigators/types';

let isActive = true;

interface StickRoomScreenProps {
    route: RouteProp<ChatStackParamList, 'StickRoom'>;
    navigation: NavigationProp<ChatStackParamList>;
}

type ReduxProps = ConnectedProps<typeof connector>;

type Props = StickRoomScreenProps & ReduxProps;

const StickRoomScreen: React.FC<Props> = (props) => {
    const params = props.route.params;
    const listRef = useRef<FlatList<TMessage>>(null);

    const didMount = async () => {
        if (params.isGroup && !props.fetchedGroupMembers) {
            await props.fetchGroupMembers({group: props.target as TGroup});
        } else {
            await props.connectOneToOne({target: props.target, user: props.user});
        }
        await props.connect({target: props.target, user: props.user});
        if (props.removedRoom) {
            props.fetchMessagesSingleTarget({target: props.target, user: props.user});
        }
    };

    useEffect(() => {
        didMount();
        return () => {
            globalData.hideTabBar = false;
            props.disconnect({roomId: props.target.roomId, userId: props.user.id});
        };
    }, []);

    useEffect(() => {
        if (props.appState !== 'active' && isActive) {
            props.disconnect({roomId: props.target.roomId, userId: props.user.id});
            isActive = false;
        } else if (props.appState === 'active' && !isActive) {
            props.connect({target: props.target, user: props.user});
            isActive = true;
        }
    }, [props.appState]);

    const renderItem = ({item, index}: {item: TMessage; index: number}) => (
        <Post
            roomId={props.target.roomId}
            messageId={item.id}
            prevMessageId={Object.values(props.messages)[index + 1]?.id}
            testID={`message-${index}`}
        />
    );

    let loadingMore = false;

    const onScroll = (e: {nativeEvent: NativeScrollEvent}) => {
        if (e.nativeEvent.contentOffset.y > 100 && isCloseToBottom(e, 50) && !loadingMore) {
            loadingMore = true;
            props.fetchOlderMessages({target: props.target, user: props.user, callback: () => (loadingMore = false)});
        }
    };

    const onEndReached = () => {
        if (!loadingMore && Object.keys(props.messages).length >= 20) {
            loadingMore = true;
            props.fetchOlderMessages({target: props.target, user: props.user, callback: () => (loadingMore = false)});
        }
    };

    const footer = () => {
        const list = [
            [
                {text: 'End-to-end encrypted', icon: 'circle-check'},
                {text: 'Multi Device', icon: 'circle-check'},
                {text: 'Full Resolution Media', icon: 'circle-check'},
            ],
            [
                {text: 'Decentralized storage', icon: 'circle-check'},
                {text: 'Persistent History', icon: 'circle-check'},
                {text: 'Organized Albums', icon: 'circle-check'},
            ],
        ];
        return (
            <View style={s.infoContainer}>
                {list.map((arr) => (
                    <View style={{paddingHorizontal: 12}} key={arr[0].text}>
                        {arr.map((item, index) => (
                            <View style={s.infoItem} key={item.text + index.toString()}>
                                <Icon name={item.icon} solid color="darkgrey" space />
                                <Text style={s.infoText}>{item.text}</Text>
                            </View>
                        ))}
                    </View>
                ))}
            </View>
        );
    };

    const memberRequests = () => {
        const {requestsCount, admins} = props.target as TGroup;
        if (!(requestsCount > 0 && admins.includes(props.user.id))) return null;
        return (
            <TouchableOpacity
                style={s.requestsContainer}
                activeOpacity={1}
                onPress={() =>
                    props.navigation.navigate({
                        name: 'MemberRequests',
                        params: {
                            id: props.target.id,
                            requestsCount,
                        },
                        merge: true,
                    })
                }>
                <Text style={s.requests}>
                    {requestsCount} Pending Member Request{requestsCount > 1 && 's'}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <>
            {memberRequests()}
            <FlatList
                ref={listRef}
                data={Object.values(props.messages)}
                renderItem={renderItem}
                keyExtractor={(message) => message.id}
                inverted
                initialNumToRender={25}
                contentContainerStyle={{paddingTop: 24, flexGrow: 1, marginBottom: Platform.OS === 'ios' ? 84 : 0}}
                onScroll={onScroll}
                onEndReached={onEndReached}
                ListFooterComponent={footer}
                ListFooterComponentStyle={{flex: 1, justifyContent: 'flex-start'}}
            />
            <KeyboardAccessoryView
                renderContent={() => <Composer target={props.target} />}
                trackInteractive
                requiresSameParentToManageScrollView
                addBottomView
                bottomViewColor={colors.lightWhite}
                useSafeArea
            />
            <MessageModal />
            <ReactionsModal />
            <RepliedModal />
            <PendingModal
                isVisible={!!props.pendingModal}
                hideModal={() => props.dispatchAppTempProperty({pendingModal: null})}
                // @ts-ignore
                name={props.pendingModal?.nameOfUser}
            />
        </>
    );
};

const s = StyleSheet.create({
    infoContainer: {
        paddingBottom: 12,
        alignSelf: 'center',
        flexDirection: 'row',
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
    requestsContainer: {
        backgroundColor: '#6060FF',
        padding: 4,
        borderTopColor: '#fff',
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    requests: {
        fontSize: 15,
        color: '#ffffff',
        textAlign: 'center',
    },
});

const mapStateToProps = (state: IApplicationState, ownProps: StickRoomScreenProps) => {
    const {roomId, isGroup, id} = ownProps.route.params;
    return {
        target:
            id === state.auth.user!.id
                ? state.auth.user!
                : isGroup
                ? state.groups[id]
                : state.connections[id] || state.users[id],
        user: state.auth.user as TUser,
        messages: state.messages[roomId] || {},
        appState: state.appState,
        fetchedGroupMembers: state.fetched.members[id],
        removedRoom: state.removedRooms[roomId],
        pendingModal: state.appTemp.pendingModal,
    };
};

const connector = connect(mapStateToProps, {...groups, ...stickRoom, ...app});

export default connector(StickRoomScreen);
