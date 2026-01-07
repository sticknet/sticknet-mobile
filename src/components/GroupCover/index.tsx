import React, {PureComponent} from 'react';
import {StyleProp, ViewStyle, ImageResizeMode} from 'react-native';
import Image from '@/src/components/Image';
import {DefaultGroupCover} from '@/assets/images';
import NewImage from '@/src/components/NewImage';
import {TGroupCover} from '@/src/types';

interface GroupCoverProps {
    size?: number;
    style?: StyleProp<ViewStyle>;
    resizeMode?: ImageResizeMode;
    small?: boolean;
    cover?: TGroupCover;
    groupId?: string;
    isPreview?: boolean;
}

class GroupCover extends PureComponent<GroupCoverProps> {
    render() {
        const {size = 48, style, resizeMode, small, cover, groupId, isPreview} = this.props;
        const resize = resizeMode || (cover ? cover.resizeMode : 'cover');
        const coverStyle: StyleProp<ViewStyle> = [
            {
                width: size,
                height: size,
                borderRadius: 0.17 * size,
                borderWidth: resize === 'cover' ? 0 : 1,
                borderColor: 'lightgrey',
                backgroundColor: '#fff',
            },
            style,
        ];
        if (cover?.uriKey)
            return (
                <NewImage style={coverStyle} image={cover} context="other" isPreview={isPreview} resizeMode={resize} />
            );
        return (
            <Image
                // @ts-ignore
                type="cover"
                image={cover?.id ? {...cover, groupId} : null}
                style={coverStyle}
                source={cover ? {uri: cover.uri} : DefaultGroupCover}
                resizeMode={resize}
                resizeable
                small={small}
            />
        );
    }
}

export default GroupCover;
