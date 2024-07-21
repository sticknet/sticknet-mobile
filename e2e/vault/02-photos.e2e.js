describe('Photos', () => {
    beforeAll(async () => {
        await device.launchApp({
            permissions: {
                photos: 'YES',
            },
        });
        await device.disableSynchronization();
         await element(by.id('email')).replaceText('');
        await element(by.id('continue')).tap();
    });
    it('should upload photo', async () => {
        await waitFor(element(by.id('vault-tab')))
            .toBeVisible()
            .withTimeout(20000);
        await element(by.id('vault-tab')).tap();
        await element(by.id('vault-tab')).tap();
        await waitFor(element(by.id('photos-tab'))).toBeVisible().withTimeout(3000);
        await element(by.id('photos-tab')).tap();
        await waitFor(element(by.id('photos-screen'))).toBeVisible(100).withTimeout(3000);
        await element(by.id('upload')).tap();
        await waitFor(element(by.id('row-0-img-0'))).toBeVisible().withTimeout(3000);
        await element(by.id('row-0-img-0')).tap();
        await element(by.id('send')).tap();
        await element(by.id('send')).tap();
        await waitFor(element(by.id('photo-0')))
            .toExist()
            .withTimeout(2000);
        await waitFor(element(by.id('uploading-view'))).toBeVisible().withTimeout(2000);
        await waitFor(element(by.id('uploading-view'))).not.toBeVisible().withTimeout(10000);
        await expect(element(by.id('photo-0'))).toBeVisible();
    });
});
