describe('Add file to vault', () => {
    beforeAll(async () => {
        await device.launchApp({  permissions: {
                photos: 'YES',
            }});
        await device.disableSynchronization();
    });

    it('should share photo', async () => {
        await element(by.id('email')).replaceText('');
        await element(by.id('continue')).tap();
        await waitFor(element(by.id('upload-files')))
            .toBeVisible()
            .withTimeout(20000);
        await element(by.id('upload-files')).tap();
        await element(by.id('upload-files')).tap();
        await element(by.id('upload-files')).tap();
        await waitFor(element(by.id('upload-photos'))).toBeVisible().withTimeout(5000);
        await element(by.id('upload-photos')).tap();
        await waitFor(element(by.id('row-0-img-0'))).toBeVisible().withTimeout(3000);
        await element(by.id('row-0-img-0')).tap();
        await element(by.id('send')).tap();
        await waitFor(element(by.id('file-0')))
            .toExist()
            .withTimeout(5000);
        await waitFor(element(by.id('uploading-progress-file-0'))).toBeVisible().withTimeout(2000);
        await waitFor(element(by.id('uploading-progress-file-0'))).not.toBeVisible().withTimeout(10000);
        await waitFor(element(by.id('file-0')))
            .toExist()
            .withTimeout(5000);
    });
});
