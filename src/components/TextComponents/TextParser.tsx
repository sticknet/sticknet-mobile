import React, {Component} from 'react';
import {Animated, Linking, StyleSheet, TextStyle} from 'react-native';
import {connect} from 'react-redux';
import ParsedText from 'react-native-parsed-text';
import {State, TapGestureHandler} from 'react-native-gesture-handler';
import type {NavigationProp} from '@react-navigation/native';
import Text from '../Text';
import {getTabName} from '../../utils';
import {colors} from '../../foundations';
import type {IApplicationState, TUser} from '../../types';

interface TextParserProps {
    navigation?: NavigationProp<any>;
    connections: Record<string, TUser>;
    text: string;
    style?: TextStyle;
    textStyle?: TextStyle;
    lightTheme?: boolean;
    testID?: string;
}

class TextParser extends Component<TextParserProps> {
    handleUsernameTap = (username: string, e: any) => {
        if (e.nativeEvent.state === State.ACTIVE) {
            const tabName = getTabName(this.props.navigation!);
            if (!tabName.includes('Chat')) {
                const user = Object.values(this.props.connections).find(
                    (connection) => connection.username === username,
                );

                if (this.props.navigation) {
                    if (user) {
                        this.props.navigation.navigate({name: `OtherProfile`, params: {user}, merge: true});
                    } else {
                        this.props.navigation.navigate({
                            name: `OtherProfile`,
                            params: {user: {username}, merge: true},
                        });
                    }
                }
            }
        }
    };

    renderUsername = (matchingString: string) => {
        const username = matchingString.slice(1);
        return (
            <TapGestureHandler onHandlerStateChange={(e) => this.handleUsernameTap(username, e)} numberOfTaps={1}>
                <Animated.View>
                    <Text
                        style={[
                            {
                                top: 3,
                                color: this.props.lightTheme ? '#0F0F28' : '#fff',
                                fontWeight: 'bold',
                                fontSize: 15,
                            },
                            this.props.style,
                        ]}>
                        {matchingString}
                    </Text>
                </Animated.View>
            </TapGestureHandler>
        );
    };

    renderUrl = (matchingString: string) => {
        return (
            <Text
                onPress={() => Linking.openURL(matchingString)}
                style={[
                    {
                        color: colors.primary,
                        textDecorationLine: 'underline',
                        fontSize: 15,
                        flexWrap: 'wrap',
                    },
                    this.props.style,
                ]}>
                {matchingString}
            </Text>
        );
    };

    render() {
        return (
            // @ts-ignore
            <ParsedText
                {...this.props}
                testID={this.props.testID}
                style={[s.textStyle, this.props.style, this.props.textStyle]}
                parse={[
                    {pattern: /(?<!\w)@\w+/, render: this.renderUsername},
                    {
                        pattern:
                            /\b(http:\/\/www\.|https:\/\/www\.|http:\/\/|https:\/\/)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z]{2,}(\/[-a-zA-Z0-9()@:%_+.~#?&/=]*)?/,
                        render: this.renderUrl,
                    },
                ]}>
                {this.props.text}
            </ParsedText>
        );
    }
}

const mapStateToProps = (state: IApplicationState) => ({
    connections: state.connections,
});

const s = StyleSheet.create({
    textStyle: {
        fontSize: 15,
        flexWrap: 'wrap',
        flex: 1,
    },
});

export default connect(mapStateToProps)(TextParser);
