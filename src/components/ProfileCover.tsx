import React, {Component} from 'react';
import {connect} from 'react-redux';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import {Platform, StatusBar, TouchableOpacity, StyleSheet, ImageSourcePropType} from 'react-native';
import Image from './Image';
import NewImage from './NewImage';
import {DefaultProfileCover} from '@/assets/images';
import type {IApplicationState, TUser} from '@/src/types';

interface ProfileCoverProps {
    navigation: any;
    route: any;
    user: TUser;
    myId?: string;
}

class ProfileCover extends Component<ProfileCoverProps> {
    openCover = () => {
        if (Platform.OS === 'ios') StatusBar.setHidden(true, 'slide');
        let {cover} = this.props.user;
        // @ts-ignore
        if (!cover) cover = {height: 240, width: w('100%'), size: 'H', id: 'key', defaultImage: 'ProfileCover'};
        // @ts-ignore
        else cover = {...this.props.user.cover, user: {id: this.props.user.id}};
        this.props.navigation.navigate({
            name: `Horizontal`,
            params: {
                index: 0,
                id: -1,
                back: this.props.route.name,
                imagesPool: [cover],
                plain: true,
                type: 'pc',
                isChangeable: this.props.user.id === this.props.myId,
            },
            merge: true,
        });
    };

    render() {
        const {user} = this.props;
        const resizeMode = user.cover ? user.cover.resizeMode : 'cover';
        const ImageComponent = user.cover?.uriKey ? NewImage : Image;
        const source: ImageSourcePropType = user.cover ? {uri: user.cover.uri} : DefaultProfileCover;
        return (
            <TouchableOpacity
                activeOpacity={1}
                onPress={this.openCover}
                style={{borderBottomWidth: resizeMode === 'contain' ? 1 : 0, borderColor: 'lightgrey'}}
            >
                <ImageComponent
                    source={source}
                    style={s.cover}
                    image={{...user.cover, user: {id: user.id}}}
                    type="pc"
                    resizeMode={resizeMode}
                    defaultImage="ProfileCover"
                    resizeable
                    context="other"
                />
            </TouchableOpacity>
        );
    }
}

const s = StyleSheet.create({
    cover: {
        width: w('100%'),
        height: 200,
    },
});

const mapStateToProps = (state: IApplicationState) => ({
    myId: state.auth.user?.id,
});

export default connect(mapStateToProps, null)(ProfileCover);
