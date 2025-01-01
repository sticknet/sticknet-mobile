import React, {useEffect} from 'react';
import {Text, View, TouchableOpacity, FlatList, StyleSheet, Platform} from 'react-native';
import {connect} from 'react-redux';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {deepLinkToSubscriptions} from 'react-native-iap';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import LottieView from 'lottie-react-native';
import XIcon from '@sticknet/react-native-vector-icons/Feather';
import {isIphoneX} from 'react-native-iphone-x-helper';
import type {NavigationProp} from '@react-navigation/native';
import {SmallLoading, Sticknet, Icon} from '../../../components';
import {premiumAnimation} from '../../../../assets/lottie';
import {iap} from '../../../actions/index';
import AnimatedButton from '../../../components/AnimatedButton';
import {colors} from '../../../foundations';
import {globalData} from '../../../actions/globalVariables';
import CloudVaultIcon from '../../../components/Icons/CloudVaultIcon';
import type {IApplicationState, TUser, TSubscription} from '../../../types';
import type {ProfileStackParamList} from '../../../navigators/types';
import type {IIAPActions} from '../../../actions/iap';

interface IAPScreenProps extends IIAPActions {
    navigation: NavigationProp<ProfileStackParamList>;
    subs: TSubscription[];
    user: TUser | null;
    platform: string;
    expiring: boolean | undefined;
}

const data = [
    {
        title: 'Bigger CloudVault space',
        icon: <CloudVaultIcon />,
        basic: '1 GB',
        premium: '2 TB (2000 GB)',
        vault: true,
    },
    {
        title: 'Bigger file uploads',
        icon: <Icon name="gauge" size={25} />,
        basic: '50 MB',
        premium: '50 GB',
    },
    {
        title: 'End-to-end encrypted notes',
        icon: <Icon name="notes" size={25} />,
        basic: '50 notes',
        premium: '5000 notes',
    },
    {
        title: 'Higher Group Limit',
        icon: <Icon name="users-medical" size={25} />,
        basic: '10 members',
        premium: '250 members',
    },
    {
        title: 'Profile Badge',
        icon: <Icon name="badge-check" solid size={25} color={colors.primary} />,
        basic: 'n/a',
        premium: 'Premium badge',
    },
];

const IAPScreen: React.FC<IAPScreenProps> = (props) => {
    useEffect(() => {
        if (!props.subs) props.fetchSubscriptions();
        props.fetchSubscriptionDetails();
        return () => {
            globalData.hideTabBar = false;
        };
    }, []);

    const insets = useSafeAreaInsets();

    const renderItem = ({item}: {item: (typeof data)[0]}) => (
        <View style={s.itemContainer}>
            <View style={{alignItems: 'center', marginBottom: 8}}>
                {item.icon}
                <Text style={{fontWeight: 'bold', marginTop: 8}}>{item.title}</Text>
            </View>
            <View>
                <Text style={{color: 'grey'}}>Basic: {item.basic}</Text>
                <Text>Premium: {item.premium}</Text>
            </View>
        </View>
    );

    const footer = () => (
        <View style={{paddingHorizontal: 12}}>
            {props.user && props.user.subscription !== 'basic' && !props.expiring ? (
                props.platform !== 'web' ? (
                    <Text
                        style={{
                            paddingVertical: 24,
                            textDecorationLine: 'underline',
                            textAlign: 'center',
                            color: 'grey',
                        }}
                        onPress={() => deepLinkToSubscriptions({sku: props.subs[0].productId})}>
                        Cancel subscription
                    </Text>
                ) : (
                    <Text style={{color: 'grey', textAlign: 'center', paddingVertical: 24}}>
                        You can manage your subscription through a computer from www.sticknet.org
                    </Text>
                )
            ) : null}
        </View>
    );

    const header = () => (
        <View style={s.iconsContainer}>
            <View style={[s.infoItem, {marginTop: 24}]}>
                <Icon name="shield-check" solid color={colors.success} space />
                <Text>End-to-end encrypted</Text>
            </View>
            <View style={s.infoItem}>
                <Icon name="shield-check" solid color={colors.success} space />
                <Text>Decentralized storage</Text>
            </View>
            {props?.subs[0]?.hasFreeTrial && Platform.OS === 'android' && (
                <View style={{marginTop: 12, marginHorizontal: 12}}>
                    <Text style={{color: 'grey'}}>
                        You can cancel anytime. You won't be charged until your 30-day trial has ended.
                    </Text>
                </View>
            )}
        </View>
    );

    const text = props.subs[0]
        ? props.subs[0].hasFreeTrial
            ? 'Try free for 30 days'
            : `Subscribe for ${props.subs[0].price} / month`
        : '';

    const paddingTop = isIphoneX() ? insets.top : insets.top + 12;

    return (
        <View style={{flex: 1, alignItems: 'center', paddingTop}}>
            <TouchableOpacity
                style={{alignSelf: 'flex-start', marginLeft: 12}}
                onPress={() => props.navigation.goBack()}>
                <XIcon name="x" color="#000" size={32} />
            </TouchableOpacity>
            {props.subs && props.subs.length > 0 ? (
                <>
                    <LottieView source={premiumAnimation} style={{width: w('18%')}} autoPlay />
                    <Text style={{fontSize: 28}}>
                        <Sticknet /> <Text style={{fontWeight: '500'}}>Premium</Text>
                    </Text>
                    <FlatList
                        data={data}
                        renderItem={renderItem}
                        ListHeaderComponent={header}
                        ListFooterComponent={footer}
                        contentContainerStyle={{
                            paddingBottom:
                                props.user && props.user.subscription === 'basic'
                                    ? props.subs[0] && props.subs[0].hasFreeTrial
                                        ? 120
                                        : 80
                                    : 20,
                            alignItems: Platform.OS === 'ios' || !props.subs[0]?.hasFreeTrial ? 'flex-start' : 'center',
                        }}
                        showsVerticalScrollIndicator={false}
                    />
                    {props.user && props.user.subscription === 'basic' && (
                        <View
                            style={{
                                position: 'absolute',
                                bottom: 0,
                                paddingBottom: insets.bottom || 12,
                                width: '100%',
                                justifyContent: 'center',
                                alignItems: 'center',
                                borderTopWidth: StyleSheet.hairlineWidth,
                                borderTopColor: 'lightgrey',
                                backgroundColor: '#fafafa',
                            }}>
                            {props.user && props.user.subscription === 'basic' && props.subs[0]
                                ? props.subs[0].hasFreeTrial && (
                                      <Text style={{marginTop: 12, textAlign: 'center', fontWeight: 'bold'}}>
                                          {props.subs[0].price} / month
                                      </Text>
                                  )
                                : null}
                            <AnimatedButton
                                marginTop={12}
                                style={{width: w('90%'), padding: 10}}
                                colors={['#6060FF', 'red']}
                                text={text}
                                onPress={() => props.requestSub({sub: props.subs[0]})}
                            />
                        </View>
                    )}
                </>
            ) : (
                <SmallLoading />
            )}
        </View>
    );
};

const s = StyleSheet.create({
    itemContainer: {
        padding: 8,
        borderRadius: 10,
        width: w('90%'),
        justifyContent: 'center',
        marginBottom: 12,
        backgroundColor: '#ffffff',
        marginHorizontal: 8,
        shadowColor: colors.primary,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        borderWidth: 0,
    },
    infoItem: {
        flexDirection: 'row',
        marginLeft: 24,
        marginTop: 12,
    },
    iconsContainer: {
        alignSelf: 'flex-start',
        width: '100%',
        paddingBottom: 12,
    },
});

const mapStateToProps = (state: IApplicationState) => ({
    subs: state.subs,
    user: state.auth.user,
    platform: state.app.subscription ? state.app.subscription.platform : '',
    expiring: state.auth.user?.subscriptionExpiring,
});

export default connect(mapStateToProps, {...iap})(IAPScreen);
