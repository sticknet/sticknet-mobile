import React, {PureComponent} from 'react';
import {View, ViewStyle} from 'react-native';

import ImageItem from './ImageItem';
import {TGalleryItem} from '@/src/types';

const styles = {
    row: {
        flexDirection: 'row',
        flex: 1,
    } as ViewStyle,
};

interface RowProps {
    rowData: {node: {image: TGalleryItem; type: string; timestamp: number} | null}[];
    isSelected: boolean[];
    selectImage: (image: TGalleryItem) => void;
    imageMargin: number;
    selectedMarker?: React.ReactNode;
    imagesPerRow: number;
    containerWidth?: number;
    share?: boolean;
    selectSingleItem?: boolean;
    testID: string;
}

class Row extends PureComponent<RowProps> {
    constructor(props: RowProps) {
        super(props);
        this.renderImage = this.renderImage.bind(this);
    }

    renderImage(
        item: {node: {image: TGalleryItem; type: string; timestamp: number}},
        index: number,
        isSelected: boolean,
        testID: string,
    ) {
        const {imageMargin, selectedMarker, imagesPerRow, containerWidth, share, selectSingleItem} = this.props;
        item.node.image.type = item.node.type.split('/')[0];
        item.node.image.duration = Math.round(item.node.image.playableDuration);
        item.node.image.createdAt = item.node.timestamp;
        if (item.node.image.duration === null) item.node.image.duration = 0;
        return (
            <ImageItem
                key={`${item.node.timestamp}${index}`}
                item={item}
                selected={isSelected}
                imageMargin={imageMargin}
                // @ts-ignore
                selectedMarker={selectedMarker}
                imagesPerRow={imagesPerRow}
                containerWidth={containerWidth}
                onClick={this.props.selectImage}
                share={share}
                selectSingleItem={selectSingleItem as boolean}
                testID={testID}
            />
        );
    }

    render() {
        const items = this.props.rowData.map((item, index) => {
            if (item === null) {
                return null;
            }
            const testID = `${this.props.testID}-img-${index}`;
            // @ts-ignore
            return this.renderImage(item, index, this.props.isSelected[index], testID);
        });

        return <View style={styles.row}>{items}</View>;
    }
}

export default Row;
