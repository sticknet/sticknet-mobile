import React, {Component} from 'react';
import {View, Text, TouchableOpacity, Platform, Alert, StatusBar, StyleSheet} from 'react-native';
import {NavigationProp} from '@react-navigation/native';
import {connect, ConnectedProps} from 'react-redux';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import * as Animatable from 'react-native-animatable';
import CameraIcon from '@sticknet/react-native-vector-icons/MaterialIcons';
import {KeyboardAwareScrollView} from 'react-native-keyboard-aware-scroll-view';
import Icon from '@sticknet/react-native-vector-icons/Feather';
import FontistoIcon from '@sticknet/react-native-vector-icons/Fontisto';
import IoIcon from '@sticknet/react-native-vector-icons/Ionicons';
import {DefaultProfilePicture, DefaultProfileCover} from '../../../../assets/images';
import {Input, Image, DatePicker, BottomModal, ModalItem, NewImage} from '../../../components';
import {profile, create, auth, app} from '../../../actions/index';
import {photosPermission} from '../../../utils';
import {globalData} from '../../../actions/globalVariables';
import type {IApplicationState, TUser, TImage, TProfilePicture, TProfileCover} from '../../../types';
import type {ProfileStackParamList} from '../../../navigators/types';

const AnimatedView = Animatable.createAnimatableComponent(View);

type ReduxProps = ConnectedProps<typeof connector>;

type EditProfileScreenProps = ReduxProps & {
    navigation: NavigationProp<ProfileStackParamList>;
    profilePicture: TImage | null;
};

interface EditProfileScreenState {
    dateString: string;
    name: string;
    initialName: string;
    username: string;
    initialUsername: string;
    profilePicture: TProfilePicture | null;
    cover: TProfileCover | null;
    status: string;
    birthDay: Date | string;
    birthDayHidden: boolean;
    initialBDH: boolean;
    websiteLink: string;
    initialWebsiteLink: string;
    modalVisible: boolean;
    removePP: string | null;
    removeCover: string | null;
    ppUpdated: boolean;
    coverUpdated: boolean;
    modalCover: boolean;
    ppResizeMode: string;
    initialPpResizeMode: string;
    coverResizeMode: string;
    initialCoverResizeMode: string;
}

class EditProfileScreen extends Component<EditProfileScreenProps, EditProfileScreenState> {
    navListener: any;

    constructor(props: EditProfileScreenProps) {
        super(props);
        const {user} = this.props;
        this.state = {
            dateString: user.birthDay ? user.birthDay.text : '',
            birthDay: user.birthDay ? user.birthDay.text : '',
            name: user.name,
            initialName: user.name,
            username: user.username,
            initialUsername: user.username,
            profilePicture: user.profilePicture,
            cover: user.cover,
            status: user.status && user.status.decrypted ? user.status.text : '',
            birthDayHidden: user.birthDayHidden,
            initialBDH: user.birthDayHidden,
            websiteLink: user.websiteLink,
            initialWebsiteLink: user.websiteLink,
            modalVisible: false,
            removePP: null,
            removeCover: null,
            ppUpdated: false,
            coverUpdated: false,
            modalCover: false,
            ppResizeMode: user.profilePicture ? user.profilePicture.resizeMode : 'cover',
            initialPpResizeMode: user.profilePicture ? user.profilePicture.resizeMode : 'cover',
            coverResizeMode: user.cover ? user.cover.resizeMode : 'cover',
            initialCoverResizeMode: user.cover ? user.cover.resizeMode : 'cover',
        };
    }

    componentDidMount() {
        if (this.props.user.birthDay) {
            const dateParts = this.props.user.birthDay.text.split('-');
            const birthDay = new Date(Number(dateParts[2]), parseInt(dateParts[1], 10) - 1, Number(dateParts[0]));
            this.setState({birthDay});
        }
        this.props.navigation.setParams({
            updateProfile: this.updateProfile,
            resetState: this.props.resetCreateState,
        });
        this.navListener = this.props.navigation.addListener('focus', () => {
            StatusBar.setBarStyle('dark-content', true);
        });
    }

    componentDidUpdate(prevProps: EditProfileScreenProps) {
        if (this.props.error && !prevProps.error)
            Alert.alert('Username already taken!', 'Please choose another username.', [{text: 'Ok!', style: 'cancel'}]);
    }

    componentWillUnmount() {
        globalData.hideTabBar = false;
        this.props.resetCreateState({clearErrors: true});
        if (this.navListener) this.navListener();
    }

    static getDerivedStateFromProps(nextProps: EditProfileScreenProps, prevState: EditProfileScreenState) {
        if (nextProps.profilePicture && nextProps.profilePicture !== prevState.profilePicture) {
            return {removePP: null, ppUpdated: true, profilePicture: nextProps.profilePicture};
        }
        if (nextProps.cover && nextProps.cover !== prevState.cover) {
            return {removeCover: null, coverUpdated: true, cover: nextProps.cover};
        }
        return null;
    }

    updateProfile = () => {
        const {
            name,
            username,
            ppUpdated,
            coverUpdated,
            profilePicture,
            ppResizeMode,
            cover,
            coverResizeMode,
            status,
            dateString,
            birthDayHidden,
            removePP,
            removeCover,
            websiteLink,
        } = this.state;
        const {user, validUsername} = this.props;
        if (name !== '' && username.length >= 5 && validUsername.valid) {
            const updates = {
                status: (status && !user.status) || (user.status && status !== user.status.text),
                birthDay: (dateString && !user.birthDay) || (user.birthDay && dateString !== user.birthDay.text),
                websiteLink: websiteLink !== this.state.initialWebsiteLink,
            };
            if (
                ppUpdated ||
                coverUpdated ||
                name !== this.state.initialName ||
                username.toLowerCase() !== this.state.initialUsername ||
                birthDayHidden !== this.state.initialBDH ||
                coverResizeMode !== this.state.initialCoverResizeMode ||
                ppResizeMode !== this.state.initialPpResizeMode ||
                updates.status ||
                updates.websiteLink
            ) {
                const pp = ppUpdated && this.props.profilePicture ? this.props.profilePicture : null;
                const coverPic = coverUpdated && this.props.cover ? this.props.cover : null;
                const removePp = removePP && !profilePicture ? removePP : null;
                const removeCoverPic = removeCover && !cover ? removeCover : null;
                this.props.updateProfile({
                    updates,
                    picture: pp,
                    ppResizeMode,
                    cover: coverPic,
                    coverResizeMode,
                    name,
                    username: username.toLowerCase(),
                    status,
                    birthDay: dateString,
                    birthDayHidden,
                    removePP: removePp,
                    removeCover: removeCoverPic,
                    websiteLink,
                    user,
                    isBasic: this.props.isBasic,
                    callback: () => this.props.navigation.navigate('Profile', {}),
                });
            } else this.props.navigation.goBack();
        } else if (name === '')
            Alert.alert('Name Empty!', 'You can not leave this field Empty!', [{text: 'OK!', style: 'cancel'}]);
        else if (!validUsername.valid) Alert.alert('Invalid Username', 'Try another username');
        else Alert.alert('Too short', 'A username must have at least 5 characters');
    };

    selectPhotos = (cover: boolean) => {
        photosPermission(() => {
            this.setState({modalVisible: false}, () =>
                this.props.navigation.navigate({
                    name: 'SelectPhotos',
                    params: {
                        option: 4,
                        cover,
                        firstScreen: 'EditProfile',
                        next: 'EditProfile',
                    },
                    merge: true,
                }),
            );
        });
    };

    removePhoto = async () => {
        await this.props.resetCreateState();
        if (this.state.modalCover)
            this.setState({
                cover: null,
                modalVisible: false,
                coverUpdated: true,
                removeCover: this.state.cover ? this.state.cover.id : null,
            });
        else
            this.setState({
                profilePicture: null,
                modalVisible: false,
                ppUpdated: true,
                removePP: this.state.profilePicture !== null ? this.state.profilePicture.id : null,
            });
    };

    renderModal = () => {
        return (
            <BottomModal isVisible={this.state.modalVisible} hideModal={() => this.setState({modalVisible: false})}>
                <ModalItem
                    icon={<FontistoIcon name="photograph" size={20} />}
                    text={`Change profile ${this.state.modalCover ? 'cover' : 'picture'}`}
                    onPress={() => this.selectPhotos(this.state.modalCover)}
                />
                <ModalItem
                    icon={<IoIcon color="red" name="ios-trash" size={20} />}
                    text={`Remove profile ${this.state.modalCover ? 'cover' : 'picture'}`}
                    onPress={this.removePhoto}
                    danger
                />
            </BottomModal>
        );
    };

    onUsernameChange = (username: string) => {
        if (username.match(/^[a-zA-Z0-9_]+$/) || username === '') this.setState({username});
        else
            Alert.alert('Invalid character!', 'A Username may contain letters a-z, numbers 0-9 and "_"', [
                {text: 'Ok!', style: 'cancel'},
            ]);
        const last = username;
        setTimeout(() => {
            if (this.state.username === last && this.state.username.length > 4) {
                this.props.checkUsername({username: this.state.username.toLowerCase()});
            }
        }, 1000);
    };

    onDateChange = (e: any, data: Date | undefined) => {
        if (e.type === 'set' || Platform.OS === 'ios') {
            const date = new Date(data!);
            this.setState({
                dateString: `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`,
                birthDay: data!,
            });
        }
    };

    resizeCover = () => {
        this.setState({coverResizeMode: this.state.coverResizeMode === 'cover' ? 'contain' : 'cover'});
    };

    resizePp = () => {
        this.setState({ppResizeMode: this.state.ppResizeMode === 'cover' ? 'contain' : 'cover'});
    };

    render() {
        const {
            name,
            username,
            profilePicture,
            status,
            birthDay,
            dateString,
            birthDayHidden,
            cover,
            websiteLink,
            coverResizeMode,
            ppResizeMode,
        } = this.state;
        const {error, user} = this.props;
        const pp = this.props.profilePicture || this.state.profilePicture;
        const source = pp ? {uri: pp.uri} : profilePicture || DefaultProfilePicture;
        const pc = this.props.cover || this.state.cover;
        const coverSource = pc ? {uri: pc.uri} : cover || DefaultProfileCover;
        const PictureComponent: React.ElementType = pp?.uriKey && !this.props.profilePicture ? NewImage : Image;
        const CoverComponent: React.ElementType = pc?.uriKey && !this.props.cover ? NewImage : Image;
        console.log('DDDD', pp, this.state.profilePicture, this.props.profilePicture);
        return (
            <KeyboardAwareScrollView
                testID="edit-profile-scroll"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{alignItems: 'center', paddingBottom: 40}}>
                {this.renderModal()}
                <TouchableOpacity
                    testID="cover-photo"
                    onPress={() => this.selectPhotos(true)}
                    activeOpacity={1}
                    onLongPress={() => this.setState({modalVisible: true, modalCover: true})}>
                    <CoverComponent
                        source={coverSource}
                        style={s.cover}
                        image={
                            pc && !this.props.cover
                                ? {
                                      ...user.cover,
                                      user: {id: user.id},
                                  }
                                : null
                        }
                        type="pc"
                        resizeMode={coverResizeMode}
                        resizeable
                    />
                    <View style={s.coverOpacity} />
                    <CameraIcon name="add-a-photo" color="#fff" style={s.cameraIcon} size={28} />
                    {pc && (
                        <TouchableOpacity activeOpacity={1} style={s.circle} onPress={this.resizeCover}>
                            <Icon name="minimize-2" size={28} color="white" />
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>
                <TouchableOpacity
                    testID="profile-picture"
                    activeOpacity={1}
                    style={{marginBottom: 24, marginTop: 24}}
                    onPress={() => this.selectPhotos(false)}
                    onLongPress={() => this.setState({modalVisible: true})}>
                    <Text style={s.label}>Profile Picture</Text>
                    <PictureComponent
                        source={source}
                        style={{width: w('50%'), height: w('50%')}}
                        image={
                            pp && !this.props.profilePicture
                                ? {
                                      ...user.profilePicture,
                                      user: {id: user.id},
                                  }
                                : null
                        }
                        type="pp"
                        round
                        resizeable
                        resizeMode={ppResizeMode}
                    />
                    {pp && (
                        <TouchableOpacity activeOpacity={1} style={[s.circle, s.ppCircle]} onPress={this.resizePp}>
                            <Icon name="minimize-2" size={28} color="#fff" />
                        </TouchableOpacity>
                    )}
                </TouchableOpacity>

                <Input
                    testID="name-input"
                    label="Name"
                    onChangeText={(name) => this.setState({name})}
                    value={name}
                    maxLength={23}
                    style={{marginBottom: 16}}
                />
                <Input
                    testID="username-input"
                    label={error === null ? 'Username' : error}
                    onChangeText={this.onUsernameChange}
                    value={username}
                    color={error === null ? '#6060FF' : 'red'}
                    maxLength={23}
                    style={{marginBottom: 16}}
                />
                {!this.props.validUsername.valid &&
                    this.props.validUsername.username === this.state.username.toLowerCase() &&
                    this.state.initialUsername.toLowerCase() !== this.props.validUsername.username && (
                        <View style={s.errorContainer}>
                            <Text style={s.error}>This username is not available!</Text>
                        </View>
                    )}
                <Input
                    testID="status-input"
                    label="Status"
                    placeholder="Add a status"
                    onChangeText={(status) => this.setState({status})}
                    value={status}
                    maxLength={60}
                    style={{marginBottom: 16}}
                />
                <Input
                    testID="website-input"
                    label="Website"
                    placeholder="Add your website"
                    onChangeText={(websiteLink) => this.setState({websiteLink})}
                    value={websiteLink}
                    maxLength={60}
                    style={{marginBottom: 16}}
                />
                <DatePicker
                    date={birthDay.toString().length === 0 ? new Date() : new Date(birthDay)}
                    dateString={dateString}
                    onDateChange={this.onDateChange}
                    row={false}
                    style={{paddingLeft: 40}}
                    birthDate
                />
                <TouchableOpacity
                    activeOpacity={1}
                    onPress={() => this.setState({birthDayHidden: !this.state.birthDayHidden})}
                    style={s.hideContainer}>
                    <View style={s.circlesContainer}>
                        <AnimatedView
                            transition="opacity"
                            duration={200}
                            useNativeDriver
                            style={[s.smallCircle, {opacity: !birthDayHidden ? 1 : 0}]}
                        />
                        <View style={s.circle2} />
                    </View>
                    <Text style={s.show}> show birthday</Text>
                </TouchableOpacity>
            </KeyboardAwareScrollView>
        );
    }
}

const s = StyleSheet.create({
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: '#6060FF',
        marginLeft: 12,
        textAlign: 'center',
    },
    hideContainer: {
        alignSelf: 'flex-start',
        marginLeft: 24,
        flexDirection: 'row',
        marginTop: 24,
    },
    circlesContainer: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    circle2: {
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#fff',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'grey',
    },
    smallCircle: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: 'grey',
        position: 'absolute',
        zIndex: 1,
    },
    show: {
        color: 'grey',
        fontSize: 16,
    },
    cover: {
        width: w('100%'),
        height: 200,
    },
    coverOpacity: {
        position: 'absolute',
        width: w('100%'),
        height: 200,
        top: 0,
        zIndex: 1,
        backgroundColor: 'rgba(0,0,0,0.25)',
    },
    cameraIcon: {
        position: 'absolute',
        zIndex: 1,
        marginTop: 80,
        alignSelf: 'center',
    },
    circle: {
        position: 'absolute',
        right: 16,
        bottom: 16,
        width: 36,
        height: 36,
        borderRadius: 50,
        backgroundColor: 'black',
        opacity: 0.5,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 3,
    },
    ppCircle: {
        right: 0,
        bottom: 0,
    },
    errorContainer: {
        alignSelf: 'center',
        borderColor: 'red',
        borderTopWidth: StyleSheet.hairlineWidth,
        width: w('90%'),
    },
    error: {
        color: 'red',
        textAlign: 'center',
        fontSize: 16,
        marginTop: 16,
    },
});

const mapStateToProps = (state: IApplicationState) => ({
    user: state.auth.user as TUser,
    profilePicture: state.creating.images.length > 0 ? state.creating.images[0] : null,
    cover: state.creating.profileCover,
    error: state.errors.username,
    groups: state.groups,
    validUsername: state.appTemp.validUsername,
    searching: state.appTemp.searching,
    isBasic: !state.auth.user || state.auth.user.subscription === 'basic',
});

const mapDispatchToProps = {
    ...profile,
    ...create,
    ...auth,
    ...app,
};

const connector = connect(mapStateToProps, mapDispatchToProps);

// @ts-ignore
export default connector(EditProfileScreen);
