import React, {useState, useEffect} from 'react';
import {FlatList, View, StyleSheet, NativeSyntheticEvent, NativeScrollEvent} from 'react-native';
import {connect} from 'react-redux';
import {Folder, SearchBar, Text} from '@/src/components';
import {URL} from '@/src/actions/URL';
import {vault} from '@/src/actions';
import {isCloseToBottom, prepareFiles} from '@/src/utils';
import type {IApplicationState, TFile} from '@/src/types';

interface SearchScreenProps {
    files: TFile[];
    emptySearch: boolean;
    url: string | null;
    clearSearchItems: () => void;
    searchItems: (url: string, initial: boolean) => void;
}

const SearchScreen: React.FC<SearchScreenProps> = (props) => {
    const [input, setInput] = useState('');

    useEffect(() => {
        return () => {
            props.clearSearchItems();
        };
    }, []);

    const onChangeText = (query: string) => {
        setInput(query);
        if (query === '') {
            props.clearSearchItems();
        } else if (query.length > 1) {
            props.searchItems(`${URL}/api/search-files/?q=${query}&limit=15`, true);
        }
    };

    const cancelSearch = () => {
        setInput('');
    };

    const renderFile = ({item}: {item: TFile}) => <Folder item={item} folder="search" />;

    let loadingMore = false;

    const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (isCloseToBottom(e) && !loadingMore && props.url) {
            loadingMore = true;
            props.searchItems(props.url, false);
        }
    };

    return (
        <View style={{flex: 1}}>
            <SearchBar
                placeholder="Search files..."
                input={input}
                autoFocus
                onChangeText={onChangeText}
                cancelSearch={cancelSearch}
            />
            {props.emptySearch ? (
                <Text style={s.emptyText}>No results found</Text>
            ) : (
                <FlatList
                    data={props.files}
                    renderItem={renderFile}
                    contentContainerStyle={{paddingHorizontal: 12, paddingVertical: 12}}
                    keyboardShouldPersistTaps="handled"
                    keyboardDismissMode="on-drag"
                    onScroll={onScroll}
                />
            )}
        </View>
    );
};

const s = StyleSheet.create({
    emptyText: {
        fontWeight: 'bold',
        color: 'silver',
        alignSelf: 'center',
        marginTop: 40,
    },
});

const mapStateToProps = (state: IApplicationState) => ({
    files: prepareFiles(state.filesTree.search, state.files),
    emptySearch: state.appTemp.emptySearch,
    url: state.url.searchUrl,
});

export default connect(mapStateToProps, {...vault})(SearchScreen);
