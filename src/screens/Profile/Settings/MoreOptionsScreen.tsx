import React, {Component} from 'react';
import {View, Text, FlatList, StatusBar, Alert, StyleSheet} from 'react-native';
import {connect} from 'react-redux';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import Modal from 'react-native-modal';
import type {NavigationProp} from '@react-navigation/native';
import {auth, stickRoom, app} from '../../../actions';
import {SettingsItem, Icon} from '../../../components';
import type {IApplicationState, TUser} from '../../../types';
import type {ProfileStackParamList} from '../../../navigators/types';
import {IAuthActions} from '../../../actions/auth';

interface MoreOptionsScreenProps extends IAuthActions {
    navigation: NavigationProp<ProfileStackParamList>;
    user: TUser | null;
}

interface MoreOptionsScreenState {
    deactivateModal: boolean;
    deleteModal: boolean;
}

class MoreOptionsScreen extends Component<MoreOptionsScreenProps, MoreOptionsScreenState> {
    navListener: any;

    constructor(props: MoreOptionsScreenProps) {
        super(props);
        this.state = {
            deactivateModal: false,
            deleteModal: false,
        };
    }

    componentDidMount() {
        this.navListener = this.props.navigation.addListener('focus', () => {
            StatusBar.setBarStyle('dark-content', true);
        });
    }

    componentWillUnmount() {
        this.navListener();
    }

    logout = async () => {
        this.props.logout({
            callback: async () => {
                this.props.navigation.reset({index: 0, routes: [{name: 'Profile'}]});
                await this.props.navigation.navigate({name: 'Authentication', params: {auth: true}, merge: true});
                this.props.navigation.reset({index: 0, routes: [{name: 'Authentication', params: {loggedIn: true}}]});
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

    renderItem = ({item}: {item: any}) => <SettingsItem item={item} />;

    deactivate = () => {
        this.setState({deactivateModal: false}, () => {
            this.props.deactivate({
                callback: async () => {
                    this.props.navigation.reset({index: 0, routes: [{name: 'Profile'}]});
                    await this.props.navigation.navigate({name: 'Authentication', params: {auth: true}, merge: true});
                    this.props.navigation.reset({
                        index: 0,
                        routes: [{name: 'Authentication', params: {loggedIn: true}}],
                    });
                },
            });
        });
    };

    deactivateModal = () => {
        return (
            <Modal
                isVisible={this.state.deactivateModal}
                useNativeDriver
                hideModalContentWhileAnimating
                onBackdropPress={() => this.setState({deactivateModal: false})}
                onBackButtonPress={() => this.setState({deactivateModal: false})}>
                <View style={s.modal}>
                    <Text style={s.title}>Are you sure?</Text>
                    <Text style={s.text}>
                        You won't be able to access your files while your account is deactivated, and you will be hidden
                        from all your network.
                    </Text>
                    <Text style={s.text}>To reactivate your account, just login back.</Text>
                    <View style={s.buttonsContainer}>
                        <Text onPress={() => this.setState({deactivateModal: false})} style={s.button}>
                            Cancel
                        </Text>
                        <Text onPress={this.deactivate} style={[s.button, {color: 'red'}]}>
                            Deactivate
                        </Text>
                    </View>
                </View>
            </Modal>
        );
    };

    proceed = () => {
        this.setState({deleteModal: false});
        this.props.requestEmailCode({
            email: this.props.user!.email,
            callback: () => {
                this.props.navigation.navigate({
                    name: 'CodeDeleteAccount',
                    params: {method: 'email', authId: this.props.user!.email},
                    merge: true,
                });
            },
        });
    };

    deleteModal() {
        return (
            <Modal
                isVisible={this.state.deleteModal}
                useNativeDriver
                hideModalContentWhileAnimating
                onBackdropPress={() => this.setState({deleteModal: false})}
                onBackButtonPress={() => this.setState({deleteModal: false})}>
                <View style={s.modal}>
                    <Text style={s.title}>Are you sure?</Text>
                    <Text style={s.text}>
                        Deleting your account will delete all of its data forever. You can not revert back from this
                        action.
                    </Text>
                    <Text style={s.text}>
                        If you are willing to leave forever, you will need to confirm a{' '}
                        <Text style={{fontWeight: 'bold'}}>verification code</Text> and your{' '}
                        <Text style={{fontWeight: 'bold'}}>password</Text>.
                    </Text>

                    <View style={s.buttonsContainer}>
                        <Text onPress={() => this.setState({deleteModal: false})} style={s.button}>
                            Cancel
                        </Text>
                        <Text onPress={this.proceed} style={[s.button, {color: 'red'}]}>
                            Proceed
                        </Text>
                    </View>
                </View>
            </Modal>
        );
    }

    render() {
        const data = [
            {
                text: 'Log Out',
                description: null,
                action: this.alert,
                icon: <Icon name="power-off" />,
            },
            {
                text: 'Deactivate account',
                description: 'Temporarily hide your profile and data',
                action: () => this.setState({deactivateModal: true}),
                icon: <Icon name="door-closed" />,
            },
            {
                text: 'Delete account',
                description: 'Permanently delete your account and all of its data',
                action: () => this.setState({deleteModal: true}),
                icon: <Icon name="trash" />,
                separate: true,
            },
        ];
        return (
            <View>
                <FlatList data={data} renderItem={this.renderItem} keyExtractor={(item) => item.text} />
                {this.deactivateModal()}
                {this.deleteModal()}
            </View>
        );
    }
}

const s = StyleSheet.create({
    modal: {
        width: w('90%'),
        backgroundColor: 'white',
        borderRadius: 20,
        justifyContent: 'space-around',
        alignItems: 'center',
        padding: 20,
    },
    title: {
        fontWeight: 'bold',
        fontSize: 28,
    },
    text: {
        fontSize: 16,
        paddingTop: 24,
        textAlign: 'center',
    },
    buttonsContainer: {
        flexDirection: 'row',
    },
    button: {
        fontSize: 16,
        fontWeight: 'bold',
        padding: 12,
        borderRadius: 20,
        margin: 8,
    },
});

const mapStateToProps = (state: IApplicationState) => ({
    user: state.auth.user,
});

export default connect(mapStateToProps, {...auth, ...stickRoom, ...app})(MoreOptionsScreen);
