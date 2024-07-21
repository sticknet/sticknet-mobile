describe('Groups', () => {
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

    it('should create group', async () => {
        await waitFor(element(by.id('chats-tab'))).toBeVisible().withTimeout(5000);
        await element(by.id('chats-tab')).tap();
        await element(by.id('chats-tab')).tap();
        await waitFor(element(by.text('Create Group'))).toBeVisible().withTimeout(3000);
        await element(by.text('Create Group')).tap();
        await waitFor(element(by.id('group-name-input'))).toBeVisible().withTimeout(3000);
        await element(by.id('group-name-input')).replaceText('My Family');
        await element(by.id('create')).tap();
        await waitFor(element(by.id('cancel-link'))).toBeVisible().withTimeout(10000);
        await element(by.id('cancel-link')).tap();
        await waitFor(element(by.text('My Family'))).toBeVisible().withTimeout(3000);
    });
    it('should send group chat message', async () => {
        await waitFor(element(by.id('chat-item-1'))).toBeVisible().withTimeout(3000);
        await element(by.id('chat-item-1')).tap();
        await waitFor(element(by.id('composer'))).toBeVisible().withTimeout(3000);
        await element(by.id('composer')).tap();
        await element(by.id('composer')).replaceText('Hello Family');
        await element(by.id('composer-action-button')).tap();
        await waitFor(element(by.id('message-0'))).toBeVisible().withTimeout(5000);
    });
});
