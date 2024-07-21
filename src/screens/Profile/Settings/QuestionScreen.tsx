import React, {Component} from 'react';
import {StatusBar, View, Text, Linking, StyleSheet} from 'react-native';
import {connect} from 'react-redux';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import {NavigationProp} from '@react-navigation/native';
import {Input} from '../../../components/index';
import {profile} from '../../../actions/index';
import {URL} from '../../../actions/URL';
import {globalData} from '../../../actions/globalVariables';
import type {IApplicationState} from '../../../types';
import type {ProfileStackParamList} from '../../../navigators/types';
import {IProfileActions} from '../../../actions/profile';

// Define the props for the component
interface QuestionScreenProps extends IProfileActions {
    navigation: NavigationProp<ProfileStackParamList>;
}

// Define the state for the component
interface QuestionScreenState {
    text: string;
}

class QuestionScreen extends Component<QuestionScreenProps, QuestionScreenState> {
    navListener: any;

    constructor(props: QuestionScreenProps) {
        super(props);
        this.state = {
            text: '',
        };
    }

    componentDidMount() {
        this.props.navigation.setParams({
            sendReport: () => {},
            color: 'silver',
        });
        this.navListener = this.props.navigation.addListener('focus', () => {
            StatusBar.setBarStyle('dark-content', true);
        });
    }

    componentWillUnmount() {
        if (this.navListener) this.navListener();
        globalData.hideTabBar = false;
    }

    onChangeText = (text: string) => {
        if (text !== '') {
            this.props.navigation.setParams({
                color: '#6060FF',
                sendReport: () =>
                    this.props.askQuestion({
                        text: this.state.text,
                        callback: () => this.props.navigation.navigate('Profile', {}),
                    }),
            });
        } else {
            this.props.navigation.setParams({
                color: 'silver',
                sendReport: () => {},
            });
        }
        this.setState({text});
    };

    render() {
        return (
            <View>
                <Text style={s.text}>
                    Have a question? Send us your query, and we will get back to you as soon as possible.
                </Text>
                <Text onPress={() => Linking.openURL(`${URL}/faq`)} style={s.text2}>
                    You can also check our
                    <Text style={{color: '#6060FF', padding: 4}}> FAQ</Text> section.
                </Text>
                <Input
                    label="Leave your question below"
                    onChangeText={this.onChangeText}
                    value={this.state.text}
                    multiline
                    width={w('90%')}
                    multiHeight={240}
                    style={s.input}
                    focus
                />
            </View>
        );
    }
}

const s = StyleSheet.create({
    text: {
        fontSize: 16,
        padding: 20,
        paddingBottom: 0,
    },
    text2: {
        fontSize: 16,
        textAlign: 'left',
        padding: 20,
        paddingRight: 0,
    },
    input: {
        alignSelf: 'center',
    },
});

const mapStateToProps = (state: IApplicationState) => ({
    user: state.auth.user,
});

export default connect(mapStateToProps, {...profile})(QuestionScreen);
