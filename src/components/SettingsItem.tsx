import React, {FC} from 'react';
import {Pressable, StyleSheet, Switch, View} from 'react-native';
import IoIcon from '@sticknet/react-native-vector-icons/Ionicons';
import ArrowIcon from '@sticknet/react-native-vector-icons/Feather';
import Text from './Text';
import Icon from './Icons/Icon';
import {colors, typography} from '@/src/foundations';

export type TSettingsItem = {
    text: string;
    action: (() => void) | ((value?: boolean) => void);
    icon?: React.ReactNode;
    type?: 'link' | 'check' | 'switch' | 'menu' | undefined;
    label?: string;
    description?: string;
    value?: boolean;
    danger?: boolean;
    separate?: boolean;
    noBorder?: boolean;
    noMargin?: boolean;
    isSeparateContext?: boolean;
    testID?: string;
};

interface SettingsItemProps {
    item: TSettingsItem;
}

const SettingsItem: FC<SettingsItemProps> = (props) => {
    const {
        text,
        action,
        icon,
        type,
        label,
        description,
        value,
        danger,
        separate,
        noBorder,
        noMargin,
        isSeparateContext,
        testID,
    } = props.item;

    const TypeIcon = () => {
        if (type === 'link') {
            return <ArrowIcon name="arrow-up-right" size={15} color={colors.silver} style={{marginRight: 8}} />;
        }
        if (type === 'check') {
            return value ? (
                <Icon size={15} name="check" style={{marginRight: 8}} color={colors.silver} regular />
            ) : null;
        }
        if (type === 'switch') {
            return (
                <Switch
                    testID="approval-switch"
                    onValueChange={action}
                    value={value}
                    trackColor={{false: '#767577', true: colors.primary}}
                    thumbColor="#ffffff"
                />
            );
        }
        if (type !== 'menu') {
            return (
                <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center'}}>
                    {label && <Text style={s.label}>{label}</Text>}
                    <IoIcon name="ios-arrow-forward" size={15} color={colors.silver} style={{marginRight: 12}} />
                </View>
            );
        }
        return null;
    };

    const handlePress = () => {
        if (type !== 'switch') action();
    };

    const borderBottomWidth = type === 'menu' || separate || noBorder ? 0 : 0.5;
    const borderTopWidth = isSeparateContext ? 0.5 : 0;
    const marginHorizontal = noMargin ? 0 : 8;
    return (
        <>
            <Pressable
                testID={testID}
                onPress={handlePress}
                style={[s.container, {borderBottomWidth, borderTopWidth, marginHorizontal}]}>
                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    {icon && <View style={s.icon}>{icon}</View>}
                    <View>
                        <Text style={{color: danger ? 'red' : colors.black}}>{text}</Text>
                        {description && (
                            <Text style={{color: colors.silver, fontSize: typography.paragraph2}}>{description}</Text>
                        )}
                    </View>
                </View>
                <TypeIcon />
            </Pressable>
            {separate && <View style={{height: 16, backgroundColor: '#f3f3f3', flex: 1}} />}
        </>
    );
};

const s = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        borderColor: '#caccce',
        paddingVertical: 16,
        justifyContent: 'space-between',
    },
    icon: {
        width: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        color: colors.silver,
        right: 8,
        bottom: 1,
    },
});

export default SettingsItem;
