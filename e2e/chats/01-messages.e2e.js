describe('Send messages', () => {
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

    it('should send album message', async () => {
        await waitFor(element(by.id('chats-tab'))).toBeVisible().withTimeout(5000);
        await element(by.id('chats-tab')).tap();
        await element(by.id('chats-tab')).tap();
        await waitFor(element(by.id('chat-item-0'))).toBeVisible().withTimeout(3000);
        await element(by.id('chat-item-0')).tap();
        await waitFor(element(by.id('composer'))).toBeVisible().withTimeout(3000);
        await element(by.id('composer')).tap();
        await element(by.id('composer')).replaceText('Hello');
        await element(by.id('composer-action-button')).tap();
        await waitFor(element(by.id('message-0'))).toBeVisible().withTimeout(5000);
    });
});
