import React, {useRef, useEffect, useState} from 'react';
import {FlatList, Platform} from 'react-native';
import {connect} from 'react-redux';
import {NavigationProp, useNavigation} from '@react-navigation/native';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import {ImageFile, MessageModal} from '@/src/components';
import {createFilesList, prepareFiles} from '@/src/utils';
import {app} from '@/src/actions';
import {globalData} from '@/src/actions/globalVariables';
import ActionsModal from '@/src/components/Modals/ActionsModal';
import type {IApplicationState, TFile, TUser} from '@/src/types';
import type {IAppActions} from '@/src/actions/app';
import type {VaultStackParamList} from '@/src/navigators/types';

interface FileViewScreenProps extends IAppActions {
    route: any;
    files: TFile[];
    user: TUser | null;
    roomId: string;
    connections: Record<string, TUser>;
    members: Record<string, Record<string, TUser>>;
}

const FileViewScreen: React.FC<FileViewScreenProps> = (props) => {
    const navigation = useNavigation<NavigationProp<VaultStackParamList>>();
    const [actionsVisible, setActionsVisible] = useState(false);
    const [focusedItem, setFocusedItem] = useState<TFile | null>(null);
    const ref = useRef<FlatList<TFile>>(null);

    useEffect(() => {
        const item = props.files[props.route.params.index];
        if (props.route.params.context === 'chat') {
            const user =
                item.user === props.user?.id
                    ? props.user
                    : item.party
                    ? props.connections[item.user]
                    : props.members[props.roomId]
                    ? props.members[props.roomId][item.user]
                    : props.user;
            navigation.setParams({title: user?.name || props.user?.name});
        }
        setFocusedItem(props.files[props.route.params.index]);
        props.focusedVideo(props.files[props.route.params.index].id as number);
        navigation.setParams({
            openModal: () => {
                if (props.route.params.context === 'chat')
                    props.toggleMessageModal({
                        messageId: item.messageId,
                        isVisible: true,
                        file: item,
                        fileActionsOnly: true,
                    });
                else setActionsVisible(true);
            },
        });
        const nextTick = new Promise((resolve) => setTimeout(resolve, 0));
        nextTick.then(() => {
            ref.current?.scrollToIndex({
                index: props.route.params.index,
                animated: false,
            });
        });
        return () => {
            props.focusedVideo(null);
            globalData.hideTabBar = false;
        };
    }, []);

    useEffect(() => {
        if (props.files.length === 0) navigation.goBack();
    }, [props.files.length, navigation]);

    const renderItem = ({item}: {item: TFile}) => <ImageFile file={item} context={props.route.params.context} />;
    const keyExtractor = (item: TFile) => item.uriKey;

    const onViewableItemsChanged = useRef(({changed}: {changed: {item: TFile}[]}) => {
        const item = changed[0].item;
        setFocusedItem(item);
        props.focusedVideo(item.id as number);
        if (props.route.params.context.startsWith('vault')) navigation.setParams({title: item.name});
        if (props.route.params.context.startsWith('chat')) {
            const user =
                item.user === props.user?.id
                    ? props.user
                    : item.party
                    ? props.connections[item.user]
                    : props.members[props.roomId]
                    ? props.members[props.roomId][item.user]
                    : props.user;
            navigation.setParams({
                title: user ? user.name : props.user?.name,
                openModal: () =>
                    props.toggleMessageModal({
                        messageId: item.messageId,
                        isVisible: true,
                        file: item,
                        fileActionsOnly: true,
                    }),
            });
        }
    }).current;

    return (
        <>
            <FlatList
                ref={ref}
                data={props.files}
                renderItem={renderItem}
                keyExtractor={keyExtractor}
                horizontal
                pagingEnabled
                showsVerticalScrollIndicator={false}
                showsHorizontalScrollIndicator={false}
                onViewableItemsChanged={onViewableItemsChanged}
                viewabilityConfig={{
                    waitForInteraction: false,
                    viewAreaCoveragePercentThreshold: 95,
                    minimumViewTime: props.route.params.context.startsWith('chat') ? 400 : 10,
                }}
                getItemLayout={(data, index) => ({length: w('100%'), offset: w('100%') * index, index})}
            />
            <ActionsModal
                isVisible={actionsVisible}
                hideModal={() => setActionsVisible(false)}
                item={focusedItem as TFile}
                type="file"
                parent={{id: focusedItem?.folder as number}}
            />
            {props.route.params.context === 'chat' && Platform.OS === 'ios' && <MessageModal />}
        </>
    );
};

const mapStateToProps = (state: IApplicationState, ownProps: any) => {
    const currentFolder = ownProps.route.params.folder;
    const currentAlbum = state.appTemp.albumStack[state.appTemp.albumStack.length - 1];
    const {context, imagesIds, isRoomStorage} = ownProps.route.params;
    return {
        files:
            isRoomStorage && state.app.currentTarget
                ? Object.values(state.roomFiles[state.app.currentTarget.roomId] || {}).reverse()
                : context === 'chat'
                ? prepareFiles(imagesIds, state.chatFiles)
                : context === 'vaultPhotos'
                ? Object.values(state.photos[currentAlbum.id] || {})
                : currentFolder.id === 'mostRecent' || currentFolder.id === 'search'
                ? prepareFiles(state.filesTree[currentFolder.id], state.files)
                : createFilesList(state.filesTree[currentFolder.id], state.files),
        currentFolder,
        user: state.auth.user,
        roomId: state.app.currentTarget ? state.app.currentTarget.id : '',
        connections: state.connections,
        members: state.members,
    };
};

export default connect(mapStateToProps, {...app})(FileViewScreen);
