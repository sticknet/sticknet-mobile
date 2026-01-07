import {
    View,
    StyleSheet,
    Keyboard,
    Platform,
    KeyboardEvent,
    TextInputSubmitEditingEventData,
    NativeSyntheticEvent,
} from 'react-native';
import React, {useState, useEffect} from 'react';
import {connect} from 'react-redux';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import {SearchBar, Text, ActionButton, Icon, Button} from '@/src/components';
import {URL} from '@/src/actions/URL';
import {users} from '@/src/actions';
import type {IApplicationState, TUser} from '@/src/types';
import type {IUsersActions} from '@/src/actions/types';

const buttonId = 'send-connection-request';

interface AddConnectionsScreenProps extends IUsersActions {
    user: TUser;
}

export const AddConnectionsScreen = (props: AddConnectionsScreenProps) => {
    const [input, setInput] = useState('');
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', keyboardDidShow);
        const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', keyboardDidHide);

        return () => {
            props.clearUsersSearch();
            keyboardDidShowListener.remove();
            keyboardDidHideListener.remove();
        };
    }, []);

    const keyboardDidShow = (e: KeyboardEvent) => {
        setKeyboardHeight(Platform.OS === 'ios' ? e.endCoordinates.height : 0);
    };

    const keyboardDidHide = () => {
        setKeyboardHeight(0);
    };

    const search = (query: string) => {
        setInput(query);
    };

    const cancelSearch = () => {
        setInput('');
        props.clearUsersSearch();
    };

    const onSubmit = (e: NativeSyntheticEvent<TextInputSubmitEditingEventData>) =>
        props.searchUsers({currentUrl: `${URL}/api/search/?q=${e.nativeEvent.text}&limit=15`});

    return (
        <View style={{flex: 1}}>
            <View style={s.buttonsContainer}>
                <ActionButton
                    onPress={() => props.connectLink({share: true})}
                    text="Share Invite"
                    icon={<Icon regular name="share-from-square" size={15} />}
                />
                <ActionButton
                    onPress={() => props.connectLink({share: false})}
                    text="Copy Link"
                    icon={<Icon regular name="link" size={15} />}
                    style={{marginLeft: 12}}
                />
            </View>
            <Text style={s.title}>Add by Username</Text>
            <SearchBar
                placeholder="Enter a username"
                input={input}
                onChangeText={search}
                cancelSearch={cancelSearch}
                onSubmit={onSubmit}
                noIcon
                autoFocus
                enterKeyHint="send"
                testID="username-input"
            />
            <Text style={s.usernameText}>
                Your username is <Text style={{...s.usernameText, fontWeight: '500'}}>{props.user.username}</Text>
            </Text>
            <Button
                onPress={() => {
                    Keyboard.dismiss();
                    props.sendConnectionRequest({
                        currentUser: props.user,
                        username: input,
                        buttonId,
                        callback: () => setInput(''),
                    });
                }}
                text="Send Connection Request"
                width={w('90%')}
                testID="send"
                id={buttonId}
            />
        </View>
    );
};

const s = StyleSheet.create({
    buttonsContainer: {
        flexDirection: 'row',
        marginTop: 12,
        marginBottom: 8,
        marginLeft: 12,
    },
    title: {
        fontSize: 17,
        fontWeight: 'bold',
        marginLeft: 12,
        marginTop: 20,
        marginBottom: 8,
    },
    usernameText: {
        marginLeft: 12,
        fontSize: 12,
        marginTop: 8,
    },
});

const mapStateToProps = (state: IApplicationState) => {
    return {
        users: Object.values(state.users),
        noUsersFound: state.app.noUsersFound,
        user: state.auth.user as TUser,
    };
};

export default connect(mapStateToProps, {...users})(AddConnectionsScreen);
