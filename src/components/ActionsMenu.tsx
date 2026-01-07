import React, {useEffect, useState} from 'react';
import {Alert, View} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import DotsIcon from '@sticknet/react-native-vector-icons/MaterialCommunityIcons';
import {RouteProp, useRoute} from '@react-navigation/native';
import ActionsModal from './Modals/ActionsModal';
import InputModal from './Modals/InputModal';
import {vault} from '@/src/actions';
import type {IApplicationState, TFile, TVaultNote} from '@/src/types';

interface ActionsMenuOwnProps {
    item: TFile | TVaultNote;
    type: 'file' | 'note';
    parent?: any;
}

type PropsFromRedux = ConnectedProps<typeof connector>;
type Props = PropsFromRedux & ActionsMenuOwnProps;

const ActionsMenu: React.FC<Props> = (props) => {
    const {item, type, parent} = props;
    const route = useRoute<RouteProp<{params: {[key: string]: any}}, 'params'>>();
    const [actionsVisible, setActionsVisible] = useState(false);
    const [inputVisible, setInputVisible] = useState(false);
    const [fileName, setFileName] = useState((props.item as TFile).name);

    useEffect(() => {
        if (
            props.renaming &&
            props.renaming.uriKey === (props.item as TFile).uriKey &&
            props.renaming.routeName === route.name
        ) {
            setInputVisible(true);
        }
    }, [props.renaming, (props.item as TFile).uriKey, route.name]);

    return (
        <View>
            <DotsIcon name="dots-horizontal" size={24} color="grey" onPress={() => setActionsVisible(true)} />
            <ActionsModal
                isVisible={actionsVisible}
                hideModal={() => setActionsVisible(false)}
                item={item}
                type={type}
                parent={parent}
            />
            <InputModal
                visible={inputVisible}
                onPress={() => {
                    if (fileName.length === 0) {
                        Alert.alert("File name can't be empty");
                    } else {
                        props.cancelRenaming();
                        setInputVisible(false);
                        if (fileName !== (item as TFile).name) {
                            props.renameFile(props.item, fileName);
                        }
                    }
                }}
                defaultValue={fileName}
                cancel={() => {
                    setInputVisible(false);
                    props.cancelRenaming();
                }}
                title="Renaming file"
                doneText="Rename"
                onChangeText={(text) => setFileName(text)}
            />
        </View>
    );
};

const mapStateToProps = (state: IApplicationState) => {
    return {
        renaming: state.appTemp.renamingItem,
    };
};

const connector = connect(mapStateToProps, {...vault});

export default connector(ActionsMenu);
