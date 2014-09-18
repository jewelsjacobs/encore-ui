var loginPage = require('../pages/login.page');
var purchaseOrdersPage = require('../pages/purchaseOrders.page');

var notifications = encore.rxNotify;

describe('purchase orders page', function () {

    before(function () {
        loginPage.login();
    });

    it('should search for purchase orders', function () {
        purchaseOrdersPage.search(browser.params.accountId);
        expect(encore.rxPage.main.title).to.eventually.equal('Billing - Purchase Orders');
    });

    it('should not show any notifications', function () {
        expect(notifications.all.count()).to.eventually.equal(0);
    });

    it('should list the account name in the subtitle @dev', function () {
        expect(encore.rxPage.main.subtitle).to.eventually.equal('On account Digitas London');
    });

    after(function () {
        loginPage.logout();
    });

});
