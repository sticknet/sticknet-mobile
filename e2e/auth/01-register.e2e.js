describe('Register', () => {
    beforeAll(async () => {
        await device.launchApp();
        await device.disableSynchronization();
    });

    it('should create new account', async () => {
        await element(by.id('email')).replaceText('e2e@test.com');
        await element(by.id('continue')).tap();
        await waitFor(element(by.id('code-input')))
            .toBeVisible()
            .withTimeout(10000);
        await element(by.id('code-input')).typeText('123456');
        await waitFor(element(by.id('name-input')))
            .toBeVisible()
            .withTimeout(5000);
        await element(by.id('name-input')).typeText('Alicee');
        await element(by.id('continue')).tap();
        await waitFor(element(by.id('username-input')))
            .toBeVisible()
            .withTimeout(1000);
        await device.disableSynchronization();
        await element(by.id('username-input')).typeText('alice1234');
        await device.enableSynchronization();
        await element(by.id('continue')).tap();
        await waitFor(element(by.id('ok')))
            .toBeVisible()
            .withTimeout(3000);
        await element(by.id('ok')).tap();
        await element(by.id('finish')).tap();
        await waitFor(element(by.id('home-screen')))
            .toBeVisible()
            .withTimeout(10000);
    });
});
