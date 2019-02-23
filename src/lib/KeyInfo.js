/* global Nimiq */

// eslint-disable-next-line no-unused-vars
class KeyInfo {
    /**
     * @param {number} id
     * @param {Nimiq.Secret.Type} type
     * @param {boolean} encrypted
     * @param {boolean} hasPin
     * @param {Uint8Array} defaultAddress
     */
    constructor(id, type, encrypted, hasPin, defaultAddress) {
        /** @private */
        this._id = id;
        /** @private */
        this._type = type;
        /** @private */
        this._encrypted = encrypted;
        /** @private */
        this._hasPin = hasPin;
        /** @private */
        this._defaultAddress = new Nimiq.Address(defaultAddress);
    }

    /**
     * @type {number}
     */
    get id() {
        return this._id;
    }

    /**
     * @type {Nimiq.Secret.Type}
     */
    get type() {
        return this._type;
    }

    /**
     * @type {boolean}
     */
    get encrypted() {
        return this._encrypted;
    }

    /**
     * @type {boolean}
     */
    get hasPin() {
        return this._hasPin;
    }

    /** @type {Nimiq.Address} */
    get defaultAddress() {
        return this._defaultAddress;
    }

    /**
     * @returns {KeyguardRequest.KeyInfoObject}
     */
    toObject() {
        return {
            id: this.id,
            type: this.type,
            hasPin: this.hasPin,
        };
    }

    /**
     * @param {KeyguardRequest.KeyInfoObject} obj
     * @param {boolean} encrypted
     * @param {Uint8Array} defaultAddress
     * @returns {KeyInfo}
     */
    static fromObject(obj, encrypted, defaultAddress) {
        return new KeyInfo(obj.id, obj.type, encrypted, obj.hasPin, defaultAddress);
    }
}
