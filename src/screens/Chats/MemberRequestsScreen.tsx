import React, {Component} from 'react';
import {View, FlatList} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import type {NavigationProp, RouteProp} from '@react-navigation/native';
import {ButtonPair, Separator, UserItem, Loading} from '@/src/components';
import {groups, app} from '@/src/actions';
import type {IApplicationState, TGroup, TUser} from '@/src/types';
import type {ChatStackParamList} from '@/src/navigators/types';

interface MemberRequestsScreenProps {
    navigation: NavigationProp<ChatStackParamList, 'MemberRequests'>;
    route: RouteProp<ChatStackParamList, 'MemberRequests'>;
}

type ReduxProps = ConnectedProps<typeof connector>;

type Props = MemberRequestsScreenProps & ReduxProps;

class MemberRequestsScreen extends Component<Props> {
    componentDidMount() {
        this.props.fetchMemberRequests({groupId: this.props.group.id});
    }

    response = async (user: TUser, accepted: boolean) => {
        this.props.startLoading();
        this.props.navigation.setParams({requestsCount: this.props.group.requestsCount - 1});

        if (accepted) {
            this.props.addMembers({
                users: [user],
                usersIds: [user.id],
                group: this.props.group,
                user: this.props.user,
            });
            this.props.removeMemberRequest({
                group: this.props.group,
                userId: user.id,
                add: true,
                callback: () => this.props.navigation.goBack(),
            });
        } else {
            this.props.removeMemberRequest({
                group: this.props.group,
                userId: user.id,
                add: false,
                callback: () => this.props.navigation.goBack(),
            });
        }
    };

    renderUser = ({item}: {item: TUser}) => (
        <View>
            {/* @ts-ignore */}
            <UserItem route={this.props.route} navigation={this.props.navigation} item={{item}} />
            <ButtonPair accept={() => this.response(item, true)} decline={() => this.response(item, false)} />
        </View>
    );

    separator = () => <Separator />;

    render() {
        if (!this.props.fetched) return <Loading show />;
        return (
            <View style={{flex: 1}}>
                <FlatList
                    initialNumToRender={11}
                    data={this.props.members}
                    keyExtractor={(item, index) => index.toString()}
                    ItemSeparatorComponent={this.separator}
                    renderItem={this.renderUser}
                    style={{paddingTop: 16}}
                    contentContainerStyle={{paddingBottom: 40, paddingHorizontal: 12}}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                />
            </View>
        );
    }
}

const mapStateToProps = (state: IApplicationState, ownProps: MemberRequestsScreenProps) => ({
    group: state.groups[ownProps.route.params.id] as TGroup,
    members: Object.values(state.groupRequests[ownProps.route.params.id] || {}) as TUser[],
    user: state.auth.user as TUser,
    fetched: state.fetched.groupRequests[ownProps.route.params.id],
});

const connector = connect(mapStateToProps, {...groups, ...app});

export default connector(MemberRequestsScreen);
