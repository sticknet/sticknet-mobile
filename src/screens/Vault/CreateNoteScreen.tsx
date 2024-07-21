import React, {useState, useRef, useEffect} from 'react';
import {ScrollView, View, TextInput, KeyboardAvoidingView, StyleSheet, Platform, Pressable} from 'react-native';
import {connect} from 'react-redux';
import {useHeaderHeight} from '@react-navigation/elements';
import {RouteProp, useNavigation, useRoute} from '@react-navigation/native';
import {heightPercentageToDP as h} from 'react-native-responsive-screen';
import type {NavigationProp} from '@react-navigation/native';
import {TextParser} from '../../components';
import {colors} from '../../foundations';
import {vault} from '../../actions';
import {globalData} from '../../actions/globalVariables';
import {IVaultActions} from '../../actions/vault';
import type {VaultStackParamList} from '../../navigators/types';

const CreateNoteScreen: React.FC<IVaultActions> = (props) => {
    const navigation = useNavigation<NavigationProp<VaultStackParamList>>();
    const height = useHeaderHeight();
    const route = useRoute<RouteProp<VaultStackParamList, 'CreateNote'>>();
    const ref = useRef<TextInput | null>(null);
    const [currentNote, setCurrentNote] = useState(route.params?.note);
    const [editing, setEditing] = useState(!currentNote?.id);
    const [text, setText] = useState(currentNote?.text || '');
    const [initialText, setInitialText] = useState(text);

    useEffect(() => {
        setTimeout(() => {
            if (editing) ref.current?.focus();
        }, 600);
    }, [editing]);

    useEffect(() => {
        navigation.setParams({
            done: () => {
                if (!editing) {
                    navigation.goBack();
                    return;
                }
                if (text !== initialText) {
                    setInitialText(text);
                    if (currentNote?.id) {
                        props.updateVaultNote({note: currentNote, text});
                    } else {
                        props.createVaultNote({text, callback: (note) => setCurrentNote(note)});
                    }
                }
                setEditing(false);
            },
            editing,
        });
        return () => {
            globalData.hideTabBar = false;
        };
    }, [initialText, editing]);

    const ContainerView = (
        !editing ? ScrollView : Platform.OS === 'ios' ? KeyboardAvoidingView : View
    ) as React.ComponentType<any>;

    const ParentContainer = !editing ? ScrollView : View;

    return (
        <ParentContainer style={{flex: 1}}>
            <Pressable
                style={{flex: 1, minHeight: h('80%')}}
                onPress={() => {
                    if (!editing) {
                        setEditing(true);
                        setTimeout(() => ref.current?.focus(), 100);
                    }
                }}>
                <ContainerView
                    style={s.container}
                    keyboardVerticalOffset={height}
                    behavior="padding"
                    contentContainerStyle={{paddingBottom: 60}}>
                    {editing ? (
                        <TextInput
                            ref={ref}
                            style={[
                                s.input,
                                {bottom: Platform.OS === 'ios' ? 5 : 0, flex: Platform.OS === 'ios' ? 1 : undefined},
                            ]}
                            multiline
                            selectionColor={colors.primary}
                            defaultValue={text}
                            testID="input"
                            onChangeText={(value) => {
                                setText(value);
                                navigation.setParams({
                                    done: () => {
                                        if (!editing) {
                                            navigation.goBack();
                                            return;
                                        }
                                        if (value !== initialText) {
                                            setInitialText(value);
                                            if (currentNote?.id) {
                                                props.updateVaultNote({note: currentNote, text: value});
                                            } else {
                                                props.createVaultNote({
                                                    text: value,
                                                    callback: (note) => setCurrentNote(note),
                                                });
                                            }
                                        }
                                        setEditing(false);
                                    },
                                });
                            }}
                        />
                    ) : (
                        <TextParser style={s.input} text={text} />
                    )}
                </ContainerView>
            </Pressable>
        </ParentContainer>
    );
};

const s = StyleSheet.create({
    container: {
        padding: 20,
        flex: 1,
    },
    input: {
        fontSize: 20,
        padding: 0,
        margin: 0,
    },
});

export default connect(null, {...vault})(CreateNoteScreen);
