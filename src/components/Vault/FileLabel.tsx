import React, {FC} from 'react';
import {StyleSheet, View} from 'react-native';
import Text from '../Text';
import type {TFile} from '../../types';

type FileLabelProps = {
    file: TFile;
};

const FileLabel: FC<FileLabelProps> = (props) => {
    const parts = props.file.name.split('.');
    const extension = parts[parts.length - 1].split(' ')[0].toUpperCase().slice(0, 4);
    return (
        <View style={s.container}>
            <Text style={{fontSize: 11}}>{extension}</Text>
        </View>
    );
};

const s = StyleSheet.create({
    container: {
        backgroundColor: 'rgb(240,240,240)',
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
    },
});

export default FileLabel;
