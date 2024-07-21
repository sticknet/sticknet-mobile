import Modal from 'react-native-modal';
import {Text, View, StyleSheet} from 'react-native';
import Icon from '@sticknet/react-native-vector-icons/Fontisto';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import React, {PureComponent} from 'react';
import {colors} from '../../foundations';

interface PendingModalProps {
    isVisible: boolean;
    hideModal: () => void;
    name: string;
}

class PendingModal extends PureComponent<PendingModalProps> {
    render() {
        return (
            <Modal
                isVisible={this.props.isVisible}
                useNativeDriver
                onBackdropPress={this.props.hideModal}
                hideModalContentWhileAnimating
                onBackButtonPress={this.props.hideModal}
                animationIn="fadeIn"
                animationOut="fadeOut">
                <View style={s.modal}>
                    <View style={s.headerContainer}>
                        <Text style={s.header}>Item Pending</Text>
                    </View>
                    <Icon name="locked" size={40} color="grey" />
                    <Text style={s.text}>
                        Cannot view this message now. Wait for{' '}
                        <Text style={{fontWeight: 'bold'}}>{this.props.name}</Text> to get online to be able to view
                        this message. This can happen if you have recently joined a new group.
                    </Text>
                </View>
            </Modal>
        );
    }
}

const s = StyleSheet.create({
    modal: {
        width: w('90%'),
        backgroundColor: 'white',
        borderRadius: 20,
        overflow: 'hidden',
        borderColor: '#fff',
        alignItems: 'center',
    },
    headerContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.black,
        width: w('90%'),
        marginBottom: 24,
    },
    header: {
        fontSize: 20,
        fontWeight: '500',
        padding: 8,
        color: '#fff',
    },
    text: {
        padding: 20,
        color: 'grey',
    },
});

export default PendingModal;
