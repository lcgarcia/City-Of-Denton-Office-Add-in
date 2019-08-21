/*
 * Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
 * See LICENSE in the project root for license information.
 */

'use strict';

var app = angular.module('ks-2-harvest', ['ui.router']);

app.config(['$logProvider', '$stateProvider', '$urlRouterProvider',
  function($logProvider, $stateProvider, $urlRouterProvider) {
    // set debug logging to on
    if ($logProvider.debugEnabled) {
      $logProvider.debugEnabled(true);
    }
    $stateProvider
      .state('setup', {
        url: '/setup',
        controller: 'setupCtrl',
        abstract: true,
        templateUrl: 'application/partials/setup.html',
        params: {
          data: {
            user: null
          }
        }
      })
      .state('setup.budget', {
        url: '/budget/:type',
        controller: 'budgetCtrl',
        templateUrl: 'application/partials/budget.html'
      })
      .state('setup.jobcost', {
        url: '/jobcost/:type',
        controller: 'jobcostCtrl',
        templateUrl: 'application/partials/jobcost.html'
      })
      .state('setup.jobcost2', {
        url: '/jobcost2/:type',
        controller: 'jobcost2Ctrl',
        templateUrl: 'application/partials/jobcost2.html'
      })
      .state('home', {
        url: '/home',
        controller: 'HomeController',
        templateUrl: 'application/partials/home.html'
      })
      .state('login', {
        url: '/login',
        controller: 'loginCtrl',
        templateUrl: 'application/partials/login.html',
        params: {
          data: {
            user: null
          }
        }
      })
    
    $urlRouterProvider.otherwise('/login')
    
  }
])