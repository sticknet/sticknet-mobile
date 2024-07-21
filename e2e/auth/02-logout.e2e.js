describe('Logout & Login', () => {
    beforeAll(async () => {
        await device.launchApp();
        await device.disableSynchronization();
        await element(by.id('email')).replaceText('');
        await element(by.id('continue')).tap();
    });
    it('should logout', async () => {
        await waitFor(element(by.id('profile-tab'))).toBeVisible().withTimeout(10000);
        await element(by.id('profile-tab')).tap();
        await element(by.id('profile-tab')).tap();
        await waitFor(element(by.id('settings'))).toBeVisible().withTimeout(2000);
        await element(by.id('settings')).tap();
        await waitFor(element(by.id('log-out'))).toBeVisible().withTimeout(2000);
        await element(by.id('log-out')).tap();
        await element(by.id('log-out')).tap();
        await element(by.label('Log Out').and(by.type('_UIAlertControllerActionView'))).tap();
        await waitFor(element(by.id('authentication-screen'))).toBeVisible().withTimeout(5000);
    });

});
