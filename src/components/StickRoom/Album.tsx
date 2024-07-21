import React, {FC} from 'react';
import {View, StyleSheet, Pressable} from 'react-native';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import {connect, ConnectedProps} from 'react-redux';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import Icon from '../Icons/Icon';
import Text from '../Text';
import ChatImage from './Post/ChatImage';
import {n} from '../../utils';
import {app} from '../../actions';
import type {IApplicationState} from '../../types';
import type {ChatStackParamList} from '../../navigators/types';

interface AlbumOwnProps {
    albumTimestamp: string;
}

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux & AlbumOwnProps;

const Album: FC<Props> = (props) => {
    const navigation = useNavigation<NavigationProp<ChatStackParamList>>();
    const {album} = props;
    if (!album) return null;
    const {title, cover, photosCount, videosCount, autoMonth} = album;

    return (
        <Pressable
            style={s.container}
            onPress={() => navigation.navigate('AlbumPhotos', {album})}
            onLongPress={() => props.dispatchAppTempProperty({albumModal: {isVisible: true, album}})}>
            <View style={s.innerContainer}>
                {cover && <ChatImage file={cover} style={{width: w('40%'), height: w('40%'), borderRadius: 12}} />}
                <View style={s.opacity} />
                <View style={s.titleContainer}>
                    {autoMonth && <Icon regular name="calendar-star" color="#ffffff" style={{marginRight: 8}} />}
                    <Text style={s.title}>{autoMonth || title.text}</Text>
                </View>
            </View>
            <Text>
                {photosCount > 0 && <Text style={{color: '#5a5a5a'}}>{n('Photo', photosCount)}</Text>}
                {photosCount > 0 && videosCount > 0 && <Text style={{color: '#5a5a5a'}}>, </Text>}
                {videosCount > 0 && <Text style={{color: '#5a5a5a'}}>{n('Video', videosCount)}</Text>}
            </Text>
        </Pressable>
    );
};

const s = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    innerContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        width: w('50%'),
        marginBottom: 8,
    },
    opacity: {
        position: 'absolute',
        width: w('40%'),
        height: w('40%'),
        zIndex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderRadius: 12,
        top: 0,
    },
    titleContainer: {
        position: 'absolute',
        zIndex: 2,
        alignSelf: 'center',
        flexDirection: 'row',
    },
    title: {
        color: '#fff',
        fontSize: 20,
        textAlign: 'center',
        fontWeight: 'bold',
    },
});

const mapStateToProps = (state: IApplicationState, ownProps: AlbumOwnProps) => {
    return {
        album: state.chatAlbums[state.app.currentTarget!.roomId][ownProps.albumTimestamp],
    };
};

const connector = connect(mapStateToProps, {...app});

export default connector(Album);
