describe('Connections', () => {
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

    it('should send connection request', async () => {
        await waitFor(element(by.id('chats-tab'))).toBeVisible().withTimeout(5000);
        await element(by.id('chats-tab')).tap();
        await element(by.id('chats-tab')).tap();
        await waitFor(element(by.id('add'))).toBeVisible().withTimeout(2000);
        await element(by.id('add')).tap();
        await waitFor(element(by.id('username-input'))).toBeVisible().withTimeout(2000);
        await element(by.id('username-input')).replaceText('ramoo');
        await element(by.id('send')).tap();
        await element(by.id('back')).tap();
        await waitFor(element(by.id('chats-screen'))).toBeVisible().withTimeout(3000);
        await element(by.id('requests-sent')).tap();
        await waitFor(element(by.id('sent-requests-screen'))).toBeVisible().withTimeout(3000);
        await expect(element(by.text('ramoo'))).toBeVisible();
    });
});
