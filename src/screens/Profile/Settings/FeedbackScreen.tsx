import React, {Component} from 'react';
import {StatusBar, View} from 'react-native';
import {NavigationProp} from '@react-navigation/native';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import {connect} from 'react-redux';
import {Input} from '../../../components/index';
import {globalData} from '../../../actions/globalVariables';
import {profile} from '../../../actions/index';
import type {IApplicationState, TUser} from '../../../types';
import type {ProfileStackParamList} from '../../../navigators/types';
import type {IProfileActions} from '../../../actions/profile';

interface FeedbackScreenProps extends IProfileActions {
    navigation: NavigationProp<ProfileStackParamList>;
    user: TUser;
}

interface FeedbackScreenState {
    text: string;
}

class FeedbackScreen extends Component<FeedbackScreenProps, FeedbackScreenState> {
    navListener: any;

    constructor(props: FeedbackScreenProps) {
        super(props);
        this.state = {
            text: '',
        };
    }

    componentDidMount() {
        this.props.navigation.setParams({
            sendFeedback: () => {},
            color: 'silver',
        });
        this.navListener = this.props.navigation.addListener('focus', () => {
            StatusBar.setBarStyle('dark-content', true);
        });
    }

    componentWillUnmount() {
        this.navListener();
        globalData.hideTabBar = false;
    }

    onChangeText = (text: string) => {
        if (text !== '') {
            this.props.navigation.setParams({
                color: '#6060FF',
                sendFeedback: () =>
                    this.props.sendSupportMessage({
                        userId: this.props.user.id,
                        text: this.state.text,
                        report: false,
                        callback: () => this.props.navigation.navigate('Profile', {}),
                    }),
            });
        } else {
            this.props.navigation.setParams({
                color: 'silver',
                sendFeedback: () => {},
            });
        }
        this.setState({text});
    };

    render() {
        return (
            <View style={{alignItems: 'center'}}>
                <Input
                    label="Tell us what you like, or any suggestions"
                    onChangeText={this.onChangeText}
                    value={this.state.text}
                    multiline
                    width={w('90%')}
                    multiHeight={240}
                    style={{marginTop: 24}}
                    focus
                />
            </View>
        );
    }
}

const mapStateToProps = (state: IApplicationState) => ({
    user: state.auth.user as TUser,
});

export default connect(mapStateToProps, {...profile})(FeedbackScreen);
