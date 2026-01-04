import {
    finishTransaction,
    getSubscriptions,
    Purchase,
    requestSubscription,
    SubscriptionIOS,
    SubscriptionAndroid,
} from 'react-native-iap';
import {Alert, Platform} from 'react-native';
import DeviceInfo from 'react-native-device-info';
import {Dispatch} from 'redux';
import {iap, progress, app, auth} from '@/src/actions/actionTypes';
import {globalData} from '@/src/actions/globalVariables';
import axios from '@/src/actions/myaxios';
import {URL} from '@/src/actions/URL';
import {TSubscription} from '@/src/types';

const bundleId = DeviceInfo.getBundleId();

export interface IIAPActions {
    fetchSubscriptions: () => void;
    fetchSubscriptionDetails: () => void;
    requestSub: (params: TRequestSubParams) => void;
    verifyReceipt: (params: TVerifyReceiptParams) => void;
}

export function fetchSubscriptions() {
    return async function (dispatch: Dispatch) {
        const skus = `${bundleId}.premium.1`;
        const subs = await getSubscriptions({skus: [skus]});
        const arr: TSubscription[] = [];

        subs.map((sub) => {
            let price: string;
            let hasFreeTrial: boolean;
            let offerToken: string | null = null;

            if (Platform.OS === 'ios') {
                const iosSub = sub as SubscriptionIOS;
                price = iosSub.localizedPrice;
                hasFreeTrial = !!(
                    iosSub.introductoryPriceNumberOfPeriodsIOS && iosSub.introductoryPriceNumberOfPeriodsIOS !== '0'
                );
            } else {
                const androidSub = sub as SubscriptionAndroid;
                offerToken = androidSub.subscriptionOfferDetails?.[0]?.offerToken || null;
                hasFreeTrial = !!androidSub.subscriptionOfferDetails?.[0]?.offerId;
                const list = androidSub.subscriptionOfferDetails?.[0]?.pricingPhases.pricingPhaseList;
                price = list ? list[list.length - 1].formattedPrice : '';
            }

            arr.push({productId: sub.productId, price, offerToken: offerToken!, hasFreeTrial});
        });

        dispatch({type: iap.FETCH_SUBS, payload: arr});
    };
}

type TRequestSubParams = {sub: TSubscription};
export function requestSub({sub}: TRequestSubParams) {
    return async function (dispatch: Dispatch) {
        dispatch({type: progress.START_LOADING});
        try {
            await requestSubscription(
                Platform.OS === 'ios'
                    ? {sku: sub.productId}
                    : {
                          subscriptionOffers: [
                              {
                                  sku: sub.productId,
                                  offerToken: sub.offerToken,
                              },
                          ],
                      },
            );
        } catch (err) {
            console.log('ERROR REQUEST SUB', err);
        }
        dispatch({type: progress.END_LOADING});
    };
}

type TVerifyReceiptParams = {purchase: Purchase; callback: () => void};
export function verifyReceipt({purchase, callback}: TVerifyReceiptParams) {
    return async function (dispatch: Dispatch) {
        const receipt = Platform.OS === 'ios' ? purchase.transactionReceipt : JSON.parse(purchase.transactionReceipt!);
        const transactionId = purchase.transactionId;
        const productId = Platform.OS === 'ios' ? purchase.productId : receipt.productId;
        const config = {headers: {Authorization: globalData.token}};
        let body: {platform: string; productId: string; receipt?: string; token?: string};

        if (Platform.OS === 'ios') {
            body = {
                platform: 'ios',
                productId,
                receipt,
            };
        } else {
            body = {
                platform: 'android',
                productId,
                token: receipt.purchaseToken,
            };
        }

        try {
            const response = await axios.post(`${URL}/api/verify-receipt/`, body, config);
            await finishTransaction({purchase, isConsumable: false});
            dispatch({type: iap.FINISH_TRANSACTION, payload: transactionId});

            if (response.data.testProd) {
                Alert.alert(
                    'Welcome to Sticknet Premium!',
                    'This was a sandboxed transaction in a production environment. Premium delivery will be skipped.',
                );
                callback();
            } else if (response.data.success) {
                Alert.alert('Welcome to Sticknet Premium!');
                callback();
                dispatch({type: iap.PREMIUM_USER});
            } else {
                // @ts-ignore
                Alert.alert('An error occurred with your subscription', `Error: ${response.error}`);
            }
        } catch (err) {
            await finishTransaction({purchase, isConsumable: false});
            dispatch({type: iap.FINISH_TRANSACTION, payload: transactionId});
            Alert.alert('ERROR FINISHING TRANSACTION', String(err));
        }
    };
}

export function fetchSubscriptionDetails() {
    return async function (dispatch: Dispatch) {
        const config = {headers: {Authorization: globalData.token}};
        const response = await axios.get(`${URL}/api/fetch-subscription-details/`, config);
        dispatch({type: app.DISPATCH_SUBSCRIPTION_DETAILS, payload: response.data});
        dispatch({type: auth.UPDATE_USER, payload: response.data});
    };
}
