var rxPermissionPage = require('../rxPermission.page.js').rxPermission;

describe('rxPermission', function () {

    before(function () {
        demoPage.go('#/component/rxPermission');
    });

    it('rxPermission should display and hide content when appropriate', function () {
        var rxPermission = rxPermissionPage.rxPermission;
        expect(rxPermission.isDisplayed()).to.eventually.be.false;
        demoPage.storeTokenButton.click();
        expect(rxPermission.isDisplayed()).to.eventually.be.true;
        demoPage.clearTokenButton.click();
        expect(rxPermissionPage.rxPermission.isDisplayed()).to.eventually.be.false;
    });
});
