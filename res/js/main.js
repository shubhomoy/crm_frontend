var env = {};
if(window) {
	Object.assign(env, window.__env);
}
var app = angular.module('crm', ['ngRoute', 'ngMaterial', 'chart.js']);
app.constant('__env', env);

app.factory('crmService', function($rootScope) {
	return {
		apiUrl: __env.apiUrl,
		header : {
			headers : {
				id : localStorage.getItem('id'),
				accessToken : localStorage.getItem('token')
			}
		},
		checkResponse : function(response) {
			if(response.code != undefined) {
				if(response.code != 500) {
					return true;
				}else{
					$rootScope.logout();
					return false;
				}	
			}
			return true;
		},
		checkAuthStatus: function() {
			if(localStorage.getItem('id') == null || localStorage.getItem('token') == null) {
				$rootScope.logout();
			}
		},
		formatDate: function(date) {
			var d = new Date(date),
			month = '' + (d.getMonth() + 1),
	        day = '' + d.getDate(),
	        year = d.getFullYear();

		    if (month.length < 2) month = '0' + month;
		    if (day.length < 2) day = '0' + day;
		    return [year, month, day].join('-');
		}
	};
});

app.run(function($rootScope) {
	$rootScope.profile = {
		name: localStorage.getItem('name'),
		email: localStorage.getItem('email')
	};
	$rootScope.logout = function() {
		localStorage.clear();
		document.location.href = '/';
	},
	$rootScope.isLoggedIn = function() {
		if(localStorage.getItem('id') != null) {
			return true;
		}
		return false;
	}
});

app.controller('loginController', function($scope, $rootScope, $http, crmService, $mdToast) {
	$scope.loginCreds = {
		email: '',
		password: '',
		as: ''
	};
	$scope.login = function() {
		if($scope.loginCreds.email == '' || $scope.loginCreds.password == '' || $scope.loginCreds.as == '') {
			$mdToast.show($mdToast.simple().textContent('Invalid login credentials').position('bottom right'));
			return;
		}
		$('#loginBtn').attr({'disabled': 'disabled'});
		if($scope.loginCreds.as === 'a') {
			$http.post(crmService.apiUrl + '/auth/admin/signin', $scope.loginCreds)
			.success(function(response) {
				if(response.code == 1) {
					localStorage.setItem('id', response.data.id);
					localStorage.setItem('token', response.data.token);
					document.location.href = "/a/dashboard";
				}else{
					$mdToast.show($mdToast.simple().textContent('Incorrect login credentials').position('bottom right'));
				}
				$('#loginBtn').removeAttr('disabled');
			});
		}else {
			$http.post(crmService.apiUrl + '/auth/customer/signin', $scope.loginCreds)
			.success(function(response) {
				if(response.code == 1) {
					localStorage.setItem('id', response.data.id);
					localStorage.setItem('token', response.data.token);
					document.location.href = "/c/dashboard";
				}else{
					$mdToast.show($mdToast.simple().textContent('Incorrect login credentials').position('bottom right'));	
				}
				$('#loginBtn').removeAttr('disabled');
			});
		}
	};
});

app.controller('signupController', function($scope, $rootScope, $http, crmService, $mdToast) {
	$scope.signupCreds = {
		email: '',
		name: '',
		password: '',
		as: ''
	};
	$scope.signup = function() {
				if($scope.signupCreds.email == '' || $scope.signupCreds.password == '' || $scope.signupCreds.as == '' || $scope.signupCreds.name == '') {
			$mdToast.show($mdToast.simple().textContent('Invalid login credentials').position('bottom right'));
			return;
		}
		$('#signupBtn').attr({'disabled': 'disabled'});
		if($scope.signupCreds.as === 'a') {
			$http.post(crmService.apiUrl + '/auth/admin/signup', $scope.signupCreds)
			.success(function(response) {
								if(response.code == 2) {
					$mdToast.show($mdToast.simple().textContent('User already exists').position('bottom right'));
				}else{
					$mdToast.show($mdToast.simple().textContent('Successfully Signed up').position('bottom right'));
					document.location.href = '/';
				}
				$('#signupBtn').removeAttr('disabled');
			});
		}else {
			$http.post(crmService.apiUrl + '/auth/customer/signup', $scope.signupCreds)
			.success(function(response) {
				if(response.code == 2) {
					$mdToast.show($mdToast.simple().textContent('User already exists').position('bottom right'));
				}else{
					$mdToast.show($mdToast.simple().textContent('Successfully Signed up').position('bottom right'));
					document.location.href = '/';
				}
				$('#signupBtn').removeAttr('disabled');
			});
		}
	};
});

/*
Customer controllers
 */

app.controller('customerDashboardController', function($scope, $rootScope, $http, crmService, $mdDialog) {
	crmService.checkAuthStatus();
	$rootScope.profile = {};
	$scope.contracts = [];

	$scope.contractsData = {
		completed: 0,
		assigned: 0,
		inprogress: 0,
		unassigned: 0,
		total: 0
	};
	$scope.contractsChart = {
		labels: ["Unassigned", "Assigned", "In porgress", "Completed"],
		data: []
	};

	crmService.checkAuthStatus();
	$http.get(crmService.apiUrl + '/c/profile', crmService.header)
	.success(function(response) {
		if(crmService.checkResponse(response)) {
			$rootScope.profile = response.data;
			localStorage.setItem('name', $rootScope.profile.name);
			localStorage.setItem('email', $rootScope.profile.email);
		}
	});

	$http.get(crmService.apiUrl + '/c/contracts', crmService.header)
	.success(function(response) {
				$scope.contracts = response.data;
		$scope.contracts.forEach(function(contract) {
			if(contract.status == 0) {
				$scope.contractsData.unassigned++;
			}else if(contract.status == 1) {
				$scope.contractsData.assigned++;
			}else if(contract.status == 2) {
				$scope.contractsData.inprogress++;
			}else{
				$scope.contractsData.completed++;
			}
			$scope.contractsData.total++;
		});
		$scope.contractsChart.data.push(($scope.contractsData.unassigned/$scope.contractsData.total)*100);
		$scope.contractsChart.data.push(($scope.contractsData.assigned/$scope.contractsData.total)*100);
		$scope.contractsChart.data.push(($scope.contractsData.inprogress/$scope.contractsData.total)*100);
		$scope.contractsChart.data.push(($scope.contractsData.completed/$scope.contractsData.total)*100);
			});

	$scope.newContract = function(ev) {
		$mdDialog.show({
			controller: 'createContractController',
			templateUrl: '/tmpl/customer/dialogs/createContract.html',
			parent: angular.element(document.body),
			targetEvent: ev,
			clickOutsideToClose: true,
			fullscreen: $scope.customFullscreen
		});
	};

	$scope.closeDialog = function() {
		$mdDialog.hide();
	};
});

app.controller('customerContractsController', function($scope, $rootScope, $http, crmService, $mdDialog) {
	crmService.checkAuthStatus();
	$scope.contracts = [];
	$scope.data = {
		completed: 0,
		assigned: 0,
		inprogress: 0,
		unassigned: 0,
		total: 0
	};
	$scope.chart = {
		labels: ["Unassigned", "Assigned", "In porgress", "Completed"],
		data: []
	}

	$http.get(crmService.apiUrl + '/c/contracts', crmService.header)
	.success(function(response) {
		crmService.checkResponse(response);
		$scope.contracts = response.data;
		$scope.contracts = $scope.contracts.reverse();
		$scope.contracts.forEach(function(contract) {
			if(contract.status == 0) {
				$scope.data.unassigned++;
			}else if(contract.status == 1) {
				$scope.data.assigned++;
			}else if(contract.status == 2) {
				$scope.data.inprogress++;
			}else{
				$scope.data.completed++;
			}
			$scope.data.total++;
		});
		$scope.chart.data.push(Math.floor(($scope.data.unassigned/$scope.data.total)*100));
		$scope.chart.data.push(Math.floor(($scope.data.assigned/$scope.data.total)*100));
		$scope.chart.data.push(Math.floor(($scope.data.inprogress/$scope.data.total)*100));
		$scope.chart.data.push(Math.floor(($scope.data.completed/$scope.data.total)*100));
	});

	$scope.newContract = function(ev) {
		$mdDialog.show({
			controller: 'createContractController',
			templateUrl: '/tmpl/customer/dialogs/createContract.html',
			parent: angular.element(document.body),
			targetEvent: ev,
			clickOutsideToClose: true,
			fullscreen: $scope.customFullscreen
		});
	};
});	

app.controller('createContractController', function($scope, $rootScope, $http, crmService, $mdDialog, $mdToast) {
	crmService.checkAuthStatus();
	$scope.contract = {};
	$scope.create = function() {
		$http.post(crmService.apiUrl + '/c/contract', $scope.contract, crmService.header)
		.success(function(response) {
			crmService.checkResponse(response);
						$mdDialog.hide();
			$mdToast.show($mdToast.simple().textContent('Contract successfully created').position('bottom right'));
		});
	};

	$scope.closeDialog = function() {
		$mdDialog.hide();
	};
});

app.controller('customerContractController', function($scope, $rootScope, $http, crmService, $mdDialog, $routeParams) {
	crmService.checkAuthStatus();
	$scope.contract = {};
	$scope.remarks = '';

	$http.get(crmService.apiUrl + '/c/contract/' + $routeParams.id, crmService.header)
	.success(function(response) {
				response.data.created_at = new Date(response.data.created_at);
		response.data.updated_at = new Date(response.data.updated_at);
		if(response.data.expires_in != null) {
			response.data.expires_in = new Date(response.data.expires_in);
		}else{
			response.data.expires_in = new Date();
		}
		$scope.contract = response.data;
	});

	$scope.askStatusDialog = function(ev) {
		$mdDialog.show({
			contentElement: '#ask-status-dialog',
			parent: angular.element(document.body),
			clickOutsideToClose: true
		});
	};

	$scope.askStatus = function() {
		var data = {
			remarks: $scope.remarks
		};
		$http.post(crmService.apiUrl + '/c/contract/email/query/' + $scope.contract.id, data, crmService.header)
		.success(function(response) {
						$scope.contract.email_queries.push(response.data);
			$mdDialog.hide();
		});
	};

	$scope.closeDialog = function() {
		$mdDialog.hide();
	};
});




/*
Admin Controllers
 */
app.controller('adminDashboardController', function($scope, $rootScope, $http, crmService, $mdDialog) {
	crmService.checkAuthStatus();
	$scope.contracts = [];
	$scope.customers = [];
	$rootScope.maillists = [];

	$http.get(crmService.apiUrl + '/a/profile', crmService.header)
	.success(function(response) {
				crmService.checkResponse(response);
		$rootScope.profile = response.data;
		localStorage.setItem('name', $rootScope.profile.name);
		localStorage.setItem('email', $rootScope.profile.email);
	});

	$scope.customers = [];

	$http.get(crmService.apiUrl + '/a/customers', crmService.header)
	.success(function(response) {
				crmService.checkResponse(response);
		$scope.customers = response.data;
	});

	$http.get(crmService.apiUrl + '/a/maillists', crmService.header)
	.success(function(response) {
				crmService.checkResponse(response);
		$rootScope.maillists = response.data;
	});

	$scope.contractsData = {
		completed: 0,
		assigned: 0,
		inprogress: 0,
		unassigned: 0,
		total: 0
	};
	$scope.contractsChart = {
		labels: ["Unassigned", "Assigned", "In porgress", "Completed"],
		data: []
	};

	$http.get(crmService.apiUrl + '/a/contracts', crmService.header)
	.success(function(response) {
		crmService.checkResponse(response);
				$scope.contracts = response.data;
		$scope.contracts.forEach(function(contract) {
			if(contract.status == 0) {
				$scope.contractsData.unassigned++;
			}else if(contract.status == 1) {
				$scope.contractsData.assigned++;
			}else if(contract.status == 2) {
				$scope.contractsData.inprogress++;
			}else{
				$scope.contractsData.completed++;
			}
			$scope.contractsData.total++;
		});
		$scope.contractsChart.data.push(Math.floor(($scope.contractsData.unassigned/$scope.contractsData.total)*100));
		$scope.contractsChart.data.push(Math.floor(($scope.contractsData.assigned/$scope.contractsData.total)*100));
		$scope.contractsChart.data.push(Math.floor(($scope.contractsData.inprogress/$scope.contractsData.total)*100));
		$scope.contractsChart.data.push(Math.floor(($scope.contractsData.completed/$scope.contractsData.total)*100));
			});

	$scope.newMailList = function(ev) {
		$mdDialog.show({
			controller: 'createMailListController',
			templateUrl: '/tmpl/admin/dialogs/createMailList.html',
			parent: angular.element(document.body),
			targetEvent: ev,
			clickOutsideToClose: true,
			fullscreen: $scope.customFullscreen
		});
	};

	$scope.deleteMaillist = function(ev, maillist) {
		var confirm = $mdDialog.confirm()
		.title('Delete this Mail list?')
		.textContent('Are you sure you want to delete this mail list?')
		.targetEvent(ev)
		.ok('Yes')
		.cancel('No');

		$mdDialog.show(confirm).then(function() {
			$http.get(crmService.apiUrl + '/a/maillist/delete/' + maillist.id, crmService.header)
					.success(function(response) {
						crmService.checkResponse(response);
												$rootScope.maillists.splice($rootScope.maillists.indexOf(maillist), 1);
						$mdDialog.hide();
					});
		}, function() {
			$mdDialog.hide();
		});
	};

});	

app.controller('adminMaillistController', function($scope, $rootScope, $http, crmService, $mdDialog, $routeParams) {
	crmService.checkAuthStatus();
	$('#progress').hide();
	$scope.maillist = {};
	$scope.email = {
		subject: '',
		body: ''
	};

	$http.get(crmService.apiUrl + '/a/maillist/' + $routeParams.id, crmService.header)
	.success(function(response) {
				crmService.checkResponse(response);
		$scope.maillist = response.data;
	});

	$scope.closeDialog = function() {
		$mdDialog.hide();
	};

	$scope.showMailDialog = function(ev, contract) {
		$mdDialog.show({
			contentElement: '#email-dialog',
			parent: angular.element(document.body),
			clickOutsideToClose: true
		});
	};

	$scope.sendEmail = function() {
		$('#progress').show();
		$('#submit').attr({'disabled': 'disabled'});
		$http.post(crmService.apiUrl + '/a/maillist/send/' + $routeParams.id, $scope.email, crmService.header)
		.success(function(response) {
			crmService.checkResponse(response);
						$('#progress').hide();
			$('#submit').removeAttr('disabled');
			$scope.email.subject = '';
			$scope.email.body = '';
			$scope.closeDialog();
		});
	};
});

app.controller('createMailListController', function($scope, $rootScope, $http, crmService, $mdDialog) {
	crmService.checkAuthStatus();
	$scope.customers = [];
	$scope.data = {
		name: '',
		selected: []
	}

	$scope.closeDialog = function() {
		$mdDialog.hide();
	};

	$http.get(crmService.apiUrl + '/a/customers', crmService.header)
	.success(function(response) {
				crmService.checkResponse(response);
		$scope.customers = response.data;
	});

	$scope.exists = function(customer) {
		return $scope.data.selected.indexOf(customer.id) > -1;
	};

	$scope.isChecked = function() {
    	return $scope.data.selected.length === $scope.customers.length;
  	};

  	$scope.toggleAll = function() {
    	if ($scope.data.selected.length === $scope.customers.length) {
      		$scope.data.selected = [];
    	} else if ($scope.data.selected.length === 0 || $scope.data.selected.length > 0) {
      		$scope.customers.forEach(function(customer) {
      			$scope.data.selected.push(customer.id);
      		});
    	}	
  	};

  	$scope.isIndeterminate = function() {
		return ($scope.data.selected.length !== 0 && $scope.data.selected.length !== $scope.customers.length);
	};

	$scope.toggle = function (customer) {
		var idx = $scope.data.selected.indexOf(customer.id);
    	if (idx > -1) {
      		$scope.data.selected.splice(idx, 1);
    	}else {
      		$scope.data.selected.push(customer.id);
    	}
  	};

  	$scope.createMailList = function() {
  		$http.post(crmService.apiUrl + '/a/maillist/create', $scope.data, crmService.header)
  		.success(function(response) {
  			$mdDialog.hide();
  			crmService.checkResponse(response);
  			$rootScope.maillists.push(response.data);
  		});
  	};
});

app.controller('adminCustomersController', function($scope, $rootScope, $http, crmService) {
	crmService.checkAuthStatus();
	$scope.customers = [];

	$http.get(crmService.apiUrl + '/a/customers', crmService.header)
	.success(function(response) {
				crmService.checkResponse(response);
		$scope.customers = response.data;
	});
});

app.controller('adminContractsController', function($scope, $rootScope, $http, crmService) {
	crmService.checkAuthStatus();
	$scope.contracts = [];
	$scope.data = {
		completed: 0,
		assigned: 0,
		inprogress: 0,
		unassigned: 0,
		total: 0
	};
	$scope.chart = {
		labels: ["Unassigned", "Assigned", "In porgress", "Completed"],
		data: []
	}

	$http.get(crmService.apiUrl + '/a/contracts', crmService.header)
	.success(function(response) {
				crmService.checkResponse(response);
		$scope.contracts = response.data;
		$scope.contracts = $scope.contracts.reverse();
		$scope.contracts.forEach(function(contract) {
			if(contract.status == 0) {
				$scope.data.unassigned++;
			}else if(contract.status == 1) {
				$scope.data.assigned++;
			}else if(contract.status == 2) {
				$scope.data.inprogress++;
			}else{
				$scope.data.completed++;
			}
			$scope.data.total++;
		});
		$scope.chart.data.push(Math.floor(($scope.data.unassigned/$scope.data.total)*100));
		$scope.chart.data.push(Math.floor(($scope.data.assigned/$scope.data.total)*100));
		$scope.chart.data.push(Math.floor(($scope.data.inprogress/$scope.data.total)*100));
		$scope.chart.data.push(Math.floor(($scope.data.completed/$scope.data.total)*100));
			});
});	


app.controller('adminContractController', function($scope, $rootScope, $http, crmService, $routeParams, $mdDialog, $window, $mdToast) {
	$('#progress').hide();
	crmService.checkAuthStatus();
	$scope.contract = {};
	$scope.tempData = {};
	$scope.email = {
		contract_id: $routeParams.id,
		subject: '',
		to: '',
		from: $rootScope.profile.email,
		body: ''
	};

	$http.get(crmService.apiUrl + '/a/contract/' + $routeParams.id, crmService.header)
	.success(function(response) {
				crmService.checkResponse(response);
		response.data.created_at = new Date(response.data.created_at);
		response.data.updated_at = new Date(response.data.updated_at);
		if(response.data.expires_in != null) {
			response.data.expires_in = new Date(response.data.expires_in);
		}else{
			response.data.expires_in = new Date();
		}
		$scope.contract = response.data;
		$scope.email.to = $scope.contract.customer.email;
		$scope.email.subject = 'Regarding contract - ' + $scope.contract.title;
		$scope.email.contract_id = $scope.contract.id;
	});

	$scope.showUpdateDialog = function(ev, contract) {
		$scope.tempData = $scope.contract;
		$mdDialog.show({
			contentElement: '#update-dialog',
			parent: angular.element(document.body),
			clickOutsideToClose: true
		});
	};

	$scope.showMailDialog = function(ev, contract) {
		$mdDialog.show({
			contentElement: '#email-dialog',
			parent: angular.element(document.body),
			clickOutsideToClose: true
		});
	};

	$scope.sendEmail = function() {
		$('#progress').show();
		$('#submit').attr({'disabled': 'disabled'});
		$http.post(crmService.apiUrl + '/a/sendmail', $scope.email, crmService.header)
		.success(function(response) {
						crmService.checkResponse(response);
			$('#progress').hide();
			$('#submit').removeAttr('disabled');
			$scope.closeDialog();
		});
	};

	$scope.closeDialog = function() {
		$mdDialog.hide();
	};

	$scope.deleteContract = function(ev) {
		var confirm = $mdDialog.confirm()
		.title('Delete this contract?')
		.textContent('Are you sure you want to delete this contract?')
		.targetEvent(ev)
		.ok('Yes')
		.cancel('No');

		$mdDialog.show(confirm).then(function() {
			$http.post(crmService.apiUrl + '/a/contract/' + $routeParams.id + '/delete', {}, crmService.header)
					.success(function(response) {
						crmService.checkResponse(response);
												$window.history.back();
					});
		}, function() {
			$mdDialog.hide();
		});
		
	};

	$scope.update = function() {
		if($scope.contract.expires_in != null) {
			$scope.contract.expires_in = crmService.formatDate($scope.contract.expires_in);
		}
		$http.post(crmService.apiUrl + '/a/contract/' + $routeParams.id + '/update', $scope.contract, crmService.header)
		.success(function(response) {
			crmService.checkResponse(response);
			$scope.contract = response.data;
			response.data.created_at = new Date(response.data.created_at);
			response.data.updated_at = new Date(response.data.updated_at);
			if(response.data.expires_in != null) {
				response.data.expires_in = new Date(response.data.expires_in);
			}else{
				response.data.expires_in = new Date();
			}
			$mdDialog.hide();
						$mdToast.show($mdToast.simple().textContent('Contract updated').position('bottom right'));
		});
	};

	$scope.assign = function(ev) {
		var confirm = $mdDialog.confirm()
		.title('Assign this contract to you?')
		.textContent('This contract will be assigned to you. Are you sure you want to continue?')
		.targetEvent(ev)
		.ok('Yes')
		.cancel('No');

		$mdDialog.show(confirm).then(function() {
			$http.post(crmService.apiUrl + '/a/contract/' + $routeParams.id + '/assign', {}, crmService.header)
			.success(function(response) {
								crmService.checkResponse(response);
				response.data.created_at = new Date(response.data.created_at);
				response.data.updated_at = new Date(response.data.updated_at);
				if(response.data.expires_in != null) {
					response.data.expires_in = new Date(response.data.expires_in);
				}else{
					response.data.expires_in = new Date();
				}
				$scope.contract = response.data;
				$mdToast.show($mdToast.simple().textContent('Contract assigned to you').position('bottom right'));
			});
		}, function() {

		});
	};
});	

app.controller('adminCustomerController', function($scope, $rootScope, $http, crmService, $routeParams) {
	crmService.checkAuthStatus();
	$scope.customer = {};
	$scope.data = {
		completed: 0,
		assigned: 0,
		inprogress: 0,
		unassigned: 0,
		total: 0
	};
	$scope.chart = {
		labels: ["Unassigned", "Assigned", "In porgress", "Completed"],
		data: []
	};

	$http.get(crmService.apiUrl + '/a/customer/' + $routeParams.id, crmService.header)
	.success(function(response) {
				crmService.checkResponse(response);
		$scope.customer = response.data;
		$scope.customer.contracts = $scope.customer.contracts.reverse();
		$scope.customer.contracts.forEach(function(contract) {
			if(contract.status == 0) {
				$scope.data.unassigned++;
			}else if(contract.status == 1) {
				$scope.data.assigned++;
			}else if(contract.status == 2) {
				$scope.data.inprogress++;
			}else{
				$scope.data.completed++;
			}
			$scope.data.total++;
		});
		$scope.chart.data.push(Math.floor(($scope.data.unassigned/$scope.data.total)*100));
		$scope.chart.data.push(Math.floor(($scope.data.assigned/$scope.data.total)*100));
		$scope.chart.data.push(Math.floor(($scope.data.inprogress/$scope.data.total)*100));
		$scope.chart.data.push(Math.floor(($scope.data.completed/$scope.data.total)*100));
	});
});	