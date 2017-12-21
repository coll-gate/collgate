/**
 * @file permissionmanager.js
 * @brief Global permission manager.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-12-21
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let PermissionManager = function() {
    this.global = {};
};

PermissionManager.prototype = {

    fetch: function() {
        let self = this;

        $.ajax({
            type: 'GET',
            url: window.application.url(['permission', 'permission']),
            dataType: 'json',
            contentType: "application/json; charset=utf-8"
        }).done(function (data) {
            let perm;
            for (let i = 0; i < data.length; ++i) {
                perm = data[i].app_label + '.' + data[i].id;
                self.global[perm] = data[i].name
            }
        });
    },

    isSuperUser: function() {
        return window.session.is_superuser;
    },

    isStaff: function() {
        return window.session.is_staff;
    },

    has: function(module, model, action, id) {
        if (this.isSuperUser()) {
            return true;
        }

        if (id !== undefined) {
            alert("@todo");
            return false;
        }

        let perm = module.toLowerCase() + '.' + action.toLowerCase() + '_' + model.toLowerCase();

        if (this.isStaff()) {
            if (perm in this.global) {
                return true;
            }

            // special cases for staff
            // @todo

            return false;
        } else {
            return perm in this.global;
        }
    },
};

module.exports = PermissionManager;
