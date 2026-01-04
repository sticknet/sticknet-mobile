import {Platform, StyleSheet} from 'react-native';
import {isIphoneXD} from '@/src/utils';
import {colors} from '@/src/foundations';

const s = StyleSheet.create({
    // HOME
    stiiick: {
        fontSize: 32,
        fontFamily: 'SirinStencil-Regular',
    },
    iii: {
        color: '#6060FF',
        fontFamily: 'Sticknet',
    },
    buttonContainer: {
        marginRight: 8,
        borderRadius: 20,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#6060FF',
    },

    // GROUPS
    headerTitle: {
        fontSize: Platform.OS === 'ios' ? 18 : 24,
        fontWeight: Platform.OS === 'ios' ? '600' : 'normal',
    },
    groupOptionsContainer: {
        flexDirection: 'row',
    },

    // CREATE
    sendContainer: {
        width: 32,
        height: 32,
        borderRadius: 20,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // CHAT
    plusContainer: {
        flexDirection: 'row',
        borderColor: '#0F0F28',
        borderRadius: 20,
        borderWidth: StyleSheet.hairlineWidth,
        padding: 4,
        paddingHorizontal: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    newText: {
        color: '#0F0F28',
        marginRight: 8,
        fontSize: 15,
        fontWeight: '600',
    },
    backContainer: {
        flexDirection: 'row',
    },
    displayName: {
        fontWeight: 'bold',
        maxWidth: 260,
        bottom: isIphoneXD ? 6.5 : 0,
    },

    // Profile
    settings: {
        width: 30,
    },
});

export default s;
