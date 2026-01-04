import React, {PureComponent} from 'react';
import {Pressable, View, StyleSheet, StyleProp, ViewStyle} from 'react-native';
import CheckIcon from '@expo/vector-icons/Feather';
import DotsIcon from '@expo/vector-icons/MaterialCommunityIcons';
import GroupCover from './GroupCover';
import {colors} from '@/src/foundations';
import GroupModal from './Modals/GroupModal';
import Text from './Text';
import Icon from './Icons/Icon';
import {formatBytes} from '@/src/utils';
import {TGroup} from '@/src/types';

interface StorageIndicatorProps {
    storage: number;
}

export const StorageIndicator: React.FC<StorageIndicatorProps> = ({storage}) => {
    return (
        <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={{color: 'grey'}}>{formatBytes(storage)}</Text>
            <Icon solid style={{marginLeft: 4}} name="chevron-right" size={15} color="darkgrey" />
        </View>
    );
};

interface GroupItemProps {
    item: {item: TGroup} | TGroup;
    onPress?: () => void;
    selected?: boolean | null;
    singleSelected?: boolean;
    dark?: boolean;
    size?: number;
    testID?: string;
    showOptions?: boolean;
    showNewPostsCount?: boolean;
    showIfEmpty?: boolean;
    style?: StyleProp<ViewStyle>;
    storage?: number;
}

interface GroupItemState {
    modalVisible: boolean;
}

class GroupItem extends PureComponent<GroupItemProps, GroupItemState> {
    static defaultProps = {
        selected: null,
        singleSelected: false,
        dark: false,
        size: 48,
    };

    state = {
        modalVisible: false,
    };

    render() {
        const {
            item,
            onPress,
            selected,
            singleSelected,
            dark,
            size,
            testID,
            showOptions,
            showNewPostsCount,
            showIfEmpty,
            style,
            storage,
        } = this.props;
        const group = 'item' in item ? item.item : item;
        const color = !dark ? '#0F0F28' : '#fff';
        return (
            <Pressable testID={testID} style={[s.groupItem, style]} onPress={onPress}>
                <View style={{flexDirection: 'row', alignItems: 'center', justifyContent: 'center'}}>
                    <GroupCover groupId={group.id} cover={group.cover!} size={size} isPreview />
                    <View style={s.nameContainer}>
                        {group.displayName.decrypted ? (
                            <Text testID={`${testID}-display-name`} numberOfLines={1} style={[s.displayName, {color}]}>
                                {group.displayName.text}
                            </Text>
                        ) : (
                            <Icon name="lock" size={20} color="grey" />
                        )}
                        {showNewPostsCount && group.newPostsCount > 0 && (
                            <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                <View style={s.circle} />
                                <Text style={{color: colors.primary}}>
                                    {group.newPostsCount} new post{group.newPostsCount > 1 && 's'}
                                </Text>
                            </View>
                        )}
                        {showIfEmpty && group.newPostsCount === 0 && (
                            <Text style={{color: 'darkgrey'}}>- no new posts -</Text>
                        )}
                    </View>
                </View>
                {selected !== null ? (
                    <CheckIcon
                        testID={`${testID}-check-icon`}
                        name={selected ? 'check-circle' : 'circle'}
                        size={24}
                        color={selected ? '#6060FF' : 'lightgrey'}
                        style={s.checkIcon}
                    />
                ) : singleSelected ? (
                    <CheckIcon name="check-circle" size={24} color="#6060FF" style={s.checkIcon} />
                ) : null}
                {showOptions && (
                    <Pressable
                        onPress={() => this.setState({modalVisible: true})}
                        hitSlop={{left: 10, right: 10, top: 10, bottom: 10}}
                    >
                        <DotsIcon name="dots-horizontal" size={24} color="grey" />
                    </Pressable>
                )}
                {storage !== undefined && <StorageIndicator storage={storage} />}
                <GroupModal
                    modalVisible={this.state.modalVisible}
                    id={group.id}
                    hideModal={() => this.setState({modalVisible: false})}
                />
            </Pressable>
        );
    }
}

const s = StyleSheet.create({
    groupItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    nameContainer: {
        marginLeft: 12,
        borderColor: 'lightgrey',
        justifyContent: 'center',
    },
    displayName: {
        fontSize: 15,
        fontWeight: 'bold',
    },
    circle: {
        backgroundColor: colors.primary,
        width: 8,
        height: 8,
        borderRadius: 8,
        marginRight: 8,
        marginLeft: 2,
    },
    checkIcon: {
        marginRight: 8,
    },
});

export default GroupItem;
