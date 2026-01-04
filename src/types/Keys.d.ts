export type TIdentityKey = {
    keyId: number;
    public: string;
    user: string;
    cipher: string;
    salt: string;
    active: boolean;
    timestamp: string;
    dtTimestamp: string;
};

export type TSignedPreKey = {
    keyId: number;
    public: string;
    signature: string;
    user: string;
    cipher: string;
    salt: string;
    active: boolean;
    timestamp: string;
    dtTimestamp: string;
};

export type TPreKey = {
    keyId: number;
    public: string;
    user: string;
    used: boolean;
    cipher: string;
    salt: string;
    dtTimestamp: string;
};

export type TEncryptionSenderKey = {
    keyId: number;
    preKey: TPreKey | null;
    identityKey: TIdentityKey;
    partyId: string;
    chainId: number;
    step: number;
    user: string;
    key: string;
    dtTimestamp: string;
};

export type TDecryptionSenderKey = {
    key: string;
    preKey: TPreKey | null;
    identityKey: TIdentityKey | null;
    stickId: string;
    partyId: string | null;
    ofstring: string | null;
    forstring: string | null;
    ofOneTimeId: string | null;
    forOneTimeId: string | null;
    dtTimestamp: string;
};

export type TPendingKey = {
    user: string;
    owner: string;
    stickId: string;
    dtTimestamp: string;
};
