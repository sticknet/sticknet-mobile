import React, {useState} from 'react';
import {FlatList, View} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import {useNavigation, NavigationProp} from '@react-navigation/native';
import LottieView from 'lottie-react-native';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import {EmptyContent, GroupItem, SearchBar, Separator} from '@/src/components';
import {peopleAnimation} from '@/assets/lottie';
import type {IApplicationState, TGroup} from '@/src/types';
import type {ChatStackParamList} from '@/src/navigators/types';

const mapStateToProps = (state: IApplicationState) => ({
    groups: state.groups,
});

const connector = connect(mapStateToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

type GroupsScreenProps = PropsFromRedux;

const GroupsScreen: React.FC<GroupsScreenProps> = ({groups}) => {
    const [input, setInput] = useState('');
    const navigation = useNavigation<NavigationProp<ChatStackParamList>>();

    const onChangeText = (value: string) => setInput(value);

    const cancelSearch = () => {
        setInput('');
    };

    const renderItem = ({item}: {item: TGroup}) => {
        const group = item;
        return (
            <GroupItem
                onPress={() =>
                    navigation.navigate('GroupDetail', {
                        title: group.displayName.text,
                        decrypted: group.displayName.decrypted,
                        id: group.id,
                    })
                }
                item={item}
                showOptions
            />
        );
    };

    const header = () => {
        return (
            <View style={{marginBottom: 24}}>
                <SearchBar
                    placeholder="Search groups..."
                    input={input}
                    onChangeText={onChangeText}
                    cancelSearch={cancelSearch}
                />
            </View>
        );
    };

    if (Object.keys(groups).length > 0) {
        let data = Object.values(groups);
        if (input.length > 0) {
            data = data.filter((item) => item.displayName?.text?.toLowerCase().startsWith(input.toLowerCase()));
        }
        return (
            <>
                {header()}
                <FlatList
                    data={data}
                    renderItem={renderItem}
                    contentContainerStyle={{paddingHorizontal: 12, paddingBottom: 24}}
                    ItemSeparatorComponent={() => <Separator />}
                />
            </>
        );
    }

    return (
        <EmptyContent
            graphic={
                <LottieView
                    source={peopleAnimation}
                    autoPlay
                    loop
                    style={{width: w('75%'), marginTop: 16, marginBottom: 40}}
                />
            }
            text="Start your journey by creating your first group – a secure space for your ideas, secrets, and moments"
            actionText="Create Group"
            actionIcon="users-medical"
            action={() => navigation.navigate('ChatsTab', {screen: 'GroupCreate'})}
        />
    );
};

export default connector(GroupsScreen);
