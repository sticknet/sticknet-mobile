import React, {useState, useEffect, FC} from 'react';
import {View, StyleSheet, Pressable, FlatList} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import {heightPercentageToDP as h} from 'react-native-responsive-screen';
import BottomModal from './BottomModal';
import Text from '../Text';
import {app} from '../../actions';
import {Separator, UserItem} from '../index';
import type {IApplicationState, TTarget, TUser} from '../../types';

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromRedux;

const ReactionsModal: FC<Props> = (props) => {
    const {reactionsModal} = props;
    const {isVisible, message, index} = reactionsModal;
    const [selectedIndex, setSelectedIndex] = useState(index);

    useEffect(() => {
        setSelectedIndex(index);
    }, [index]);

    if (!message) return null;

    const {reactions} = message;

    const hide = () => {
        props.toggleReactionsModal({isVisible: false});
        setTimeout(() => props.toggleReactionsModal({message: null}), 300);
    };

    const renderUser = (item: {item: string}) => {
        const userId = item.item;
        const user =
            userId === props.user.id
                ? props.user
                : !props.isGroup
                ? props.connections[userId] || props.users[userId]
                : props.members[userId]
                ? props.members[userId]
                : null;

        if (!user) return null;

        return <UserItem item={{item: user}} />;
    };

    return (
        <BottomModal isVisible={isVisible} hideModal={hide} style={{height: h('50%')}}>
            <View style={s.container}>
                {Object.entries(reactions!).map((entry, idx) => {
                    const reaction = entry[0];
                    return (
                        <Pressable
                            key={reaction}
                            onPress={() => setSelectedIndex(idx)}
                            style={{
                                ...s.reactionContainer,
                                backgroundColor: selectedIndex === idx ? 'rgba(128,128,128,0.2)' : 'transparent',
                            }}>
                            <Text>{reaction}</Text>
                            <Text style={{marginLeft: 8, fontWeight: '600', color: 'rgb(85,85,85)'}}>
                                {Object.keys(entry[1]).length}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
            <FlatList
                data={Object.values(Object.entries(reactions!)[selectedIndex][1])}
                ItemSeparatorComponent={() => <Separator />}
                renderItem={renderUser}
                contentContainerStyle={{padding: 12}}
            />
        </BottomModal>
    );
};

const s = StyleSheet.create({
    container: {
        flexDirection: 'row',
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderColor: 'lightgrey',
        paddingHorizontal: 20,
        paddingBottom: 12,
    },
    reactionContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        padding: 6,
        borderRadius: 8,
        marginRight: 12,
        flexDirection: 'row',
        marginTop: 8,
    },
});

const mapStateToProps = (state: IApplicationState) => {
    return {
        reactionsModal: state.appTemp.reactionsModal,
        members: state.members[(state.app.currentTarget as TTarget).id],
        connections: state.connections,
        users: state.users,
        user: state.auth.user as TUser,
        isGroup: (state.app.currentTarget as TTarget).isGroup,
    };
};

const connector = connect(mapStateToProps, {...app});

export default connector(ReactionsModal);
