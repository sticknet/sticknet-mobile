import React, {FC} from 'react';
import {View, StyleSheet, Pressable, ViewStyle} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import Icon from '../Icons/Icon';
import Text from '../Text';
import {colors} from '../../foundations';
import AnimatedButton from '../AnimatedButton';
import Sticknet from '../Sticknet';
import {nav} from '../../utils';
import CloudVaultIcon from '../Icons/CloudVaultIcon';
import type {IApplicationState} from '../../types';
import type {ChatStackParamList} from '../../navigators/types';

const oneGb = 1073741824;
const vaultColor = 'rgb(253,59,48)';
const chatsColor = 'rgb(253,202,0)';
const emptyColor = 'rgb(230,230,230)';

interface StorageMeterOwnProps {
    style?: ViewStyle;
    context: string;
}

type PropsFromRedux = ConnectedProps<typeof connector>;

type Props = PropsFromRedux & StorageMeterOwnProps;

const StorageMeter: FC<Props> = ({user, isBasic, style, context}) => {
    const navigation = useNavigation<NavigationProp<ChatStackParamList>>();
    if (!user || user.vaultStorage === undefined || user.chatStorage === undefined) return null;
    const isDetails = context === 'details';
    const storageUsed = user.vaultStorage + user.chatStorage;
    const max = isBasic ? oneGb : oneGb * 2000;
    const vaultStorage = (user.vaultStorage / oneGb).toFixed(2);
    const chatStorage = (user.chatStorage / oneGb).toFixed(2);
    const vaultPercentage = user.vaultStorage / max;
    const chatPercentage = user.chatStorage / max;
    const storageUsedGb = storageUsed / oneGb;
    const cardMargins = 66;
    const barWidth = w('100%') - cardMargins;
    const vaultBarWidth = vaultPercentage > 0 ? Math.max(barWidth * vaultPercentage, 1.5) : 0;
    const chatBarWidth = chatPercentage > 0 ? Math.max(barWidth * chatPercentage, 1.5) : 0;
    const emptyBarWidth = barWidth - vaultBarWidth - chatBarWidth;

    return (
        <View style={[s.card, style]}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <CloudVaultIcon />
                    <Text> CloudVault</Text>
                </View>
                <Text>
                    {storageUsedGb.toFixed(2)} GB of {max / oneGb} GB used
                </Text>
            </View>
            <View style={{...s.barContainer, width: vaultBarWidth + chatBarWidth + emptyBarWidth}}>
                {isDetails ? (
                    <>
                        <View style={{...s.bar, width: vaultBarWidth, backgroundColor: vaultColor}} />
                        {vaultBarWidth > 0 && <View style={{width: 1}} />}
                        <View style={{...s.bar, width: chatBarWidth, backgroundColor: chatsColor}} />
                        {chatBarWidth > 0 && <View style={{width: 1}} />}
                    </>
                ) : (
                    <>
                        <View
                            style={{...s.bar, width: vaultBarWidth + chatBarWidth, backgroundColor: colors.primary}}
                        />
                        {vaultBarWidth + chatBarWidth > 0 && <View style={{width: 1}} />}
                    </>
                )}
                <View style={{...s.bar, width: emptyBarWidth, backgroundColor: 'rgb(230,230,230)'}} />
            </View>
            {context === 'details' ? (
                <>
                    <View style={{...s.infoContainer, marginTop: 0}}>
                        <View style={{...s.circle, backgroundColor: vaultColor}} />
                        <Text style={s.infoText}> Vault: {vaultStorage} GB</Text>
                    </View>
                    <View style={s.infoContainer}>
                        <View style={{...s.circle, backgroundColor: chatsColor}} />
                        <Text style={s.infoText}> Chats: {chatStorage} GB</Text>
                    </View>
                    <View style={s.infoContainer}>
                        <View style={{...s.circle, backgroundColor: emptyColor}} />
                        <Text style={s.infoText}>
                            Free space: {(max / oneGb - parseFloat(vaultStorage) - parseFloat(chatStorage)).toFixed(2)}{' '}
                            GB
                        </Text>
                    </View>
                </>
            ) : (
                <View style={s.buttonsContainer}>
                    {isBasic ? (
                        <AnimatedButton
                            style={{paddingLeft: 20, paddingRight: 20}}
                            textStyle={{fontSize: 15}}
                            containerStyle={{marginTop: 0}}
                            colors={[colors.secondaryB, colors.secondaryA]}
                            text="Upgrade"
                            onPress={() => nav(navigation, 'SticknetPremium')}
                        />
                    ) : (
                        <Pressable onPress={() => nav(navigation, 'SticknetPremium')}>
                            <Text>
                                <Sticknet fontSize={15} /> <Text style={{fontWeight: '500'}}>Premium</Text>
                            </Text>
                        </Pressable>
                    )}
                    <Pressable
                        onPress={() => navigation.navigate('ManageStorage')}
                        style={{flexDirection: 'row', alignItems: 'center'}}
                        testID="manage-storage">
                        <Text style={{color: 'grey'}}>Storage</Text>
                        <Icon solid style={{marginLeft: 4}} name="chevron-right" size={15} color="darkgrey" />
                    </Pressable>
                </View>
            )}
        </View>
    );
};

const s = StyleSheet.create({
    barContainer: {
        flexDirection: 'row',
        marginVertical: 12,
        borderRadius: 8,
        overflow: 'hidden',
    },
    bar: {
        height: 20,
    },
    card: {
        padding: 20,
        backgroundColor: '#ffffff',
        shadowColor: '#0F0F28',
        shadowOffset: {width: 0, height: 2},
        shadowOpacity: 0.4,
        shadowRadius: 3.84,
        elevation: 5,
        borderRadius: 16,
        justifyContent: 'center',
    },
    infoContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    circle: {
        width: 8,
        height: 8,
        borderRadius: 8,
    },
    infoText: {
        fontSize: 12.5,
    },
    buttonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
});

const mapStateToProps = (state: IApplicationState) => ({
    user: state.auth.user,
    isBasic: !state.auth.user || state.auth.user.subscription === 'basic',
});

const connector = connect(mapStateToProps);

export default connector(StorageMeter);
