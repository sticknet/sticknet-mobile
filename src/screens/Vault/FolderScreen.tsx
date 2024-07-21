import React, {useState, useEffect} from 'react';
import {
    Text,
    View,
    SectionList,
    RefreshControl,
    Alert,
    StyleSheet,
    ScrollView,
    NativeSyntheticEvent,
    NativeScrollEvent,
} from 'react-native';
import {connect} from 'react-redux';
import {heightPercentageToDP as h} from 'react-native-responsive-screen';
import {Folder, ActionButton, InputModal, Icon, Empty, SmallLoading} from '../../components';
import {vault} from '../../actions';
import {createFileSections, isCloseToBottom} from '../../utils';
import {colors} from '../../foundations';
import type {IApplicationState, TFile, TFolder} from '../../types';
import {IVaultActions} from '../../actions/vault';

interface FolderScreenProps extends IVaultActions {
    navigation: any;
    files: {title: string; data: TFile[]}[];
    currentFolder: TFolder;
    fetchedFolders: Record<string, boolean>;
    url: string | null;
}

const FolderScreen: React.FC<FolderScreenProps> = (props) => {
    const [refreshing, setRefreshing] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [folderName, setFolderName] = useState('');

    useEffect(() => {
        const unsubscribe = props.navigation.addListener('focus', () => {
            props.navigation.setParams({hideTabBar: false});
        });
        return () => {
            props.closeFolder();
            unsubscribe();
        };
    }, [props.navigation]);

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

    const renderFile = ({item}: {item: TFile}) => <Folder item={item} />;
    const fileKeyExtractor = (item: TFile, index: number) => `${item.name}${index}`;
    const renderSectionHeader = ({section}: {section: {title: string}}) => (
        <Text style={s.sectionHeader}>{section.title}</Text>
    );

    const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
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
                cancel={() => {
                    setModalVisible(false);
                }}
                title="New Folder"
                placeholder="Folder name..."
                doneText="Create"
                onChangeText={(text) => setFolderName(text)}
            />
            <View style={s.buttonsContainer}>
                <ActionButton
                    onPress={() => props.navigation.navigate('SelectPhotos', {option: 6, context: 'vault'})}
                    text="Upload"
                    icon={<Icon regular name="upload" size={15} />}
                />
                <ActionButton
                    onPress={() => setModalVisible(true)}
                    text="Folder"
                    icon={<Icon regular name="folder-plus" size={15} />}
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
                    sections={props.files}
                    renderItem={renderFile}
                    renderSectionHeader={renderSectionHeader}
                    keyExtractor={fileKeyExtractor}
                    contentContainerStyle={{paddingRight: 8}}
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
});

const mapStateToProps = (state: IApplicationState, ownProps: any) => {
    const currentFolder = state.appTemp.folderStack[ownProps.route.params.folderIndex];
    let lastFolderName =
        state.appTemp.folderStack.length === 1
            ? 'home'
            : state.appTemp.folderStack[state.appTemp.folderStack.length - 2].name;
    if (lastFolderName === 'home') lastFolderName = 'Vault';
    return {
        files: createFileSections(state.filesTree[currentFolder.id] || {}, state.files),
        photos: Object.values(state.photos.recents || {}),
        currentFolder,
        lastFolderName,
        folderStack: state.appTemp.folderStack,
        fetchedFolders: state.fetched.folders,
        fetchedAlbums: state.fetched.vaultAlbums,
        url: state.url.filesUrls[currentFolder.id],
    };
};

export default connect(mapStateToProps, {...vault})(FolderScreen);
