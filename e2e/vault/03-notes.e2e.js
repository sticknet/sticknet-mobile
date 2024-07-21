describe('Notes', () => {
    beforeAll(async () => {
        await device.launchApp();
        await device.disableSynchronization();
        await element(by.id('email')).replaceText('');
        await element(by.id('continue')).tap();
    });
    it('should create note', async () => {
        await waitFor(element(by.id('vault-tab')))
            .toBeVisible()
            .withTimeout(20000);
        await element(by.id('vault-tab')).tap();
        await element(by.id('vault-tab')).tap();
        await waitFor(element(by.id('notes-tab'))).toBeVisible().withTimeout(3000);
        await element(by.id('notes-tab')).tap();
        await waitFor(element(by.id('new-note'))).toBeVisible().withTimeout(3000);
        await element(by.id('new-note')).tap();
        await waitFor(element(by.id('input'))).toBeVisible().withTimeout(3000);
        await element(by.id('input')).typeText('This is a note');
        await element(by.id('save')).tap();
        await element(by.id('done')).tap();
        await waitFor(element(by.id('vault-notes-screen'))).toBeVisible().withTimeout(2000);
        await expect(element(by.text('This is a note'))).toBeVisible();
    });
});
