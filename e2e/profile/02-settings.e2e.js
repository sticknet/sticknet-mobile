describe('Settings', () => {
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
        await element(by.id('settings')).tap();
        await waitFor(element(by.id('settings-screen'))).toBeVisible().withTimeout(2000);
        await expect(element(by.text('Sticknet Premium'))).toBeVisible();
        await expect(element(by.text('Connect a computer'))).toBeVisible();
        await expect(element(by.text('Account'))).toBeVisible();
        await expect(element(by.text('Privacy'))).toBeVisible();
        await expect(element(by.text('Sticknet FAQ'))).toBeVisible();
        await expect(element(by.text('Ask a Question'))).toBeVisible();
        await expect(element(by.text('Tell a Friend'))).toBeVisible();
        await expect(element(by.text('Report a problem'))).toBeVisible();
        await expect(element(by.text('Send feedback'))).toBeVisible();
        await expect(element(by.text('Privacy & Terms'))).toBeVisible();
        await expect(element(by.text('Log Out'))).toBeVisible();
    });
});

