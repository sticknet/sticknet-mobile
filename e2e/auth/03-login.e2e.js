describe('Login', () => {
       beforeAll(async () => {
        await device.launchApp();
        await device.disableSynchronization();
    });
    it('should login', async () => {
        await element(by.id('email')).replaceText('e2e_1@test.com');
        await element(by.id('continue')).tap();
        await waitFor(element(by.id('code-input')))
            .toBeVisible()
            .withTimeout(10000);
        await element(by.id('code-input')).typeText('123456');
        await waitFor(element(by.id('password-input'))).toBeVisible().withTimeout(5000);
        await element(by.id('password-input')).typeText('gggggg');
        await device.pressBack();
        await element(by.id('login-button')).tap();
        await waitFor(element(by.id('home-screen')))
            .toExist()
            .withTimeout(20000);
    });
});
