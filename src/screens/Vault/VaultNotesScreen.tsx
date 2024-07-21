import React, {useEffect, useState} from 'react';
import {View, StyleSheet, FlatList, RefreshControl, NativeSyntheticEvent, NativeScrollEvent} from 'react-native';
import {connect} from 'react-redux';
import EntypoIcon from '@sticknet/react-native-vector-icons/Entypo';
import {NavigationProp, ParamListBase} from '@react-navigation/native';
import {ActionButton, EmptyContent, Icon, VaultNote} from '../../components';
import {vault} from '../../actions';
import {colors} from '../../foundations';
import {globalData} from '../../actions/globalVariables';
import {isCloseToBottom} from '../../utils';
import {URL} from '../../actions/URL';
import type {IApplicationState, TVaultNote} from '../../types';

interface VaultNotesScreenProps {
    navigation: NavigationProp<ParamListBase>;
    notes: TVaultNote[];
    url: string | null;
    fetched: boolean;
    initialized: boolean;
    fetchVaultNotes: (url: string, refresh: boolean, callback?: () => void) => void;
}

const VaultNotesScreen: React.FC<VaultNotesScreenProps> = (props) => {
    const [refreshing, setRefreshing] = useState(false);
    let loadingMore = false;

    useEffect(() => {
        const unsubscribe = props.navigation.addListener('focus', () => {
            props.navigation.setParams({hideTabBar: false});
            if (globalData.targetTab) {
                props.navigation.navigate(globalData.targetTab);
                globalData.targetTab = null;
            }
        });
        return () => unsubscribe();
    }, [props.navigation]);

    useEffect(() => {
        if (!props.fetched && props.initialized) {
            props.fetchVaultNotes(`${URL}/api/fetch-vault-notes/`, true);
        }
    }, [props.fetched, props.initialized, props.fetchVaultNotes]);

    const renderItem = ({item}: {item: TVaultNote}) => <VaultNote note={item} />;
    const seperator = () => <View style={{height: 12}} />;

    const refresh = () => {
        setRefreshing(true);
        props.fetchVaultNotes(`${URL}/api/fetch-vault-notes/`, true, () => setRefreshing(false));
    };

    const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (isCloseToBottom(e) && !loadingMore && props.url) {
            loadingMore = true;
            props.fetchVaultNotes(props.url, false, () => (loadingMore = false));
        }
    };

    return (
        <View style={{flex: 1}} testID="vault-notes-screen">
            <View style={s.topBar}>
                <View style={s.buttonsContainer}>
                    <ActionButton
                        onPress={() => props.navigation.navigate('CreateNote')}
                        text="New note"
                        icon={<Icon regular name="note-medical" size={15} />}
                        testID="new-note"
                    />
                </View>
            </View>
            {props.notes.length === 0 ? (
                <EmptyContent
                    graphic={<EntypoIcon color="lightgrey" name="text" size={80} style={{marginVertical: 20}} />}
                    text="Secret notes, hidden treasures, all secured in your private Vault."
                    actionText="New note"
                    actionIcon="note-medical"
                    action={() => props.navigation.navigate('CreateNote')}
                    refreshControl={
                        <RefreshControl
                            onRefresh={() => refresh()}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                            refreshing={refreshing}
                        />
                    }
                />
            ) : (
                <FlatList
                    data={props.notes}
                    renderItem={renderItem}
                    ItemSeparatorComponent={seperator}
                    contentContainerStyle={{paddingHorizontal: 12, paddingVertical: 12}}
                    refreshControl={
                        <RefreshControl
                            onRefresh={() => refresh()}
                            tintColor={colors.primary}
                            colors={[colors.primary]}
                            refreshing={refreshing}
                        />
                    }
                    onScroll={onScroll}
                />
            )}
        </View>
    );
};

const s = StyleSheet.create({
    topBar: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginRight: 8,
        paddingLeft: 8,
    },
    buttonsContainer: {
        flexDirection: 'row',
        marginTop: 12,
        marginBottom: 8,
    },
});

const mapStateToProps = (state: IApplicationState) => {
    return {
        notes: Object.values(state.vaultNotes),
        url: state.url.vaultNotesUrl,
        fetched: state.fetched.vaultNotes,
        initialized: state.appTemp.finishedCommonInits,
    };
};

export default connect(mapStateToProps, {...vault})(VaultNotesScreen);
