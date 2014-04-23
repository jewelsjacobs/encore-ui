/* jshint node: true */

describe('rxAppRoutes', function () {
    var appRoutes, myAppRoutes, envSvc, generatedRoutes, location, rootScope;

    var fakeRoutes = [{
        href: { tld: 'example', path: 'myPath' },
        children: [
            {
                href: '/{{user}}/1-1',
                children: [
                    {
                        linkText: '1st-1st-1st'
                    }
                ]
            },
            {
                href: '/1-2'
            }
        ]
    }];

    // mock out route to have param which will replace '{{user}}'
    var route = {
        current: {
            pathParams: {
                user: 'me'
            }
        }
    };

    beforeEach(function () {
        // load module
        module('encore.ui.rxApp');
        module('encore.ui.rxEnvironment');

        // Provide any mocks needed
        module(function ($provide) {
            $provide.value('$route', route);
        });

        // Inject in angular constructs
        inject(function (rxAppRoutes, Environment, $location, $rootScope) {
            appRoutes = rxAppRoutes;
            envSvc = Environment;
            location = $location;
            rootScope = $rootScope;
        });

        // set environment to build from
        sinon.stub(envSvc, 'get').returns({
            name: 'staging',
            pattern: /\/\/staging\.(?:.*\.)?com/,
            url: '{{tld}}/{{path}}'
        });

        myAppRoutes = new appRoutes(fakeRoutes);
        generatedRoutes = myAppRoutes.getAll();
    });

    it('should build url property from rxEnvironmentUrl', function () {
        // first item should have generated URL based on staging href
        expect(generatedRoutes[0].url).to.equal('example/myPath');

        // child item should have default href, since it's just a string
        expect(generatedRoutes[0].children[1].url).to.equal(fakeRoutes[0].children[1].href);
    });

    it('should build urls from route path params', function () {
        // child item should have 'me' in place of '{{user}}'
        expect(generatedRoutes[0].children[0].url).to.equal('/me/1-1');
    });

    it('should ignore links that are not defined', function () {
        expect(generatedRoutes[0].children[0].children[0].url).to.be.undefined;
    });

    it('should determine active state based on URL match', function () {
        expect(generatedRoutes[0].active, 'route should not be active by default').to.be.false;

        // update location
        location.path(generatedRoutes[0].url);
        rootScope.$apply();

        // sanity check that location actually changed
        expect(location.path()).to.equal('/' + generatedRoutes[0].url);

        expect(generatedRoutes[0].active, 'route should be active when path changes').to.be.true;

        // update location again to somewhere else
        location.path('somewhereElse');
        rootScope.$apply();

        expect(generatedRoutes[0].active, 'route should no longer be active').to.be.false;
    });

    it('should have active state if child element is active', function () {
        expect(generatedRoutes[0].active, 'route should not be active by default').to.be.false;

        // update location
        location.path(generatedRoutes[0].children[0].url);
        rootScope.$apply();

        expect(generatedRoutes[0].active, 'route should be active when child activated').to.be.true;

        // update location again to somewhere else
        location.path('somewhereElse');
        rootScope.$apply();

        expect(generatedRoutes[0].active, 'route should no longer be active').to.be.false;
    });

    it('should allow overwritting all the nav items', function () {
        var newRoutes = [{
            href: '/r/BrokenGifs'
        }];

        myAppRoutes.setAll(newRoutes);

        expect(myAppRoutes.getAll()[0].url).to.equal(newRoutes[0].href);
    });
});

describe('rxApp', function () {
    var scope, compile, rootScope, el, elCustom, elCollapsible, elCollapsibleVar, defaultNav;
    var standardTemplate = '<rx-app></rx-app>';
    var collapsibleTemplate = '<rx-app collapsible-nav="true"></rx-app>';
    var collapsibleExternalVarTemplate = '<rx-app collapsible-nav="true" collapsed-nav="collapsed"></rx-app>';
    var customTemplate = '<rx-app site-title="My App" menu="customNav"></rx-app>';

    var customNav = [{
        title: 'Example Menu',
        children: [
            {
                href: '/1',
                linkText: '1st Order Item'
            }
        ]
    }];

    beforeEach(function () {
        // load module
        module('encore.ui.rxApp');
        module('encore.ui.rxEnvironment');

        // load templates
        module('templates/rxApp.html');
        module('templates/rxAppNav.html');
        module('templates/rxAppNavItem.html');
        module('templates/rxPage.html');

        // Inject in angular constructs
        inject(function ($rootScope, $compile, encoreNav) {
            rootScope = $rootScope;
            scope = $rootScope.$new();
            compile = $compile;
            defaultNav = encoreNav;

            scope.collapsed = false;
        });

        scope.customNav = customNav;

        el = helpers.createDirective(standardTemplate, compile, scope);
        elCustom = helpers.createDirective(customTemplate, compile, scope);
        elCollapsible = helpers.createDirective(collapsibleTemplate, compile, scope);
        elCollapsibleVar = helpers.createDirective(collapsibleExternalVarTemplate, compile, scope);
    });

    it('should have a default title', function () {
        // get page title element
        var pageTitle = el[0].querySelector('.site-title');

        // validate it matches 'Encore'
        expect(pageTitle.textContent).to.equal('Encore');
    });

    it('should allow you to override the default title', function () {
        // get page title element
        var pageTitle = elCustom[0].querySelector('.site-title');

        // validate it matches custom app name
        expect(pageTitle.textContent).to.equal('My App');
    });

    it('should have a default nav', function () {
        // get first nav section
        var navTitle = el[0].querySelector('.nav-section-title');

        // validate it matches 'Encore'
        expect(navTitle.textContent).to.equal(defaultNav[0].title);
    });

    it('should allow you to override the default nav', function () {
        // get first nav section
        var navTitle = elCustom[0].querySelector('.nav-section-title');

        // validate it matches custom nav title
        expect(navTitle.textContent).to.equal(customNav[0].title);
    });

    it('should not show the collapsible toggle if collapsible is not true', function () {
        var collapsibleToggle = el[0].querySelector('.collapsible-toggle');

        expect(collapsibleToggle).to.be.null;
    });

    it('should allow you to set the menu as collapsible', function () {
        var collapsibleToggle = elCollapsible[0].querySelector('.collapsible-toggle');

        expect(collapsibleToggle).to.be.ok;
    });

    it('should set the external collapsedNav value when you toggle the collapsed button', function () {
        var elScope = elCollapsibleVar.isolateScope();

        expect(scope.collapsed).to.be.not.ok;
        elScope.collapseMenu();

        // Have to run the digest cycle manually to get the var to propagate up
        scope.$digest();
        expect(scope.collapsed).to.be.ok;
    });

    it('should apply the classes to the menu for collapsible status', function () {
        var collapsibleMenu = elCollapsible[0].querySelector('.collapsible');

        expect(collapsibleMenu).to.be.not.null;
    });

    it('should apply the classes to the menu for collapsed status', function () {
        var elScope = elCollapsible.isolateScope();
        var collapsibleMenu = elCollapsible[0].querySelector('.collapsed');

        expect(collapsibleMenu).to.be.null;
        elScope.collapseMenu();

        // We need to run the digest to update the classes
        scope.$digest();
        collapsibleMenu = elCollapsible[0].querySelector('.collapsed');
        expect(collapsibleMenu).to.be.not.null;
    });
});

describe('rxAppNav', function () {
    var scope, compile, rootScope, el;
    var template = '<rx-app-nav items="menuItems" level="1"></rx-app-nav>';

    var menuItems = [{
        href: '/1',
        linkText: '1st Order Item'
    }];

    beforeEach(function () {
        // load module
        module('encore.ui.rxApp');
        module('encore.ui.rxEnvironment');

        // load templates
        module('templates/rxAppNav.html');
        module('templates/rxAppNavItem.html');

        // Inject in angular constructs
        inject(function ($rootScope, $compile) {
            rootScope = $rootScope;
            scope = $rootScope.$new();
            compile = $compile;
        });

        scope.menuItems = menuItems;

        el = helpers.createDirective(template, compile, scope);
    });

    it('should exist', function () {
        expect(el).to.have.length.of.at.least(1);
        expect(el.children()).to.have.length.of.at.least(1);
    });

    it('should add "level" class of appropriate level', function () {
        expect(el.hasClass('rx-app-nav-level-1')).to.be.true;
    });

//    TODO allow children to be dynamically injected
});

describe('rxAppNavItem', function () {
    var scope, compile, rootScope, el, location, someProp;
    var template = '<rx-app-nav-item item="item"></rx-app-nav-item>';

    var menuItem = {
        href: { tld: 'example', path: 'myPath' },
        linkText: '1st',
        directive: 'fake-directive',
        visibility: function () {
            return true;
        },
        childHeader: 'some value',
        children: [
            {
                href: '/1-1',
                linkText: '1st-1st',
                childVisibility: function () {
                    return false;
                },
                children: [
                    {
                        href: '/1-1-1',
                        linkText: '1st-1st-1st'
                    }
                ]
            }, {
                href: '/1-2',
                visibility: '2 + 2 == 4',
                linkText: '1st-2nd'
            }, {
                linkText: '1st-3rd',
                visibility: function () {
                    return someProp;
                },
                children: [
                    {
                        href: '/1-3-1',
                        linkText: '1st-3rd-1st'
                    }
                ]
            }
        ]
    };

    beforeEach(function () {
        // load module
        module('encore.ui.rxApp');
        module('encore.ui.rxCompile');

        // load templates
        module('templates/rxAppNav.html');
        module('templates/rxAppNavItem.html');

        // Inject in angular constructs
        inject(function ($rootScope, $compile, $location) {
            rootScope = $rootScope;
            scope = $rootScope.$new();
            compile = $compile;
            location = $location;
        });

        scope.item = _.clone(menuItem, true);

        el = helpers.createDirective(template, compile, scope);
    });

    afterEach(function () {
        el = null;
        scope = null;
    });

    it('should exist', function () {
        expect(el).to.have.length.of.at.least(1);
        expect(el.children()).to.have.length.of.at.least(2);
    });

    it('should hide if visibility property evaluates to false', function () {
        // check that first item is visible (since no 'visibility' property)
        expect(el.className).to.not.contain('ng-hide');

        // NOTE: this retreives *all* the child nav items, including the sub-child ones
        // This is why indexing is a little off
        var children = el[0].querySelectorAll('.item-children .rx-app-nav-item');

        // check that first level 2 item is visible (since 'visibility' function returns true)
        expect(children[0].className, 'first child, function').to.not.contain('ng-hide');

        // check that second level 2 item is visible (since 'visibility' expression == true)
        expect(children[2].className, 'middle child, expression').to.not.contain('ng-hide');

        // check that third level 2 item is not visible (since 'visibility' function currently returns false)
        expect(children[3].className, 'last child').to.contain('ng-hide');

        // we need to set the property that the visibility function is checking to true
        someProp = true;
        scope.$digest();

        // now that visibility = true, el should not be hidden
        expect(children[3].className, 'last child, after someProp = true').to.not.contain('ng-hide');
    });

    it('should show/hide children based on childVisibility value', function () {
        // get children element
        var children = el[0].querySelectorAll('.item-children');

        expect(children[0].className, 'All Children').to.not.contain('ng-hide');
        expect(children[1].className, '1st Subnav Children').to.contain('ng-hide');
    });

    it('should build directive if available', function () {
        // get directive
        var directive = el[0].querySelector('.item-directive');

        expect(directive).to.exist;
        expect(directive.className).to.not.contain('.ng-hide');

        // sanity check that it correctly built directive HTML
        expect(directive.innerHTML).to.contain('<' + menuItem.directive);
        expect(directive.innerHTML).to.contain('</' + menuItem.directive + '>');
    });

    it('should increment the child nav level', function () {
        // get children element
        var children = el[0].querySelector('.item-children .rx-app-nav');
        children = angular.element(children);
        expect(children.hasClass('rx-app-nav-level-2')).to.be.true;
    });

    it('should show header for children if present', function () {
        // get child header element
        var childHeader = el[0].querySelector('.child-header');

        expect(childHeader.textContent).to.equal(menuItem.childHeader);
    });
});

describe('rxPage', function () {
    var scope, compile, rootScope, el;
    var template = '<rx-page></rx-page>';

    beforeEach(function () {
        // load module
        module('encore.ui.rxApp');

        // load templates
        module('templates/rxPage.html');

        // Inject in angular constructs
        inject(function ($rootScope, $compile) {
            rootScope = $rootScope;
            scope = $rootScope.$new();
            compile = $compile;
        });

        el = helpers.createDirective(template, compile, scope);
    });

    it('should exist', function () {
        expect(el).to.have.length.of.at.least(1);
        expect(el.children()).to.have.length.of.at.least(1);
    });
});