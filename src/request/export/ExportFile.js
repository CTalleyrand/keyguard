/* global Constants */
/* global LoginFileIcon */
/* global Nimiq */
/* global PassphraseBox */
/* global PassphraseSetterBox */
/* global ProgressIndicator */
/* global KeyStore */
/* global DownloadLoginFile */
/* global Errors */
/* global Utf8Tools */
/* global TopLevelApi */

class ExportFile extends Nimiq.Observable {
    /**
     * if a complete page is missing it will be created.
     * However these pages wil be the default pages which usually don't match the applications requirements.
     * Refer to the corresponsing _build(Privcy | RecoveryWords | ValidateWords) to see the general Structure.
     * @param {Parsed<KeyguardRequest.SimpleRequest>} request
     * @param {Function} resolve
     * @param {Function} reject
     */
    constructor(request, resolve, reject) {
        super();

        this._resolve = resolve;
        this._request = request;
        this._reject = reject;

        /** @type {Key | null} */
        this._key = null;

        /** @type {HTMLElement} */
        const $exportFileIntroPage = (document.getElementById(ExportFile.Pages.LOGIN_FILE_INTRO));
        /** @type {HTMLElement} */
        const $unlockFilePage = (document.getElementById(ExportFile.Pages.LOGIN_FILE_UNLOCK));
        /** @type {HTMLElement} */
        const $setPasswordPage = (document.getElementById(ExportFile.Pages.LOGIN_FILE_SET_PASSWORD));
        /** @type {HTMLElement} */
        const $downloadFilePage = (document.getElementById(ExportFile.Pages.LOGIN_FILE_DOWNLOAD));

        /** @type {HTMLButtonElement} */
        const $fileButton = ($exportFileIntroPage.querySelector('.login-file'));
        /** @type {HTMLDivElement} */
        const $keyFileIcon = ($unlockFilePage.querySelector('.login-file-icon'));
        /** @type {HTMLFormElement} */
        const $passwordBox = ($unlockFilePage.querySelector('.passphrase-box'));
        /** @type {HTMLAnchorElement} */
        const $downloadKeyFile = ($unlockFilePage.querySelector('.download-key-file'));
        /** @type {HTMLFormElement} */
        const $passwordSetterBox = ($setPasswordPage.querySelector('.passphrase-setter-box'));
        /** @type {HTMLAnchorElement} */
        const $downloadLoginFile = ($downloadFilePage.querySelector('.download-loginfile'));

        this._keyFileIcon = new LoginFileIcon($keyFileIcon);
        this._keyFileIcon.lock();

        this._passwordBox = new PassphraseBox(
            $passwordBox, {
                buttonI18nTag: 'passphrasebox-download',
                hideInput: !this._request.keyInfo.encrypted,
                minLength: this._request.keyInfo.hasPin ? 6 : undefined,
                hideCancel: true,
            },
        );
        this._downloadKeyfile = new DownloadLoginFile($downloadKeyFile);
        this._passwordSetterBox = new PassphraseSetterBox($passwordSetterBox);
        this._downloadLoginFile = new DownloadLoginFile($downloadLoginFile);

        /* eslint-disable no-new */
        new ProgressIndicator($exportFileIntroPage.querySelector('.progress-indicator'), 3, 1);
        new ProgressIndicator($unlockFilePage.querySelector('.progress-indicator'), 3, 2);
        new ProgressIndicator($setPasswordPage.querySelector('.progress-indicator'), 3, 2);
        new ProgressIndicator($downloadFilePage.querySelector('.progress-indicator'), 3, 3);
        /* eslint-enable no-new */

        $fileButton.addEventListener('click', async () => {
            if (this._request.keyInfo.encrypted) {
                window.location.hash = ExportFile.Pages.LOGIN_FILE_UNLOCK;
            } else {
                TopLevelApi.setLoading(true);
                try {
                    const key = await KeyStore.instance.get(this._request.keyInfo.id);
                    this.fire(ExportFile.Events.KEY_CHANGED, key);
                    this.setKey(key);
                    window.location.hash = ExportFile.Pages.LOGIN_FILE_SET_PASSWORD;
                    TopLevelApi.setLoading(false);
                } catch (error) {
                    this._reject(new Errors.KeyNotFoundError());
                }
            }
        });

        this._passwordBox.on(PassphraseBox.Events.SUBMIT, async password => {
            await this._passphraseSubmitted(password);
        });

        this._passwordSetterBox.on(PassphraseSetterBox.Events.ENTERED,
            () => $setPasswordPage.classList.add('repeat-password'));
        this._passwordSetterBox.on(PassphraseSetterBox.Events.NOT_EQUAL,
            () => $setPasswordPage.classList.remove('repeat-password'));
        this._passwordSetterBox.on(PassphraseSetterBox.Events.SUBMIT, async password => {
            await this._setPassword(password);
        });

        window.addEventListener('hashchange', event => {
            const newUrl = new URL(event.newURL);
            if (newUrl.hash === `#${ExportFile.Pages.LOGIN_FILE_UNLOCK}`) {
                this._passwordBox.reset();
                if (TopLevelApi.getDocumentWidth() > Constants.MIN_WIDTH_FOR_AUTOFOCUS) {
                    this._passwordBox.focus();
                }
            }
        });
    }

    run() {
        window.location.hash = ExportFile.Pages.LOGIN_FILE_INTRO;
    }

    /**
     * @param {string} phrase
     */
    async _passphraseSubmitted(phrase) {
        TopLevelApi.setLoading(true);
        const passphraseBuffer = phrase ? Utf8Tools.stringToUtf8ByteArray(phrase) : undefined;
        /** @type {Key?} */
        let key = null;
        try {
            key = await KeyStore.instance.get(this._request.keyInfo.id, passphraseBuffer);
        } catch (e) {
            if (e.message === 'Invalid key') {
                TopLevelApi.setLoading(false);
                this._passwordBox.onPassphraseIncorrect();
                return;
            }
            this._reject(new Errors.CoreError(e));
            return;
        }
        if (!key) {
            this._reject(new Errors.KeyNotFoundError());
            return;
        }

        this.setKey(key, passphraseBuffer);
        this.fire(ExportFile.Events.KEY_CHANGED, key, phrase);
        TopLevelApi.setLoading(false);
        await this._goToLoginFileDownload();
    }

    /**
     *
     * @param {string} phrase
     */
    async _setPassword(phrase) {
        if (!this._key) {
            // this really should not happen
            this._reject(new Errors.KeyguardError('KeyId not set'));
            return;
        }

        this._key.hasPin = false;

        this._password = phrase ? Utf8Tools.stringToUtf8ByteArray(phrase) : undefined;

        await KeyStore.instance.put(this._key, this._password);
        await this._goToLoginFileDownload();
    }


    async _goToLoginFileDownload() {
        if (this._password && this._key && this._key.secret instanceof Nimiq.Entropy) {
            const firstAddress = new Nimiq.Address(
                this._key.deriveAddress(Constants.DEFAULT_DERIVATION_PATH).serialize(),
            );

            const encryptedSecret = await this._key.secret.exportEncrypted(this._password);

            this._downloadLoginFile.setEncryptedEntropy(
                /** @type {Nimiq.SerialBuffer} */ (encryptedSecret),
                firstAddress,
            );

            this._downloadLoginFile.on(DownloadLoginFile.Events.DOWNLOADED, () => {
                this._resolve({ success: true });
            });

            window.location.hash = ExportFile.Pages.LOGIN_FILE_DOWNLOAD;
        } else {
            this._reject(new Errors.KeyguardError('key or password missing'));
        }
    }

    /**
     * used to set the key if already decrypted elsewhere. This will disable the passphrase requirement.
     * Set to null to reenable passphrase requirement.
     * @param {Key | null} key
     * @param {Uint8Array} [password]
     */
    setKey(key, password) {
        this._key = key;
        this._password = password;
    }
}

ExportFile.Pages = {
    LOGIN_FILE_INTRO: 'login-file-intro',
    LOGIN_FILE_SET_PASSWORD: 'login-file-set-password',
    LOGIN_FILE_UNLOCK: 'login-file-unlock',
    LOGIN_FILE_DOWNLOAD: 'login-file-download',
};

ExportFile.Events = {
    KEY_CHANGED: 'key-changed',
};
