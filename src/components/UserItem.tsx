import React, {PureComponent} from 'react';
import {connect} from 'react-redux';
import {Pressable, StyleSheet, TouchableOpacity, View, ViewStyle} from 'react-native';
import CheckIcon from '@sticknet/react-native-vector-icons/Feather';
import DotsIcon from '@sticknet/react-native-vector-icons/MaterialCommunityIcons';
import EntypoIcon from '@sticknet/react-native-vector-icons/Entypo';
import {NavigationProp, RouteProp} from '@react-navigation/native';
import ProfilePicture from './ProfilePicture';
import Text from './Text';
import ConnectionModal from './Modals/ConnectionModal';
import PremiumIcon from './Icons/PremiumIcon';
import {StorageIndicator} from './GroupItem';
import type {IApplicationState, TUser} from '@/src/types';

interface UserItemProps {
    item: TUser | {item: TUser};
    selected?: boolean | null;
    style?: ViewStyle;
    removable?: boolean;
    showOptions?: boolean;
    testID?: string;
    storage?: any;
    isSelf?: boolean;
    navigation?: NavigationProp<any>;
    route?: RouteProp<any, keyof any>;
    onPress?: () => void;
    removeUser?: () => void;
}

interface UserItemState {
    modalVisible: boolean;
}

class UserItem extends PureComponent<UserItemProps, UserItemState> {
    static defaultProps = {
        selected: null,
        removable: false,
        showOptions: false,
    };

    state: UserItemState = {
        modalVisible: false,
    };

    render() {
        const {item, selected, style, removable, removeUser, showOptions, testID, storage, isSelf} = this.props;
        const user = 'item' in item ? item.item : item;
        return (
            // @ts-ignore
            <Pressable onPress={this.props.onPress} testID={testID} style={[s.userContainer, style]}>
                <View style={s.ppContainer}>
                    <ProfilePicture user={user} size={48} isPreview />
                </View>
                <View style={s.userBox}>
                    <View style={{flex: 1, justifyContent: 'center'}}>
                        <Text style={{fontWeight: 'bold'}}>
                            {user.name}
                            {isSelf ? ' (You)' : ''}
                            {user.subscription && user.subscription !== 'basic' && (
                                <Text>
                                    {' '}
                                    <PremiumIcon size={14} />
                                </Text>
                            )}
                        </Text>
                        <Text style={{color: 'grey'}}>{user.username}</Text>
                    </View>
                    {selected !== null && (
                        <CheckIcon
                            name={selected ? 'check-circle' : 'circle'}
                            size={24}
                            color={selected ? '#6060FF' : 'lightgrey'}
                            style={s.checkIcon}
                        />
                    )}
                    {removable && (
                        <TouchableOpacity
                            style={s.checkIcon}
                            activeOpacity={1}
                            onPress={removeUser}
                            hitSlop={{left: 20, bottom: 8, top: 8, right: 8}}>
                            <EntypoIcon name="cross" color="silver" size={20} />
                        </TouchableOpacity>
                    )}
                    {showOptions && !isSelf && (
                        <Pressable
                            onPress={() => this.setState({modalVisible: true})}
                            hitSlop={{left: 10, right: 10, top: 10, bottom: 10}}>
                            <DotsIcon name="dots-horizontal" size={24} color="grey" />
                        </Pressable>
                    )}
                    {storage !== undefined && <StorageIndicator storage={storage} />}
                </View>
                <ConnectionModal
                    // @ts-ignore
                    navigation={this.props.navigation}
                    // @ts-ignore
                    route={this.props.route}
                    user={user}
                    modalVisible={this.state.modalVisible}
                    hideModal={() => this.setState({modalVisible: false})}
                />
            </Pressable>
        );
    }
}

const s = StyleSheet.create({
    userContainer: {
        flexDirection: 'row',
    },
    userBox: {
        marginLeft: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        flex: 1,
    },
    checkIcon: {
        marginRight: 8,
    },
    ppContainer: {
        alignItems: 'center',
    },
});

const mapStateToProps = (state: IApplicationState, ownProps: UserItemProps) => {
    const user = 'item' in ownProps.item ? ownProps.item.item : ownProps.item;
    return {
        user: state.auth.user as TUser,
        isSelf: user.id === (state.auth.user as TUser).id,
    };
};

const connector = connect(mapStateToProps, null);

export default connector(UserItem);
