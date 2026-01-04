import React, {useState, useEffect, FC} from 'react';
import {Text, ScrollView, StyleSheet} from 'react-native';
import RNFS from 'react-native-fs';
import {widthPercentageToDP as w} from 'react-native-responsive-screen';

interface TextFileViewerProps {
    uri: string;
    file: {type?: string};
    onError: (arg?: any) => void;
}

const TextFileViewer: FC<TextFileViewerProps> = ({uri, file, onError}) => {
    const [fileContent, setFileContent] = useState('');
    const [readable, setReadable] = useState(true);

    useEffect(() => {
        if (!file.type) {
            setReadable(false);
        } else {
            RNFS.readFile(uri, 'utf8')
                .then((contents) => {
                    setFileContent(contents);
                })
                .catch((err) => {
                    if (err.toString().includes('Invalid UTF-8')) {
                        setReadable(false);
                    } else {
                        onError();
                    }
                });
        }
    }, [uri, file, onError]);

    return (
        <ScrollView style={s.container} contentContainerStyle={{justifyContent: 'center', alignItems: 'center'}}>
            <Text style={{marginTop: !readable ? 40 : 0, paddingHorizontal: 8}}>
                {readable ? fileContent : 'To view this file open it on a computer: www.sticknet.org'}
            </Text>
        </ScrollView>
    );
};

const s = StyleSheet.create({
    container: {
        width: w('100%'),
    },
});

export default TextFileViewer;
