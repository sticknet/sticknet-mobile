import React from 'react';
import {View, StyleSheet, Pressable, Image} from 'react-native';
import {connect} from 'react-redux';
import Icon from '@expo/vector-icons/Ionicons';
import {Text} from '@/src/components';
import {BlueFolderIcon, YellowFolderIcon, OrangeFolderIcon} from '@/assets/images';
import {auth} from '@/src/actions';
import {IApplicationState} from '@/src/types';

interface FolderItem {
    icon: any;
    id: string;
    title: string;
}

const items: FolderItem[] = [
    {icon: BlueFolderIcon, id: 'blue', title: 'macOS Blue'},
    {icon: YellowFolderIcon, id: 'yellow', title: 'Windows Yellow'},
    {icon: OrangeFolderIcon, id: 'orange', title: 'Linux Orange'},
];

interface StateProps {
    folderIcon: string;
}

interface DispatchProps {
    setFolderIcon: (iconId: string) => void;
}

type Props = StateProps & DispatchProps;

const FolderIconScreen: React.FC<Props> = (props) => {
    return (
        <View style={{marginHorizontal: 12, marginTop: 24}}>
            <Text style={s.title}>Choose icon for folders in your Vault</Text>
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
                {items.map((item) => (
                    <Pressable key={item.id} style={s.container} onPress={() => props.setFolderIcon(item.id)}>
                        <Image source={item.icon} style={{width: 70, height: 70}} />
                        <Text style={s.text}>{item.title}</Text>
                        <Icon name={`ios-radio-button-${props.folderIcon === item.id ? 'on' : 'off'}`} size={20} />
                    </Pressable>
                ))}
            </View>
        </View>
    );
};

const s = StyleSheet.create({
    container: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    text: {
        fontWeight: 'bold',
        textAlign: 'center',
        marginTop: 8,
    },
    title: {
        fontSize: 16,
        marginBottom: 12,
    },
});

const mapStateToProps = (state: IApplicationState): StateProps => ({
    folderIcon: state.app.preferences.folderIcon,
});

const mapDispatchToProps: DispatchProps = {
    setFolderIcon: auth.setFolderIcon,
};

export default connect(mapStateToProps, mapDispatchToProps)(FolderIconScreen);
