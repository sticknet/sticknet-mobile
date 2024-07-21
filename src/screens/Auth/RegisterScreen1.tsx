import React, {Component, createRef} from 'react';
import {View, Text, Platform, StatusBar, TextInput, Keyboard, StyleSheet, KeyboardEvent} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import type {NavigationProp, RouteProp} from '@react-navigation/native';
import {Button} from '../../components';
import {auth} from '../../actions/index';
import {globalData} from '../../actions/globalVariables';
import type {HomeStackParamList} from '../../navigators/types';

const connector = connect(null, {...auth});

type ReduxProps = ConnectedProps<typeof connector>;

type Props = ReduxProps & {
    navigation: NavigationProp<HomeStackParamList, 'Register1'>;
    route: RouteProp<HomeStackParamList, 'Register1'>;
};

interface State {
    name: string;
    keyboardHeight: number;
}

class RegisterScreen1 extends Component<Props, State> {
    private input = createRef<TextInput>();

    private keyboardDidShowListener?: {remove: () => void};

    private navListener?: () => void;

    constructor(props: Props) {
        super(props);
        this.state = {
            name: '',
            keyboardHeight: 0,
        };
    }

    componentDidMount() {
        this.keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', this.keyboardDidShow);
        this.navListener = this.props.navigation.addListener('focus', () => {
            if (Platform.OS === 'android') {
                changeNavigationBarColor('#000000');
                StatusBar.setBackgroundColor('#fff');
            }
            globalData.initialRoute = this.props.route.name;
            this.input.current?.focus();
        });
    }

    componentWillUnmount() {
        this.keyboardDidShowListener?.remove();
        this.navListener?.();
    }

    keyboardDidShow = (e: KeyboardEvent) => {
        this.setState({keyboardHeight: Platform.OS === 'ios' ? e.endCoordinates.height : 0});
    };

    next = () => {
        if (this.state.name.length > 0)
            this.props.navigation.navigate({
                name: 'Register2',
                params: {
                    ...this.props.route.params,
                    name: this.state.name,
                },
                merge: true,
            });
    };

    render() {
        return (
            <View style={{flex: 1, padding: 12, paddingLeft: 20}}>
                <Text style={s.create}>What's your name?</Text>
                <TextInput
                    placeholder="Full name"
                    placeholderTextColor="silver"
                    ref={this.input}
                    onChangeText={(name) => this.setState({name})}
                    selectionColor="#6060FF"
                    autoFocus
                    value={this.state.name}
                    style={s.input}
                    maxLength={25}
                    testID="name-input"
                />
                <View style={{position: 'absolute', bottom: this.state.keyboardHeight + 16, left: 20}}>
                    <View style={s.dots}>
                        <View style={[s.dot, {backgroundColor: '#6060FF'}]} />
                        <View style={s.dot} />
                    </View>
                    <Button onPress={this.next} text="Next" width={w('90%')} testID="continue" />
                </View>
            </View>
        );
    }
}

const s = StyleSheet.create({
    create: {
        fontSize: 40,
        fontWeight: 'bold',
        color: '#0F0F28',
    },
    input: {
        fontSize: 32,
        color: '#0F0F28',
        paddingTop: 16,
    },
    dots: {
        flexDirection: 'row',
        width: 70,
        justifyContent: 'space-around',
        alignSelf: 'center',
    },
    dot: {
        width: 16,
        height: 16,
        borderRadius: 8,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#6060FF',
    },
});

export default connector(RegisterScreen1);
