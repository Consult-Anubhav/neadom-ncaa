var app = angular.module('ncaa', []);
app.controller('ncaaController', function ($scope, $http) {

    $scope.data = [];
    $scope.api_env = 'live';
    $scope.max_colors = 0;
    $scope.selected_sport = undefined;
    $scope.errors = [];
    $scope.sports = [];
    $scope.login_form = {
        function: "usr_login",
        device_tkn: "",
        // email: "gopujkarsiddhid@gmail.com",
        // password: "abc123"
    };

    $scope.api = {
        live: {
            list: 'https://new-azfn-draftsy.azurewebsites.net/api/NCAASportList?code=-I_Q7hBy_GklGzfdXQHXIXK95bX3z-vfE4GNgbBUoI5-AzFu3SORnw==',
            fetch: 'https://new-azfn-draftsy.azurewebsites.net/api/NCAAcolors?code=-I_Q7hBy_GklGzfdXQHXIXK95bX3z-vfE4GNgbBUoI5-AzFu3SORnw==',
            save: 'https://new-azfn-draftsy.azurewebsites.net/api/NCAAColorApproved?code=-I_Q7hBy_GklGzfdXQHXIXK95bX3z-vfE4GNgbBUoI5-AzFu3SORnw==',
            refresh: 'https://new-azfn-draftsy.azurewebsites.net/api/loginAPI?code=-I_Q7hBy_GklGzfdXQHXIXK95bX3z-vfE4GNgbBUoI5-AzFu3SORnw=='
        },
        test: {
            list: 'https://newdraftsytesting.azurewebsites.net/api/NCAASportList?code=-I_Q7hBy_GklGzfdXQHXIXK95bX3z-vfE4GNgbBUoI5-AzFu3SORnw==',
            fetch: 'https://newdraftsytesting.azurewebsites.net/api/NCAAcolors?code=-I_Q7hBy_GklGzfdXQHXIXK95bX3z-vfE4GNgbBUoI5-AzFu3SORnw==',
            save: 'https://newdraftsytesting.azurewebsites.net/api/NCAAColorApproved?code=-I_Q7hBy_GklGzfdXQHXIXK95bX3z-vfE4GNgbBUoI5-AzFu3SORnw==',
            refresh: 'https://newdraftsytesting.azurewebsites.net/api/loginAPI?code=-I_Q7hBy_GklGzfdXQHXIXK95bX3z-vfE4GNgbBUoI5-AzFu3SORnw=='
        },
        local: {
            list: 'http://localhost:7071/api/NCAASportList',
            fetch: 'http://localhost:7071/api/NCAAcolors',
            save: 'http://localhost:7071/api/NCAAColorApproved',
            refresh: 'http://localhost:7071/api/loginAPI'
        }
    }

    $scope.init = function () {
        $("#preloader").fadeIn();
        $http.get($scope.api[$scope.api_env].list, {
            headers: {'Session-Token':$scope.getToken()}
        })
            .then(function (response) {
                $scope.updateToken(response.headers('Session-Token'));
                $scope.sports = response.data;
                $("#preloader").fadeOut();
            })
            .catch(function (e) {
                $scope.errors = e;
                $scope.checkErrorCode(e.status);
                $('#failureModal').modal('show');
                $("#preloader").fadeOut();
            });
    };

    $scope.refreshToken = function () {
        $("#preloader").fadeIn();
        form = {
            function: 'refreshToken',
            uid: $scope.getUserId(),
            "Refresh-Token": $scope.getRefreshToken()
        };
        $http({
            method: 'POST',
            url:$scope.api[$scope.api_env].refresh,
            data: form
        })
            .then(function (response) {
                $scope.updateToken(response.headers('Session-Token'))
                $("#preloader").fadeOut();
            })
            .catch(function (e) {
                $scope.errors = e;
                $('#failureModal').modal('hide');
                $('#loginModal').modal('show');
                $("#preloader").fadeOut();
            });
    };

    $scope.submitLogin = function () {
        $("#preloader").fadeIn();
        $scope.login_form.function = "usr_login";
        $http({
            method: 'POST',
            url:$scope.api[$scope.api_env].refresh,
            data: $scope.login_form,
            // headers: {'Session-Token':$scope.getToken()}
        })
            .then(function (response) {
                $scope.setCredentials(response.headers('Session-Token'), response.data.data["User ID"],response.headers('Refresh-Token'));
                $('#loginModal').modal('hide');
                $("#preloader").fadeOut();
            })
            .catch(function (e) {
                $scope.errors = e;
                $('#failureModal').modal('hide');
                $("#preloader").fadeOut();
            });
    };

    $scope.logout = function () {
        localStorage.removeItem("Session-Token");
        localStorage.removeItem("Refresh-Token");
        localStorage.removeItem("User-Id");
    };

    $scope.initData = function (sportId = $scope.selected_sport) {
        $("#preloader").fadeIn();
        $scope.pagination_details = {};
        $scope.per_page_filter = 10;
        $scope.currentPage = 1;
        $scope.startPage = 0;
        $scope.endPage = 0;
        $http({
            method: 'POST',
            url:$scope.api[$scope.api_env].fetch,
            data: {input: [{sportId: sportId}]},
            headers: {'Session-Token':$scope.getToken()}
        })
            .then(function (response) {
                $scope.updateToken(response.headers('Session-Token'));
                response.data.Output.forEach(ele => {
                    if ($scope.max_colors < ele.teamColorCodes.length)
                        $scope.max_colors = ele.teamColorCodes.length;

                    let arr = [];

                    ele.teamColorCodes.forEach(color => {
                        if (color !== null && arr.indexOf(color) === -1)
                            arr.push(color);
                    })

                    ele.teamColorCodes = arr;
                });

                $scope.data = response.data.Output;
                $scope.paginateData($scope.pagination_details.current_page ? $scope.pagination_details.current_page : 1);

                $("#preloader").fadeOut();
            })
            .catch(function (e) {
                $scope.errors = e;
                $scope.data = [];
                $scope.paginated_data = [];
                $scope.pagination_details = {};
                $scope.checkErrorCode(e.status);
                $('#failureModal').modal('show');
                $("#preloader").fadeOut();
            });
    };

    $scope.save = function () {
        $("#preloader").fadeIn();
        let new_data = {};

        new_data.input = [];

        $scope.pre_paginated_data.forEach(ele => {
            if (ele.selection && ele.selection.isselected == true && ele.temp_selected == true)
                new_data.input.push({
                    'teamName': ele.teamName,
                    'textColor': ele.selection.selectedfontColor,
                    'approvedColor': ele.selection.selectedColor,
                    'comment': (ele.comment && ele.comment != '') ? ele.comment : "",
                    'sportId': $scope.selected_sport
                });
        });

        $http({
            method: 'POST',
            url:$scope.api[$scope.api_env].save,
            data: new_data,
            headers: {'Session-Token':$scope.getToken()}
        })
            .then(function (response) {
                $scope.updateToken(response.headers('Session-Token'));
                $scope.initData();
                $('#successModal').modal('show');
            })
            .catch(function (e) {
                $scope.errors = e;
                $scope.checkErrorCode(e.status);
                $('#failureModal').modal('show');
            });

        $("#preloader").fadeOut();
    };

    $scope.setCredentials = function (token, uid,refresh_token) {
        localStorage.setItem("Session-Token", token);
        localStorage.setItem("Refresh-Token", refresh_token);
        localStorage.setItem("User-Id", uid);
    };

    $scope.updateToken = function (token) {
        if (token)
            localStorage.setItem("Session-Token", token);
    };

    $scope.getToken = function () {
        return localStorage.getItem("Session-Token");
    };

    $scope.getRefreshToken = function () {
        return localStorage.getItem("Refresh-Token");
    };

    $scope.getUserId = function () {
        return localStorage.getItem("User-Id");
    };

    $scope.checkErrorCode = function (code) {
        if (code === 403)
            $scope.refreshToken()
    };

    $scope.openColorPicker = function (id) {
        $('#' + id).trigger('click');
    };

    $scope.openComment = function (t) {
        $scope.modal_row = t;
        $('#commentModal').modal('show');
    };

    $scope.setApprovedColor = function (team, color) {
        team.selection = {};
        team.selection.isselected = true;
        team.selection.selectedColor = color;
        team.selection.selectedfontColor = contrastColor(color);
        team.temp_selected = true;
    };

    $scope.clearChanges = function (t) {
        t.selection.isselected = false;
        t.selection = t.old_selection;
        t.temp_selected = false;
        $('#commentModal').modal('show');
    };

    $scope.paginated_data = [];
    $scope.pagination_details = {};
    $scope.per_page_filter = 10;
    $scope.currentPage = 1;
    $scope.startPage = 0;
    $scope.endPage = 0;
    $scope.page_size = [10, 25, 50, 100, 250, 500];

    $scope.paginateData = function (page_number = null) {
        $("#preloader").fadeIn();

        if (page_number != null) {
            $scope.pagination_details.current_page = page_number;
        }

        //START - Stack Pointers and Pagination Details updater
        if ($scope.data.length <= $scope.per_page_filter) {
            //IF there is single page
            $scope.pagination_details.last_page = 1;
            $scope.pagination_details.from = 1;
            $scope.pagination_details.to = $scope.data.length;
        } else {
            //IF there are multiple pages
            let remainder = $scope.data.length % $scope.per_page_filter;

            if (remainder === 0) {
                //IF last page is a complete, last page size is equal to per page size
                $scope.pagination_details.last_page = parseInt(($scope.data.length / $scope.per_page_filter));

                //SET index for any of all complete pages
                $scope.pagination_details.to = $scope.per_page_filter * $scope.pagination_details.current_page;
                $scope.pagination_details.from = $scope.pagination_details.to - $scope.per_page_filter + 1;
            } else {
                //IF last page is not a complete, last page size is less than per page size
                $scope.pagination_details.last_page = parseInt(($scope.data.length / $scope.per_page_filter)) + 1;

                if ($scope.pagination_details.current_page < $scope.pagination_details.last_page) {
                    //SET index for any of complete pages except last page
                    $scope.pagination_details.to = $scope.per_page_filter * $scope.pagination_details.current_page;
                    $scope.pagination_details.from = $scope.pagination_details.to - $scope.per_page_filter + 1;
                } else {
                    //SET index for last page
                    $scope.pagination_details.to = ($scope.per_page_filter * ($scope.pagination_details.current_page - 1)) + remainder;
                    $scope.pagination_details.from = $scope.pagination_details.to - remainder + 1;
                }
            }
        }
        //END - Stack Pointers and Pagination Details updater

        //SET dropdown for all pages
        $scope.all_pages = [];

        for (let i = 1; i <= $scope.pagination_details.last_page; i++) {
            $scope.all_pages.push(i);
        }

        //SET marked or paginated array to the table
        $scope.pre_paginated_data = $scope.data.slice($scope.pagination_details.from - 1, $scope.pagination_details.to);

        $scope.pre_paginated_data.forEach((ele1, index1) => {
            ele1.old_selection = ele1.selection;
            ele1.teamColorCodes.forEach((ele2, index2) => {
                $scope.pre_paginated_data[index1].teamColorCodes[index2] = '#' + ele2.replace('#', '').substring(0, 6);
            });
        });

        $scope.paginated_data = [];

        $scope.pre_paginated_data.forEach(ele => {
            $scope.paginated_data.push(ele);
        });

        //START - Pagination Links for medium size screen
        $scope.pages = [];

        if ($scope.pagination_details.last_page <= 5) {
            // less than 10 total pages so show all
            $scope.startPage = 1;
            $scope.endPage = $scope.pagination_details.last_page;
        } else {
            // more than 10 total pages so calculate start and end pages
            if ($scope.pagination_details.current_page <= 3) {
                $scope.startPage = 1;
                $scope.endPage = 5;
            } else if ($scope.pagination_details.current_page + 2 >= $scope.pagination_details.last_page) {
                $scope.startPage = $scope.pagination_details.last_page - 4;
                $scope.endPage = $scope.pagination_details.last_page;
            } else {
                $scope.startPage = $scope.pagination_details.current_page - 2;
                $scope.endPage = $scope.pagination_details.current_page + 2;
            }
        }

        for (let i = $scope.startPage; i <= $scope.endPage; i++) {
            $scope.pages.push(i);
        }
        //END - Pagination Links for medium size screen

        //START - Pagination Links for large size screen
        $scope.pages_more = [];

        let startPage_more;
        let endPage_more;
        if ($scope.pagination_details.last_page <= 9) {
            // less than 10 total pages so show all
            startPage_more = 1;
            endPage_more = $scope.pagination_details.last_page;
        } else {
            // more than 10 total pages so calculate start and end pages
            if ($scope.pagination_details.current_page <= 5) {
                startPage_more = 1;
                endPage_more = 9;
            } else if ($scope.pagination_details.current_page + 4 >= $scope.pagination_details.last_page) {
                startPage_more = $scope.pagination_details.last_page - 8;
                endPage_more = $scope.pagination_details.last_page;
            } else {
                startPage_more = $scope.pagination_details.current_page - 4;
                endPage_more = $scope.pagination_details.current_page + 4;
            }
        }

        for (let i = startPage_more; i <= endPage_more; i++) {
            $scope.pages_more.push(i);
        }
        //END - Pagination Links for large size screen

        $("#preloader").fadeOut();
    };

    $scope.calcCursorPage = function (divisor) {
        let dividend = $scope.pagination_details.from - 1;

        $scope.paginateData(Math.floor(dividend / divisor) + 1);
    };

    $scope.init();
});

function contrastColor(color_init) {
    var lightColor = "#FFFFFF", darkColor = "000000";
    var color = color_init.replace('#', '');
    // var color = (bgColor.charAt(0) === '#') ? bgColor.substring(1, 7) : bgColor;
    var r = parseInt(color.substring(0, 2), 16); // hexToR
    var g = parseInt(color.substring(2, 4), 16); // hexToG
    var b = parseInt(color.substring(4, 6), 16); // hexToB
    var uicolors = [r / 255, g / 255, b / 255];
    var c = uicolors.map((col) => {
        if (col <= 0.03928) {
            return col / 12.92;
        }
        return Math.pow((col + 0.055) / 1.055, 2.4);
    });
    var L = (0.2126 * c[0]) + (0.7152 * c[1]) + (0.0722 * c[2]);
    return (L > 0.179) ? darkColor : lightColor;
}

app.filter('getContrastColor', function () {

    return function (colour) {
        return contrastColor(colour);
    };
});
