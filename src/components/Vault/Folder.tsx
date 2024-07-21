import {View, Pressable, Image} from 'react-native';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {StackNavigationProp} from '@react-navigation/stack';
import {connect, ConnectedProps} from 'react-redux';
import React from 'react';
import Animated from 'react-native-reanimated';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import * as Progress from 'react-native-progress';
import Config from 'react-native-config';
import Icon from '../Icons/Icon';
import Text from '../Text';
import {BlueFolderIcon, YellowFolderIcon, OrangeFolderIcon} from '../../../assets/images';
import PreviewImageFile from './PreviewImageFile';
import {vault} from '../../actions';
import {colors} from '../../foundations';
import ActionsMenu from '../ActionsMenu';
import {nav} from '../../utils';
import type {IApplicationState, TFile} from '../../types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const findFolderIcon = (folderIcon: string) => {
    switch (folderIcon) {
        case 'blue':
            return BlueFolderIcon;
        case 'yellow':
            return YellowFolderIcon;
        case 'orange':
            return OrangeFolderIcon;
        default:
            return BlueFolderIcon;
    }
};

export type TFolderItem = TFile & {
    fileIndex?: number;
};

type FolderProps = ConnectedProps<typeof connector> & {
    item: TFolderItem;
    testID: string;
};

type RootStackParamList = {
    Folder: {folderIndex?: number; title: string};
    FileView: {index?: number; folder: number; title: string; context: string};
};
type FolderScreenNavigationProp = StackNavigationProp<RootStackParamList>;
type FolderScreenRouteProp = RouteProp<RootStackParamList, 'Folder'>;

// A component that represents folders and files
const Folder: React.FC<FolderProps> = (props) => {
    const {item, uploading, currentFolder} = props;
    const navigation = useNavigation<FolderScreenNavigationProp>();
    const route = useRoute<FolderScreenRouteProp>();
    const folderIcon = findFolderIcon(props.folderIcon);

    return (
        <AnimatedPressable
            testID={props.testID}
            style={s.container}
            onPress={() => {
                if (props.fileToMove?.id === item.id) return;
                if (item.isFolder) {
                    if (!props.fetched[item.id])
                        props.fetchFiles({currentUrl: props.url, folderId: item.id, firstFetch: false, refresh: true});
                    props.openFolder(item);
                    const index = route.params && route.params.folderIndex ? route.params.folderIndex + 1 : 1;
                    navigation.push('Folder', {folderIndex: index, title: item.name});
                } else
                    nav(navigation, 'FileView', {
                        index: item.fileIndex,
                        folder: currentFolder,
                        title: item.name,
                        context: 'vault',
                    });
            }}>
            <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                {item.isFolder ? (
                    <View style={{justifyContent: 'center', alignItems: 'center'}}>
                        <Image source={folderIcon} style={{width: 32, height: 32}} />
                        {item.folderType === 'camera_uploads' && (
                            <Icon
                                regular
                                name="camera"
                                size={12}
                                style={{position: 'absolute', top: 11}}
                                color="rgba(0,0,0,0.3)"
                            />
                        )}
                    </View>
                ) : (
                    <PreviewImageFile file={item} context="vault" />
                )}
                <View style={{marginLeft: 8, marginRight: 8, flex: 1}}>
                    <Text numberOfLines={1} style={{fontSize: 15, color: uploading ? 'lightgrey' : colors.black}}>
                        {item.name}
                    </Text>
                    {uploading ? (
                        Config.TESTING !== '1' ? (
                            <Progress.Bar
                                style={{marginTop: 8}}
                                height={4}
                                width={w('70%')}
                                color={colors.primary}
                                borderRadius={0}
                                borderColor="#fff"
                                unfilledColor="lightgrey"
                                progress={uploading}
                            />
                        ) : (
                            <Text testID={`uploading-progress-${props.testID}`}>Uploading...</Text>
                        )
                    ) : null}
                </View>
            </View>
            {item.folderType !== 'camera_uploads' && <ActionsMenu item={item} type="file" parent={currentFolder} />}
        </AnimatedPressable>
    );
};

const s = {
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 8,
        justifyContent: 'space-between',
    },
};

const mapStateToProps = (state: IApplicationState, ownProps: {item: TFile; folder?: number | string}) => {
    const currentFolder = state.appTemp.folderStack[state.appTemp.folderStack.length - 1];
    return {
        uploading: state.upload[ownProps.item.uriKey],
        fetched: state.fetched.folders,
        currentFolder: ownProps.folder ? {id: ownProps.folder} : currentFolder,
        url: ownProps.item ? state.url.filesUrls[ownProps.item.id] : null,
        folderIcon: state.app.preferences.folderIcon,
        fileToMove: state.appTemp.movingFile,
    };
};

const connector = connect(mapStateToProps, {...vault});

export default connector(Folder);
