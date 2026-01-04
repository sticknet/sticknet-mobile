import React from 'react';
import {Animated, Text, StyleSheet, ViewStyle} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import {State, TapGestureHandler, TapGestureHandlerStateChangeEvent} from 'react-native-gesture-handler';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import Image from '@/src/components/Image';
import NewImage from '@/src/components/NewImage';
import {app, users} from '@/src/actions';
import {lightenRGBColor} from '@/src/utils';
import type {IApplicationState, TUser} from '@/src/types';
import type {ProfileStackParamList} from '@/src/navigators/types';

interface ProfilePictureOwnProps {
    user: TUser;
    size?: number;
    style?: ViewStyle;
    resizeMode?: string;
    disableNav?: boolean;
    onPress?: () => void;
    isPreview?: boolean;
}

const mapStateToProps = (state: IApplicationState, ownProps: ProfilePictureOwnProps) => {
    return {
        myID: state.auth.user ? state.auth.user.id : null,
        profile: ownProps.user ? state.connections[ownProps.user.id] : null,
        finishedRegistration: state.auth.finishedRegistration,
    };
};

const connector = connect(mapStateToProps, {...users, ...app});
type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromRedux & ProfilePictureOwnProps;

const ProfilePicture: React.FC<Props> = (props) => {
    const navigation = useNavigation<NavigationProp<ProfileStackParamList>>();
    const onPress = (event: TapGestureHandlerStateChangeEvent) => {
        if (props.disableNav) return;
        if (event.nativeEvent.state === State.ACTIVE) {
            if (props.onPress) props.onPress();
            else if (props.user) {
                if (props.user.id !== props.myID) {
                    navigation.navigate('OtherProfile', {user: props.user});
                }
            }
        }
    };

    const {size = 40, user, style, resizeMode, isPreview} = props;
    const picture = user.profilePicture;
    const pp = {...props.user.profilePicture, user: {id: props.user.id}};
    const resize = resizeMode || (picture ? picture.resizeMode : 'cover');
    const pictureStyle = {
        width: size,
        height: size,
        backgroundColor: '#f3f3f3',
        borderWidth: picture?.resizeMode === 'cover' ? 0 : 1,
        borderColor: 'lightgrey',
    };

    return (
        <TapGestureHandler onHandlerStateChange={onPress} numberOfTaps={1}>
            <Animated.View style={style}>
                {pp?.uriKey ? (
                    <NewImage
                        style={pictureStyle}
                        image={pp}
                        context="other"
                        isPreview={isPreview}
                        round
                        resizeMode={resize}
                    />
                ) : user.profilePicture ? (
                    <Image
                        // @ts-ignore
                        type="pp"
                        image={pp}
                        style={pictureStyle}
                        size={size}
                        resizeMode={resize}
                        round
                        defaultImage="ProfilePicture"
                        resizeable
                        small
                        id={picture!.id}
                    />
                ) : (
                    <LinearGradient
                        colors={[user.color || 'rgb(0,0,0)', lightenRGBColor(user.color)]}
                        start={{x: 1, y: 1}}
                        end={{x: 0, y: 0}}
                        style={{
                            backgroundColor: user.color,
                            width: size,
                            height: size,
                            borderRadius: w('50%'),
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}
                    >
                        <Text style={{...s.letter, fontSize: size * 0.6}}>{user?.name ? user.name[0] : ''}</Text>
                    </LinearGradient>
                )}
            </Animated.View>
        </TapGestureHandler>
    );
};

const s = StyleSheet.create({
    letter: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 24,
    },
});

ProfilePicture.defaultProps = {
    size: 40,
    style: {},
};

export default connector(ProfilePicture);
