import React, {Component} from 'react';
import {TouchableOpacity, Text, View, StyleSheet} from 'react-native';
import Modal from 'react-native-modal';
import {connect, ConnectedProps} from 'react-redux';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';

import Input from '../Input';
import {arrayUnique} from '../../utils';
import {create} from '../../actions';
import {colors} from '../../foundations';
import type {IApplicationState, TUser} from '../../types';

interface User {
    id: string;
    name: string;
    username: string;
}

interface TextModalOwnProps {
    visible: boolean;
    onBackdropPress: () => void;
    backdropOpacity?: number;
    title?: string;
    placeholder?: string;
    lightTheme?: boolean;
    style?: object;
    testID?: string;
    multiline?: boolean;
    maxLength?: number;
    value: string;
    onChangeText: (text: string) => void;
    done: () => void;
}

type ReduxProps = ConnectedProps<typeof connector>;
type Props = ReduxProps & TextModalOwnProps;

interface State {
    mentions: User[];
    value: string;
    justMentioned: boolean;
    addedMentions: User[];
}

class TextModal extends Component<Props, State> {
    static defaultProps = {
        backdropOpacity: 0.7,
        title: 'Caption photo',
        placeholder: 'Write a caption...',
        lightTheme: true,
        multiline: true,
        style: {},
        maxLength: 100,
    };

    users: string[];

    constructor(props: Props) {
        super(props);
        this.users = [];
        this.state = {
            mentions: [],
            value: this.props.value,
            justMentioned: false,
            addedMentions: [],
        };
    }

    shouldComponentUpdate(nextProps: Props, nextState: State) {
        return (
            this.props.visible !== nextProps.visible ||
            this.state.mentions.toString() !== nextState.mentions.toString() ||
            this.state.value !== nextProps.value ||
            this.state.justMentioned !== nextState.justMentioned ||
            this.state.addedMentions !== nextState.addedMentions
        );
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: State) {
        if (prevState.justMentioned) return {justMentioned: false};
        return {value: nextProps.value};
    }

    onPress = async () => {
        let mentions: string[] = [];
        this.state.addedMentions.forEach((user) => {
            if (this.state.value.includes(user.username)) mentions.push(user.id);
        });
        mentions = arrayUnique(mentions);
        this.props.done();
    };

    onChangeText = (text: string) => {
        const words = text.split(' ').join(',').split('\n').join(',').split(',');
        let lastWord = words[words.length - 1];
        if (lastWord.length < 3 && !lastWord.startsWith('@') && this.state.mentions.length > 0)
            this.setState({mentions: []});
        else if (lastWord.length >= 3 || lastWord.startsWith('@')) {
            if (lastWord.startsWith('@')) lastWord = lastWord.substr(1);
            const {connections} = this.props;
            const mentions: User[] = [];
            Object.values(connections).forEach((user: User) => {
                if (
                    this.users.includes(user.id) &&
                    (user.name.toLowerCase().startsWith(lastWord.toLowerCase()) ||
                        user.username.startsWith(lastWord.toLowerCase())) &&
                    !text.includes(user.username)
                )
                    mentions.push(user);
            });
            this.setState({mentions});
        }
        this.props.onChangeText(text);
    };

    render() {
        const {visible, onBackdropPress, backdropOpacity, title, placeholder, lightTheme, style, testID, multiline} =
            this.props;
        let backgroundColor;
        let color;
        let borderWidth;
        let borderColor;
        let doneColor;
        if (lightTheme) {
            backgroundColor = '#fff';
            color = '#0F0F28';
            borderWidth = 0;
            borderColor = colors.black;
            doneColor = colors.black;
        } else {
            backgroundColor = '#0F0F28';
            color = '#fff';
            borderWidth = 1;
            borderColor = '#fff';
            doneColor = '#fff';
        }
        const {mentions} = this.state;
        return (
            <Modal
                avoidKeyboard
                isVisible={visible}
                useNativeDriver
                hideModalContentWhileAnimating
                backdropOpacity={backdropOpacity}
                onBackdropPress={onBackdropPress}
                onBackButtonPress={onBackdropPress}
                animationIn="fadeIn"
                animationOut="fadeOut">
                <View
                    style={[
                        s.modal,
                        {
                            backgroundColor,
                            borderWidth,
                            maxHeight: mentions.length === 0 ? 320 : 440,
                        },
                        style,
                    ]}>
                    <View style={s.headerContainer}>
                        <Text style={s.header}>{title}</Text>
                    </View>
                    <Input
                        testID={`${testID}-input`}
                        placeholder={placeholder}
                        maxLength={this.props.maxLength}
                        onChangeText={this.onChangeText}
                        value={this.state.value}
                        multiline={multiline}
                        width={w('80%')}
                        multiHeight={160}
                        style={{alignSelf: 'center', marginTop: 16, marginBottom: 16}}
                        focus
                    />
                    <TouchableOpacity testID={`${testID}-done`} style={[s.done, {borderColor}]} onPress={this.onPress}>
                        <Text style={[s.doneText, {color: doneColor}]}>Done</Text>
                    </TouchableOpacity>
                </View>
            </Modal>
        );
    }
}

const s = StyleSheet.create({
    modal: {
        width: w('90%'),
        borderRadius: 20,
        overflow: 'hidden',
        borderColor: '#fff',
    },
    headerContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.black,
    },
    header: {
        fontSize: 20,
        fontWeight: '500',
        padding: 8,
        color: '#fff',
    },
    done: {
        justifyContent: 'center',
        width: 100,
        fontSize: 16,
        borderRadius: 40,
        height: 32,
        alignSelf: 'center',
        borderWidth: StyleSheet.hairlineWidth,
        marginBottom: 16,
    },
    doneText: {
        textAlign: 'center',
        color: colors.black,
        fontSize: 16,
    },
});

const mapStateToProps = (state: IApplicationState) => {
    return {
        connections: state.connections,
        groups: state.groups,
        user: state.auth.user as TUser,
    };
};

const connector = connect(mapStateToProps, {...create});

export default connector(TextModal);
