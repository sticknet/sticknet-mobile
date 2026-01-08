import {StyleSheet, View, ScrollView} from 'react-native';
import React, {FC} from 'react';
import {connect, ConnectedProps} from 'react-redux';
import Modal from 'react-native-modal';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import {app} from '@/src/actions';
import Post from './index';
import {IApplicationState} from '@/src/types';

type ReduxProps = ConnectedProps<typeof connector>;

type Props = ReduxProps;

const RepliedModal: FC<Props> = (props) => {
    const {repliedModal} = props;
    if (!repliedModal) return null;

    const {isVisible, roomId, messageId} = repliedModal;

    const hide = () => {
        props.dispatchAppTempProperty({repliedModal: {isVisible: false, roomId, messageId}});
        setTimeout(() => props.dispatchAppTempProperty({repliedModal: {isVisible: false}}), 300);
    };

    return (
        <Modal
            isVisible={isVisible}
            useNativeDriver
            hideModalContentWhileAnimating
            animationIn="zoomIn"
            animationOut="zoomOut"
            backdropOpacity={0.3}
            onBackButtonPress={hide}
            onBackdropPress={hide}
        >
            <View>
                <ScrollView style={s.modal} contentContainerStyle={{paddingBottom: 12}}>
                    {roomId && messageId && <Post roomId={roomId} messageId={messageId} />}
                </ScrollView>
            </View>
        </Modal>
    );
};

const s = StyleSheet.create({
    modal: {
        width: w('90%'),
        backgroundColor: 'white',
        borderRadius: 20,
    },
});

const mapStateToProps = (state: IApplicationState) => ({
    repliedModal: state.appTemp.repliedModal,
});

const connector = connect(mapStateToProps, {...app});

export default connector(RepliedModal);
