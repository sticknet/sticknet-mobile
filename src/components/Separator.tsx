import React, {FC} from 'react';
import {View} from 'react-native';

interface SeparatorProps {
    height?: number;
}

const Separator: FC<SeparatorProps> = (props) => {
    return <View style={{height: props.height || 20}} />;
};
export default Separator;
