import React, {Component} from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import {heightPercentageToDP as h} from 'react-native-responsive-screen';

import Icon from '@sticknet/react-native-vector-icons/Feather';
import FontistoIcon from '@sticknet/react-native-vector-icons/Fontisto';
import IoIcon from '@sticknet/react-native-vector-icons/Ionicons';
import {NavigationProp, RouteProp} from '@react-navigation/native';
import {BottomModal, GroupCover, Input, ModalItem} from '@/src/components';
import {create, groups} from '@/src/actions';
import {monthNames, photosPermission} from '@/src/utils';
import type {IApplicationState, TFile, TGroup, TUser} from '@/src/types';
import type {ChatStackParamList} from '@/src/navigators/types';

type ReduxProps = ConnectedProps<typeof connector>;

interface EditGroupScreenProps {
    navigation: NavigationProp<ChatStackParamList>;
    route: RouteProp<ChatStackParamList, 'EditGroup'>;
}

type Props = ReduxProps & EditGroupScreenProps;

interface EditGroupScreenState {
    group: TGroup;
    coverUpdated: boolean;
    modalVisible: boolean;
    removeCover: any;
    cover: any;
    resizeMode: string;
    initialResizeMode: string;
    displayName: string;
    status: string;
}

class EditGroupScreen extends Component<Props, EditGroupScreenState> {
    constructor(props: Props) {
        super(props);
        const {group} = this.props;
        const {displayName, status} = group;
        this.state = {
            group,
            coverUpdated: false,
            modalVisible: false,
            removeCover: null,
            cover: this.props.cover,
            resizeMode: group.cover ? group.cover.resizeMode : 'cover',
            initialResizeMode: group.cover ? group.cover.resizeMode : 'cover',
            displayName: displayName.text,
            status: status ? status.text : '',
        };
    }

    componentDidMount() {
        this.props.navigation.setParams({
            updateGroup: this.updateGroup,
            resetState: this.props.resetCreateState,
        });
    }

    static getDerivedStateFromProps(nextProps: Props, prevState: EditGroupScreenState) {
        if (nextProps.cover !== prevState.cover && nextProps.cover.length > 0)
            return {coverUpdated: true, removeCover: null, cover: nextProps.cover};
        return null;
    }

    selectPhotos = () => {
        photosPermission(() => {
            this.setState({modalVisible: false}, () =>
                this.props.navigation.navigate({
                    name: 'SelectPhotos',
                    params: {
                        next: 'EditGroup',
                        option: 4,
                    },
                    merge: true,
                }),
            );
        });
    };

    updateGroup = () => {
        let updated = false;
        if (
            this.state.resizeMode !== this.state.initialResizeMode ||
            this.state.coverUpdated ||
            this.state.displayName !== this.state.group.displayName.text ||
            (this.state.status && !this.state.group.status) ||
            (this.state.group.status && this.state.status !== this.state.group.status.text)
        )
            updated = true;
        const updates = {
            displayName: this.state.displayName !== this.state.group.displayName.text,
            resizeMode: this.state.resizeMode !== this.state.initialResizeMode,
            status:
                (this.state.status && !this.state.group.status) ||
                (this.state.group.status && this.state.status !== this.state.group.status.text),
        };
        const cover =
            this.state.coverUpdated && this.props.cover[0] !== undefined
                ? this.props.cover[0]
                : !this.state.removeCover
                ? this.state.group.cover
                : null;
        let removeCover = null;
        if (this.state.removeCover && !this.state.cover) removeCover = this.state.removeCover;
        this.props.updateGroup({
            updates,
            updated,
            displayName: this.state.displayName,
            status: this.state.status,
            photo: cover as TFile,
            resizeMode: this.state.resizeMode,
            group: this.state.group,
            coverUpdated: this.state.coverUpdated,
            removeCover,
            user: this.props.user,
            isBasic: this.props.isBasic,
            callback: () => {
                if (this.props.route.params.horizontal)
                    this.props.navigation.navigate({name: 'GroupDetail', merge: true, params: {}});
                else this.props.navigation.goBack();
            },
        });
    };

    renderModal = () => {
        return (
            <BottomModal isVisible={this.state.modalVisible} hideModal={() => this.setState({modalVisible: false})}>
                <ModalItem
                    icon={<FontistoIcon name="photograph" size={20} />}
                    text="Change Group cover"
                    onPress={this.selectPhotos}
                />
                <ModalItem
                    icon={<IoIcon color="red" name="ios-trash" size={20} />}
                    text="Remove Group cover"
                    onPress={async () => {
                        await this.props.resetCreateState();
                        this.setState({
                            cover: null,
                            modalVisible: false,
                            removeCover: this.state.cover !== null ? this.state.cover.id : null,
                            coverUpdated: this.state.group.cover !== null,
                        });
                    }}
                    danger
                />
            </BottomModal>
        );
    };

    resize = () => {
        this.setState({resizeMode: this.state.resizeMode === 'cover' ? 'contain' : 'cover'});
    };

    render() {
        const {cover} = this.state;
        const updatedCover = this.props.cover.length !== 0 ? this.props.cover[0] : this.props.cover;
        // @ts-ignore
        const coverPhoto = updatedCover?.length !== 0 ? updatedCover : cover;
        const {timestamp} = this.props.group;
        const d = new Date(timestamp);

        return (
            <View style={s.form}>
                {this.renderModal()}
                <View style={{marginLeft: 20}}>
                    <Input
                        testID="group-name-input"
                        label="Group Name"
                        onChangeText={(displayName) => this.setState({displayName})}
                        value={this.state.displayName}
                        maxLength={25}
                    />
                    <Input
                        testID="status-input"
                        label="Status"
                        maxLength={60}
                        placeholder="Update the Group's Status"
                        onChangeText={(status) => this.setState({status})}
                        value={this.state.status}
                        style={{marginTop: 16}}
                    />
                </View>
                <View style={{marginTop: 24}}>
                    <Text style={s.label}>Group Cover Photo</Text>
                    <TouchableOpacity
                        onPress={this.selectPhotos}
                        onLongPress={() => this.setState({modalVisible: true})}>
                        <GroupCover
                            groupId={this.props.group.id}
                            cover={coverPhoto}
                            size={240}
                            style={{alignSelf: 'center'}}
                            resizeable
                            // @ts-ignore
                            resizeMode={this.state.resizeMode}
                        />
                        {cover && (
                            <TouchableOpacity activeOpacity={1} style={s.circle} onPress={this.resize}>
                                <Icon name="minimize-2" size={28} color="white" />
                            </TouchableOpacity>
                        )}
                    </TouchableOpacity>
                </View>
                <Text style={s.timestamp}>
                    Group created {`${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()} `}
                </Text>
            </View>
        );
    }
}

const s = StyleSheet.create({
    form: {
        marginTop: 24,
    },
    label: {
        fontSize: 16,
        marginBottom: 8,
        color: '#6060FF',
        marginLeft: 12,
        textAlign: 'center',
    },
    circle: {
        position: 'absolute',
        right: 48,
        bottom: 16,
        width: 36,
        height: 36,
        borderRadius: 50,
        backgroundColor: 'black',
        opacity: 0.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timestamp: {
        fontSize: 14,
        color: 'grey',
        marginLeft: 12,
        marginTop: h('4%'),
    },
});

const mapStateToProps = (state: IApplicationState, ownProps: EditGroupScreenProps) => ({
    cover: state.creating.images,
    group: state.groups[ownProps.route.params.id],
    user: state.auth.user as TUser,
    isBasic: !state.auth.user || state.auth.user.subscription === 'basic',
});

const connector = connect(mapStateToProps, {...groups, ...create});

export default connector(EditGroupScreen);
