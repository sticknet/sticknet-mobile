import React, {FC} from 'react';
import {View, StyleSheet, ScrollView, StyleProp, ViewStyle, RefreshControlProps} from 'react-native';
import ActionButton from './Buttons/ActionButton';
import Icon from './Icons/Icon';
import Text from './Text';

interface EmptyContentProps {
    refreshControl?: React.ReactElement<RefreshControlProps>;
    style?: StyleProp<ViewStyle>;
    graphic?: React.ReactNode;
    text: React.ReactNode;
    action?: () => void;
    actionText: string;
    actionIcon?: string;
    testID?: string;
}

const EmptyContent: FC<EmptyContentProps> = (props) => {
    const ContainerView = props.refreshControl ? ScrollView : View;
    return (
        <ContainerView
            style={[s.emptyContainer, !props.refreshControl && s.center, props.style]}
            refreshControl={props.refreshControl}
            contentContainerStyle={s.center}
        >
            {props.graphic}
            <Text style={s.empty}>{props.text}</Text>
            {props.action && (
                <ActionButton
                    onPress={props.action}
                    text={props.actionText}
                    icon={<Icon regular name={props.actionIcon as string} size={15} />}
                    style={{alignSelf: 'center', marginTop: 20}}
                    testID={props.testID}
                />
            )}
        </ContainerView>
    );
};

const s = StyleSheet.create({
    emptyContainer: {
        minHeight: 100,
        paddingBottom: 20,
    },
    center: {
        justifyContent: 'center',
        alignItems: 'center',
        flex: 1,
    },
    empty: {
        color: 'grey',
        fontSize: 15,
        paddingHorizontal: 36,
        textAlign: 'center',
    },
});

export default EmptyContent;
