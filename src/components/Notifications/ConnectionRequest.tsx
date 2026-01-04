import React, {useEffect, useRef, FC} from 'react';
import {StyleSheet, TouchableOpacity, View} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import * as Animatable from 'react-native-animatable';
import LottieView from 'lottie-react-native';
import Animated, {Layout, FadeOutLeft, FadeInRight} from 'react-native-reanimated';

import ProfilePicture from '@/src/components/ProfilePicture';
import {users} from '@/src/actions';
import Text from '@/src/components/Text';
import {checkAnimation} from '@/assets/lottie';
import type {IApplicationState, TUser, TConnectionRequest} from '@/src/types';

const mapStateToProps = (state: IApplicationState) => {
    return {
        connections: state.connections,
        user: state.auth.user as TUser,
    };
};

const connector = connect(mapStateToProps, {...users});

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromRedux & {
    request: TConnectionRequest;
    connReqRes: (fromUser: TUser, toUser: TUser, request: TConnectionRequest, accept: boolean) => void;
};

const AnimatedView = Animatable.createAnimatableComponent(View);

const ConnectionRequest: FC<Props> = (props) => {
    const {request, connections} = props;
    const {fromUser} = request;
    const user = connections[fromUser.id] || fromUser;
    const testID = `con-req-${request.id}`;
    const animationRef = useRef<LottieView>(null);

    useEffect(() => {
        if (request.accepted) {
            animationRef.current?.play();
        }
    }, [request.accepted]);

    return (
        <Animated.View
            entering={FadeInRight}
            exiting={FadeOutLeft}
            layout={Layout.springify()}
            testID={testID}
            style={s.invBox}
        >
            <View style={s.fromUser}>
                <ProfilePicture user={{...user, profilePicture: null}} size={48} disableNav />
                <View style={{marginLeft: 12}}>
                    <Text style={s.invitedText}>
                        <Text style={s.username}>{user.name}</Text> ( @{user.username} ) sent you a connection request
                    </Text>
                    {!request.accepted ? (
                        // @ts-ignore
                        <AnimatedView
                            transition="opacity"
                            duration={500}
                            style={[s.buttons, {opacity: !request.accepted ? 1 : 0}]}
                        >
                            <TouchableOpacity
                                testID={`${testID}-stick-in`}
                                onPress={() => !request.accepted && props.connReqRes(user, props.user, request, true)}
                                style={[s.button, s.accept]}
                            >
                                <Text style={[s.buttonText, {color: '#6060FF'}]}>Accept</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                testID={`${testID}-decline`}
                                onPress={() => !request.accepted && props.connReqRes(user, props.user, request, false)}
                                style={[s.button, s.decline]}
                            >
                                <Text style={[s.buttonText, {color: 'red'}]}>Decline</Text>
                            </TouchableOpacity>
                        </AnimatedView>
                    ) : (
                        <View
                            style={{
                                justifyContent: 'center',
                                alignItems: 'center',
                                height: 32,
                                marginBottom: 16,
                                marginTop: 4,
                            }}
                        >
                            <LottieView
                                ref={animationRef}
                                colorFilters={[
                                    {keypath: 'Success Checkmark', color: '#6060FF'},
                                    {keypath: 'Circle Flash', color: '#6060FF'},
                                    {keypath: 'Circle Stroke', color: '#6060FF'},
                                    {keypath: 'Circle Green Fill', color: '#6060FF'},
                                ]}
                                source={checkAnimation}
                                autoPlay={false}
                                loop={false}
                                style={{width: 40, height: 40}}
                            />
                        </View>
                    )}
                </View>
            </View>
        </Animated.View>
    );
};

const s = StyleSheet.create({
    buttons: {
        marginVertical: 8,
        marginLeft: 4,
        flexDirection: 'row',
    },
    button: {
        paddingTop: 4,
        paddingBottom: 4,
        justifyContent: 'center',
        width: 100,
        fontSize: 15,
        borderRadius: 40,
        alignSelf: 'center',
    },
    buttonText: {
        textAlign: 'center',
        fontSize: 15,
    },
    accept: {
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#6060FF',
    },
    decline: {
        marginLeft: 8,
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'red',
    },
    fromUser: {
        flexDirection: 'row',
    },
    invitedText: {
        marginTop: 8,
        fontSize: 15,
        maxWidth: w('75%'),
    },
    username: {
        fontWeight: 'bold',
    },
    invBox: {
        flexDirection: 'row',
        padding: 16,
        backgroundColor: 'white',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        marginVertical: 8,
    },
});

export default connector(ConnectionRequest);
