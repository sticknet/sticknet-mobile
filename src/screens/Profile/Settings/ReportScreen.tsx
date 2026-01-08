import React, {Component} from 'react';
import {StatusBar, View, StyleSheet} from 'react-native';
import {connect} from 'react-redux';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import {NavigationProp} from '@react-navigation/native';
import {globalData} from '@/src/actions/globalVariables';
import {Input} from '@/src/components/index';
import {profile} from '@/src/actions/index';
import type {IApplicationState, TUser} from '@/src/types';
import type {ProfileStackParamList} from '@/src/navigators/types';
import {IProfileActions} from '@/src/actions/profile';

// Define the props for the component
interface ReportScreenProps extends IProfileActions {
    navigation: NavigationProp<ProfileStackParamList>;
    user: TUser | null;
}

// Define the state for the component
interface ReportScreenState {
    text: string;
}

class ReportScreen extends Component<ReportScreenProps, ReportScreenState> {
    navListener: any;

    constructor(props: ReportScreenProps) {
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
                    this.props.sendSupportMessage({
                        userId: this.props.user!.id,
                        text: this.state.text,
                        report: true,
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
            <View style={s.container}>
                <Input
                    label="Explain what went wrong"
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
    container: {
        alignItems: 'center',
    },
    input: {
        marginTop: 24,
    },
});

// Map state to props
const mapStateToProps = (state: IApplicationState) => ({
    user: state.auth.user,
});

export default connect(mapStateToProps, {...profile})(ReportScreen);
