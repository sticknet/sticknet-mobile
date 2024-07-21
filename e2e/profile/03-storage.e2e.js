describe('Storage', () => {
    beforeAll(async () => {
        await device.launchApp({
            permissions: {
                photos: 'YES',
            },
        });
        await device.disableSynchronization();
        await element(by.id('email')).replaceText('');
        await element(by.id('continue')).tap();
        await waitFor(element(by.id('home-screen')))
            .toBeVisible()
            .withTimeout(20000);
    });
    it('should render setting items', async () => {
        await waitFor(element(by.id('profile-tab'))).toBeVisible().withTimeout(5000);
        await element(by.id('profile-tab')).tap();
        await element(by.id('profile-tab')).tap();
        await waitFor(element(by.id('manage-storage'))).toBeVisible(100);
        await element(by.id('manage-storage')).tap();
        await waitFor(element(by.id('manage-storage-screen'))).toBeVisible(100);
        await waitFor(element(by.text('CloudVault'))).toBeVisible();
        await waitFor(element(by.text('Vault'))).toBeVisible();
        await waitFor(element(by.text('Chats'))).toBeVisible();
    });
});

