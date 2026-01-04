import React, {Component} from 'react';
import {connect} from 'react-redux';
import Modal from 'react-native-modal';
import {Alert, TouchableOpacity, View, SafeAreaView, StyleSheet} from 'react-native';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import MaterialIcon from '@expo/vector-icons/MaterialIcons';
import {users} from '@/src/actions';
import ReportModal from './ReportModal';
import Icon from '@/src/components/Icons/Icon';
import Text from '@/src/components/Text';
import type {TUser} from '@/src/types';
import type {IUsersActions} from '@/src/actions/users';

interface ConnectionModalProps extends IUsersActions {
    modalVisible: boolean;
    user: TUser;
    hideModal: () => void;
    navigation: any;
    route: any;
}

interface ConnectionModalState {
    reportModalVisible: boolean;
}

class ConnectionModal extends Component<ConnectionModalProps, ConnectionModalState> {
    state: ConnectionModalState = {
        reportModalVisible: false,
    };

    block = () => {
        Alert.alert('Block Account', `Are you sure you want to block ${this.props.user.name}?`, [
            {text: 'Cancel', onPress: this.props.hideModal, style: 'cancel'},
            {
                text: 'Block',
                onPress: async () => {
                    this.props.hideModal();
                    this.props.blockUser({
                        user: this.props.user,
                        callback: () => {
                            if (this.props.route.name.includes('OtherProfile')) {
                                this.props.navigation.navigate({name: 'Profile', merge: true});
                            }
                        },
                    });
                },
                style: 'destructive',
            },
        ]);
    };

    report = () => {
        this.props.hideModal();
        setTimeout(() => this.setState({reportModalVisible: true}), 500);
    };

    remove = () => {
        Alert.alert(
            'Remove Connection',
            `Are you sure you want to remove ${this.props.user.name} from your connections?`,
            [
                {text: 'Cancel', onPress: this.props.hideModal, style: 'cancel'},
                {
                    text: 'Remove',
                    onPress: async () => {
                        this.props.hideModal();
                        this.props.removeConnection({user: this.props.user});
                    },
                    style: 'destructive',
                },
            ],
        );
    };

    viewProfile = () => {
        this.props.hideModal();
        this.props.navigation.navigate('OtherProfile', {user: this.props.user});
    };

    render() {
        const {modalVisible, hideModal} = this.props;
        return (
            <View>
                <ReportModal
                    reportUser={(reason: string) => this.props.reportUser({toUserId: this.props.user.id, reason})}
                    isVisible={this.state.reportModalVisible}
                    type="user"
                    hideModal={() => this.setState({reportModalVisible: false})}
                />
                <Modal
                    isVisible={modalVisible}
                    useNativeDriver
                    hideModalContentWhileAnimating
                    onBackdropPress={hideModal}
                    onBackButtonPress={hideModal}
                    style={s.bottomModal}
                    backdropOpacity={0.5}
                >
                    <SafeAreaView style={s.modal}>
                        <TouchableOpacity activeOpacity={1} style={s.button} onPress={this.viewProfile}>
                            <Icon name="user" size={22} style={s.icon} />
                            <Text style={s.text}>View profile</Text>
                        </TouchableOpacity>
                        <TouchableOpacity activeOpacity={1} style={s.button} onPress={this.remove}>
                            <Icon name="user-minus" size={22} style={s.icon} />
                            <Text style={s.text}>Remove connection</Text>
                        </TouchableOpacity>
                        <TouchableOpacity activeOpacity={1} style={s.button} onPress={this.report}>
                            <MaterialIcon name="report" size={24} style={s.icon} />
                            <Text style={s.text}>Report</Text>
                        </TouchableOpacity>
                        <TouchableOpacity activeOpacity={1} style={s.button} onPress={this.block}>
                            <MaterialIcon color="red" name="block" size={24} style={s.icon} />
                            <Text style={[s.text, {color: 'red'}]}>Block</Text>
                        </TouchableOpacity>
                    </SafeAreaView>
                </Modal>
            </View>
        );
    }
}

const s = StyleSheet.create({
    bottomModal: {
        justifyContent: 'flex-end',
        margin: 0,
        alignSelf: 'center',
    },
    modal: {
        width: w('100%'),
        backgroundColor: 'white',
        borderTopRightRadius: 20,
        borderTopLeftRadius: 20,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    button: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: 'lightgrey',
        padding: 16,
        width: w('100%'),
        flexDirection: 'row',
    },
    text: {
        fontSize: 15,
        textAlign: 'center',
    },
    icon: {
        marginRight: 20,
    },
});

export default connect(null, {...users})(ConnectionModal);
