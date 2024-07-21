import React, {Component} from 'react';
import {State, TapGestureHandler, TapGestureHandlerStateChangeEvent} from 'react-native-gesture-handler';
import {Animated, StyleSheet} from 'react-native';
import Collapsible from 'react-native-collapsible';
import type {NavigationProp} from '@react-navigation/native';
import TextParser from './TextParser';
import Text from '../Text';
import type {CommonStackParamList} from '../../navigators/types';

interface CollapsibleTextProps {
    text: string;
    style?: object;
    textColor?: string;
    moreColor?: string;
    lightTheme?: boolean;
    fontSize?: number;
    long?: boolean;
    navigation?: NavigationProp<CommonStackParamList>;
    testID?: string;
}

interface CollapsibleTextState {
    collapsed: boolean;
}

class CollapsibleText extends Component<CollapsibleTextProps, CollapsibleTextState> {
    static defaultProps = {
        textColor: '#0F0F28',
        moreColor: 'grey',
        long: false,
        fontSize: 15,
    };

    state = {
        collapsed: true,
    };

    toggleCollapsible = (descLength: number, linesLength: number, e: TapGestureHandlerStateChangeEvent) => {
        if (e.nativeEvent.state === State.ACTIVE) {
            const maxLength = !this.props.long ? 90 : 900;
            const maxLines = !this.props.long ? 2 : 20;
            if (descLength > maxLength || linesLength > maxLines) {
                this.setState({collapsed: !this.state.collapsed});
            }
        }
    };

    render() {
        const {text, style, textColor, moreColor, lightTheme, fontSize, long, testID} = this.props;
        const maxLength = !long ? 90 : 900;
        const maxLines = !long ? 2 : 20;
        const lines = text.split(/\r\n|\r|\n/);
        let final = '';
        if (lines.length > maxLines) {
            for (let i = maxLines; i < lines.length; i++) {
                final = final.concat(lines[i]);
                if (i !== lines.length - 1) final = final.concat('\n');
            }
        }
        let initial = '';
        if (lines.length > maxLines && text.length < maxLength) {
            for (let i = 0; i < maxLines; i++) {
                initial += `${lines[i]}\n`;
            }
        } else initial = text;
        final = lines.length > maxLines && text.length < maxLength ? final : text.substring(maxLength);
        if (this.state.collapsed && (text.length > maxLength || lines.length > maxLines)) initial += '...';
        return (
            <TapGestureHandler
                onHandlerStateChange={(e) => this.toggleCollapsible(text.length, lines.length, e)}
                numberOfTaps={1}>
                <Animated.View style={style}>
                    <TextParser
                        testID={testID}
                        navigation={this.props.navigation}
                        style={{color: textColor, fontSize}}
                        text={initial.substring(0, maxLength)}
                        lightTheme={lightTheme}
                    />
                    {text.length > maxLength || lines.length > maxLines ? (
                        <Text style={[s.expand, {color: moreColor}]}>{this.state.collapsed ? 'more' : null}</Text>
                    ) : null}
                    <Collapsible collapsed={this.state.collapsed}>
                        <TextParser
                            navigation={this.props.navigation}
                            style={{color: textColor, fontSize}}
                            text={final}
                            lightTheme={lightTheme}
                        />
                        <Text style={[s.expand, {color: moreColor}]}>less</Text>
                    </Collapsible>
                </Animated.View>
            </TapGestureHandler>
        );
    }
}

const s = StyleSheet.create({
    expand: {
        fontSize: 15,
    },
});

export default CollapsibleText;
