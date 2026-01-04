import React, {PureComponent} from 'react';
import {TouchableOpacity, Text, StyleSheet, StyleProp, ViewStyle} from 'react-native';
import AddIcon from '@expo/vector-icons/FontAwesome';

interface AddMembersProps {
    style?: StyleProp<ViewStyle>;
    onPress: () => void;
}

class AddMembers extends PureComponent<AddMembersProps> {
    render() {
        return (
            <TouchableOpacity
                testID="add-members"
                style={[s.addContainer, this.props.style]}
                onPress={this.props.onPress}
            >
                <AddIcon name="plus" color="#6060FF" size={20} />
                <Text numberOfLines={1} style={{color: '#6060FF', fontSize: 16}}>
                    {' '}
                    Add or Invite Members
                </Text>
            </TouchableOpacity>
        );
    }
}

const s = StyleSheet.create({
    addContainer: {
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: '#6060FF',
        borderRadius: 40,
        padding: 8,
        width: 140,
        flexDirection: 'row',
        marginBottom: 8,
        marginTop: 16,
    },
});

export default AddMembers;
