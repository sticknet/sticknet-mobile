import React, {Component} from 'react';
import {View, FlatList, Alert, StatusBar, Platform, Linking, StyleSheet} from 'react-native';
import {connect} from 'react-redux';
import {NavigationProp} from '@react-navigation/native';

import {SettingsItem, Text, Icon} from '../../../components';
import {auth, profile, app, stickRoom} from '../../../actions/index';
import {URL} from '../../../actions/URL';
import {colors} from '../../../foundations';
import {nav} from '../../../utils';
import type {IApplicationState} from '../../../types';
import type {ProfileStackParamList} from '../../../navigators/types';
import {IAuthActions} from '../../../actions/auth';
import {IProfileActions} from '../../../actions/profile';

interface SettingsScreenProps extends IAuthActions, IProfileActions {
    navigation: NavigationProp<ProfileStackParamList>;
    version: string;
}

class SettingsScreen extends Component<SettingsScreenProps> {
    navListener: any;

    componentDidMount() {
        this.navListener = this.props.navigation.addListener('focus', () => {
            setTimeout(() => this.props.navigation.setParams({tabBarVisible: true}), 278);
            StatusBar.setBarStyle('dark-content', true);
            if (Platform.OS === 'android') {
                StatusBar.setBackgroundColor('#fff', true);
            }
        });
    }

    componentWillUnmount() {
        this.navListener();
    }

    renderItem = ({item}: {item: any}) => <SettingsItem item={item} />;

    logout = async () => {
        this.props.logout({
            callback: async () => {
                await this.props.navigation.navigate('HomeTab', {screen: 'Authentication', merge: true});
                this.props.navigation.reset({index: 0, routes: [{name: 'Profile'}]});
                this.props.navigation.reset({index: 0, routes: [{name: 'Authentication'}]});
            },
        });
    };

    alert = () => {
        Alert.alert('Log Out', 'Are you sure you want to log out?', [
            {text: 'Cancel', style: 'cancel'},
            {
                text: 'Log Out',
                style: 'destructive',
                onPress: this.logout,
            },
        ]);
    };

    footer = () => {
        return (
            <View style={{backgroundColor: '#f3f3f3'}}>
                <Text style={{color: 'grey', paddingLeft: 16}}>VERSION: {this.props.version}</Text>
                <Text style={{fontFamily: 'SirinStencil-Regular', alignSelf: 'center', fontSize: 20, marginTop: 12}}>
                    Sticknet
                </Text>
            </View>
        );
    };

    render() {
        const {navigate} = this.props.navigation;
        const data = [
            {
                text: 'Sticknet Premium',
                action: () => {
                    nav(this.props.navigation, 'SticknetPremium');
                },
                icon: <Icon name="gem" color={colors.black} />,
                separate: true,
            },
            {
                text: 'Connect a computer',
                action: () => navigate('Computer'),
                icon: <Icon name="desktop" />,
            },
            {
                text: 'Account',
                action: () => navigate('Account'),
                icon: <Icon name="user" />,
            },
            {
                text: 'Privacy',
                action: () => navigate('Privacy'),
                icon: <Icon name="lock" />,
                separate: true,
            },
            {
                text: 'Sticknet FAQ',
                action: () => Linking.openURL(`${URL}/faq`),
                icon: (
                    <View style={s.faqContainer}>
                        <Text style={s.faq}>FAQ</Text>
                    </View>
                ),
                type: 'link',
            },
            {
                text: 'Ask a Question',
                action: () => nav(this.props.navigation, 'Question'),
                icon: <Icon name="circle-question" />,
            },
            {
                text: 'Tell a Friend',
                action: () => this.props.invite(),
                icon: <Icon name="user-group" />,
                separate: true,
            },
            {
                text: 'Report a problem',
                action: () => nav(this.props.navigation, 'Report'),
                icon: <Icon name="hexagon-exclamation" />,
            },
            {
                text: 'Send feedback',
                action: () => nav(this.props.navigation, 'Feedback'),
                icon: <Icon name="message-pen" />,
            },
            {
                text: 'Privacy & Terms',
                action: () => Linking.openURL(`${URL}/legal`),
                icon: <Icon name="list" />,
                type: 'link',
                separate: true,
            },
            {
                text: 'Log Out',
                testID: 'log-out',
                footer: true,
                action: this.alert,
                icon: <Icon name="power-off" color="grey" />,
                separate: true,
                type: 'menu',
            },
        ];
        return (
            <FlatList
                testID="settings-screen"
                data={data}
                renderItem={this.renderItem}
                keyExtractor={(item) => item.text}
                ListFooterComponent={this.footer}
                ListFooterComponentStyle={{
                    flex: 1,
                    justifyContent: 'flex-end',
                    backgroundColor: '#f3f3f3',
                    paddingBottom: 20,
                }}
                contentContainerStyle={{flexGrow: 1}}
                initialNumToRender={15}
            />
        );
    }
}

const s = StyleSheet.create({
    faqContainer: {
        borderColor: colors.black,
        borderWidth: StyleSheet.hairlineWidth,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 40,
    },
    faq: {
        textAlign: 'center',
        fontSize: 7,
        fontWeight: 'bold',
    },
});

const mapStateToProps = (state: IApplicationState) => ({
    user: state.auth.user,
    version: state.app.version,
    groups: state.groups,
    messages: state.messages,
});

export default connect(mapStateToProps, {...auth, ...profile, ...app, ...stickRoom})(SettingsScreen);
