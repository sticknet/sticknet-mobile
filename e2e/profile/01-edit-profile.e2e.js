describe('Profile', () => {
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

    it('should go to edit profile screen', async () => {
        await waitFor(element(by.id('profile-tab'))).toBeVisible().withTimeout(5000);
        await element(by.id('profile-tab')).tap();
        await element(by.id('profile-tab')).tap();
        await waitFor(element(by.id('edit-profile'))).toBeVisible().withTimeout(3000);
        await element(by.id('edit-profile')).tap();
    });
    it('should update cover photo', async () => {
        await waitFor(element(by.id('cover-photo'))).toBeVisible().withTimeout(3000);
        await element(by.id('cover-photo')).tap();
        await element(by.id('cover-photo')).tap();
        await waitFor(element(by.id('row-0-img-0'))).toBeVisible().withTimeout(3000);
        await element(by.id('row-0-img-0')).tap();
    });

    it('should update profile picture', async () => {
        await waitFor(element(by.id('profile-picture'))).toBeVisible().withTimeout(3000);
        await element(by.id('profile-picture')).tap();
        await waitFor(element(by.id('row-0-img-0'))).toBeVisible().withTimeout(3000);
        await element(by.id('row-0-img-0')).tap();
    });

    it('should update name, username, status, website', async () => {
        await waitFor(element(by.id('name-input'))).toBeVisible().withTimeout(3000);
        await element(by.id('name-input')).replaceText('John Doe');
        await element(by.id('username-input')).replaceText('');
        await element(by.id('username-input')).typeText('john_123_xyz');
        await waitFor(element(by.id('website-input')))
            .toBeVisible(100)
            .whileElement(by.id('edit-profile-scroll'))
            .scroll(200, 'down');
        await element(by.id('status-input')).typeText('New Status!');
        await device.pressBack();
        await element(by.id('website-input')).typeText('sticknet.org');
    });

    it('should show updated profile', async () => {
        await element(by.id('done')).tap();
        await waitFor(element(by.id('profile-scroll'))).toBeVisible().withTimeout(30000)
        await expect(element(by.id('name'))).toHaveText('John Doe');
        await expect(element(by.id('username'))).toHaveText('@john_123_xyz');
        await expect(element(by.id('status'))).toHaveText('New Status!');
        await expect(element(by.id('website'))).toHaveText('sticknet.org');
    });
});
