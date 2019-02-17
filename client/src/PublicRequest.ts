import * as Nimiq from '@nimiq/core-web';

// tslint:disable-next-line:interface-over-type-literal
export type KeyInfoObject = {
    id: string;
    type: Nimiq.Secret.Type;
    hasPin: boolean;
};

export type LegacyKeyInfoObject = KeyInfoObject & {
    legacyAccount: { label: string, address: Uint8Array };
};

export type ListResult = KeyInfoObject[];

export type ListLegacyResult = LegacyKeyInfoObject[];

export type EmptyRequest = null;

export type BasicRequest = {
    appName: string,
};

export type SimpleRequest = BasicRequest & {
    keyId: string
    keyLabel?: string,
};

export type SimpleResult = {
    success: boolean,
};

export type RemoveKeyRequest = BasicRequest & {
    keyId: string
    keyLabel: string,
};

export type SignatureResult = {
    publicKey: Uint8Array
    signature: Uint8Array,
};

export type TransactionInfo = {
    sender: Uint8Array
    senderType: Nimiq.Account.Type
    recipient: Uint8Array
    value: number
    fee: number
    validityStartHeight: number
    recipientType?: Nimiq.Account.Type
    data?: Uint8Array
    flags?: number,
};

export type SignTransactionRequestLayout = 'standard' | 'checkout' | 'cashlink';

export type SignTransactionRequest = SimpleRequest & TransactionInfo & {
    layout?: SignTransactionRequestLayout
    shopOrigin?: string
    shopLogoUrl?: string

    keyPath: string

    senderLabel?: string
    recipientLabel?: string,
};

export type SignTransactionResult = SignatureResult;

export type SignMessageRequest = SimpleRequest & {
    keyPath: string
    message: Uint8Array
    signer: Uint8Array
    signerLabel?: string,
};

export type SignMessageResult = SignatureResult & {
    data: Uint8Array,
};

export type CreateRequest = BasicRequest & {
    defaultKeyPath: string;
};

export type ImportRequest = BasicRequest & {
    defaultKeyPath: string;
    requestedKeyPaths: string[];
};

export type SingleKeyResult = {
    keyId: string;
    keyType: Nimiq.Secret.Type;
    addresses: Array<{ keyPath: string, address: Uint8Array }>;
};

export type KeyResult = SingleKeyResult[];

export type DeriveAddressRequest = SimpleRequest & {
    baseKeyPath: string
    indicesToDerive: string[],
};

export type DeriveAddressResult = {
    keyPath: string
    address: Uint8Array,
};

export type DeriveAddressesResult = Nimiq.SerialBuffer[];

export type DeriveAddressesRequest = {
    keyId: string,
    paths: string[],
};

export type ReleaseKeyRequest = {
    keyId: string,
    shouldBeRemoved: boolean,
};

export type TopLevelRequest = CreateRequest
    | ImportRequest
    | SimpleRequest
    | SignTransactionRequest
    | DeriveAddressRequest
    | SignMessageRequest
    | RemoveKeyRequest;

export type IFrameRequest = EmptyRequest | DeriveAddressesRequest | ReleaseKeyRequest;

export type Request = TopLevelRequest | IFrameRequest | SimpleResult;

export type RpcResult = KeyResult
    | SignTransactionResult
    | SignMessageResult
    | DeriveAddressResult
    | SimpleResult
    | ListResult
    | ListLegacyResult
    | DeriveAddressesResult;

export type KeyguardError = {
    Types: {
        // used for request parsing errors.
        INVALID_REQUEST: 'InvalidRequest',
        // used for errors thrown from core methods
        CORE: 'Core',
        // used for internal keyguard Errors.
        KEYGUARD: 'Keyguard',
        // used for the remaining Errors which are not assigned an own type just yet.
        UNCLASSIFIED: 'Unclassified',
    },
    Messages: {
        // specifically used to trigger a redirect to create after returning to caller
        GOTO_CREATE: 'GOTO_CREATE',
        // used to signal a user initiated cancelation of the request
        CANCELED: 'CANCELED',
        // used to signal that a given keyId no longer exist in KG, to be treated by caller.
        KEY_NOT_FOUND: 'keyId not found',
        // network name does not exist
        INVALID_NETWORK_CONFIG: 'Invalid network config',
    },
};
