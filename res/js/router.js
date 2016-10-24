app.config(function($routeProvider, $locationProvider) {
	$routeProvider
	.when('/', {
		templateUrl : '/tmpl/index.html',
		controller: 'loginController'		
	})
	.when('/signup', {
		templateUrl : '/tmpl/signup.html',
		controller: 'signupController'		
	})
	/*
	Customer routes
	 */
	.when('/c/dashboard', {
		templateUrl : '/tmpl/customer/dashboard.html',
		controller: 'customerDashboardController'		
	})
	.when('/c/contracts', {
		templateUrl : '/tmpl/customer/contracts.html',
		controller: 'customerContractsController'		
	})
	.when('/c/contract/view/:id', {
		templateUrl : '/tmpl/customer/contract.html',
		controller: 'customerContractController'		
	})
	/*
	Admin routes
	 */
	.when('/a/dashboard', {
		templateUrl : '/tmpl/admin/dashboard.html',
		controller: 'adminDashboardController'		
	})
	.when('/a/maillist/view/:id', {
		templateUrl : '/tmpl/admin/maillist.html',
		controller: 'adminMaillistController'		
	})
	.when('/a/contracts', {
		templateUrl : '/tmpl/admin/contracts.html',
		controller: 'adminContractsController'		
	})
	.when('/a/contract/view/:id', {
		templateUrl : '/tmpl/admin/contract.html',
		controller: 'adminContractController'		
	})
	.when('/a/customer/view/:id', {
		templateUrl : '/tmpl/admin/customer.html',
		controller: 'adminCustomerController'		
	})
	.otherwise({
		redirectTo : '/'
	});

	$locationProvider.html5Mode(true);
});