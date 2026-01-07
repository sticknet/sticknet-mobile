import React, {FC, ReactNode} from 'react';
import {Platform, SafeAreaView, StyleSheet, View, ViewStyle} from 'react-native';
import Modal from 'react-native-modal';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import {isIphoneXD} from '@/src/utils';
import {globalData} from '@/src/actions/globalVariables';

interface BottomModalProps {
    isVisible: boolean;
    hideModal?: () => void;
    style?: ViewStyle;
    children: ReactNode;
}

const BottomModal: FC<BottomModalProps> = (props) => {
    return (
        <Modal
            style={s.bottomModal}
            useNativeDriver
            hideModalContentWhileAnimating
            isVisible={props.isVisible}
            onBackButtonPress={props.hideModal}
            onBackdropPress={props.hideModal}
            backdropOpacity={0.5}
        >
            <SafeAreaView>
                <View style={[s.modal, props.style, Platform.OS === 'android' && {marginBottom: globalData.bottomBarHeight}]}>{props.children}</View>
            </SafeAreaView>
            {isIphoneXD && <View style={{backgroundColor: '#fff', width: w('100%'), height: 40}} />}
        </Modal>
    );
};

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
        paddingTop: 4,
    },
});

export default BottomModal;
