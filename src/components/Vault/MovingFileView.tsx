import React, {FC} from 'react';
import {View, StyleSheet, Alert} from 'react-native';
import {connect} from 'react-redux';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';
import Text from '@/src/components/Text';
import ButtonPair from '@/src/components/Buttons/ButtonPair';
import {colors} from '@/src/foundations';
import {vault} from '@/src/actions';

type MovingFileViewProps = {
    tabBarHeight: number;
    file: {
        name: string;
        folder: string;
    };
    currentFolder: {
        id: string;
    };
    cancelMovingFile: () => void;
    moveFile: (file: {name: string; folder: string}, currentFolder: {id: string}) => void;
};

const MovingFileView: FC<MovingFileViewProps> = (props) => {
    if (!props.file) return null;
    return (
        <View style={[s.container, {bottom: props.tabBarHeight}]}>
            <Text style={{fontSize: 14}}>
                Moving <Text style={{fontWeight: 'bold'}}>{props.file.name}</Text>
            </Text>
            <Text style={{fontSize: 14}}>Go to your destination folder and confirm</Text>
            <ButtonPair
                acceptText="Confirm"
                declineText="Cancel"
                decline={() => props.cancelMovingFile()}
                accept={() => {
                    if (props.file.folder === props.currentFolder.id) {
                        Alert.alert('Cannot move file to the same folder');
                        return;
                    }
                    props.moveFile(props.file, props.currentFolder);
                }}
            />
        </View>
    );
};

const s = StyleSheet.create({
    container: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
        width: w('100%'),
        flex: 1,
        backgroundColor: '#ffffff',
        borderTopWidth: StyleSheet.hairlineWidth,
        borderColor: colors.primary,
    },
});

const mapStateToProps = (state: any) => {
    return {
        tabBarHeight: state.appTemp.tabBarHeight || 50,
        file: state.appTemp.movingFile,
        currentFolder: state.appTemp.folderStack[state.appTemp.folderStack.length - 1],
    };
};

export default connect(mapStateToProps, {...vault})(MovingFileView);
