import {Album} from '@react-native-camera-roll/camera-roll';

export type TCacheFile = {
    uri: string;
    uriKey: string;
};

export type TDevice = {
    id: string;
    name: string;
};

export interface IAlbum extends Album {
    recents?: boolean;
    smart?: boolean;
    uri?: string;
    id?: string;
}

export type TAlbumItem = {sectionTitle: string} | IAlbum;

export type TGalleryItem = {
    extension: string;
    fileSize: number;
    filename: string;
    height: number;
    orientation: string | null;
    playableDuration: number;
    duration?: number;
    uri: string;
    width: number;
    location: string | null;
    modificationTimestamp: number;
    subTypes: string[];
    timestamp: number;
    createdAt?: number;
    type: string;
};
