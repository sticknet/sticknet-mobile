import React, {useRef, useEffect, FC} from 'react';
import {FlatList, Platform, FlatListProps} from 'react-native';
import {connect, ConnectedProps} from 'react-redux';
import {heightPercentageToDP as h, widthPercentageToDP as w} from 'react-native-responsive-screen';
import {app} from '../actions';
import {IApplicationState} from '../types'; // Adjust the import path accordingly

const viewabilityConfig = {
    waitForInteraction: false,
    viewAreaCoveragePercentThreshold: 95,
    minimumViewTime: 10,
};

const windowSize = Platform.OS === 'ios' ? 100 : 8;

interface HorizontalListProps extends PropsFromRedux {
    data: any[];
    index: number;
    keyExtractor: (item: any, index: number) => string;
    renderItem: FlatListProps<any>['renderItem'];
    onViewableItemsChanged: (info: {viewableItems: any[]; changed: any[]}) => void;
}

const HorizontalList: FC<HorizontalListProps> = (props) => {
    const ref = useRef<FlatList<any>>(null);

    useEffect(() => {
        const nextTick = new Promise((resolve) => setTimeout(resolve, 0));
        nextTick.then(() => {
            ref.current?.scrollToIndex({
                index: props.index,
                animated: false,
            });
        });
    }, [props.index]);

    const isLandscape = props.orientation.includes('LANDSCAPE');
    const inverted = props.orientation === 'LANDSCAPE-RIGHT' && Platform.OS === 'ios';
    const handleItemChange = useRef((item: {viewableItems: any[]; changed: any[]}) => {
        props.onViewableItemsChanged(item);
    }).current;
    const width = isLandscape ? h('100%') : w('100%');

    return (
        <FlatList
            ref={ref}
            horizontal={!isLandscape || Platform.OS === 'android'}
            inverted={inverted}
            pagingEnabled
            data={props.data}
            keyExtractor={props.keyExtractor}
            renderItem={props.renderItem}
            viewabilityConfig={viewabilityConfig}
            onViewableItemsChanged={handleItemChange}
            showsVerticalScrollIndicator={false}
            showsHorizontalScrollIndicator={false}
            windowSize={windowSize}
            keyboardShouldPersistTaps="handled"
            getItemLayout={(data, index) => ({length: width, offset: width * index, index})}
        />
    );
};

const mapStateToProps = (state: IApplicationState) => ({
    orientation: state.orientation,
});

const connector = connect(mapStateToProps, {...app});

type PropsFromRedux = ConnectedProps<typeof connector>;

export default connector(HorizontalList);
