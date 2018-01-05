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
        this.global = {};

        if (!this.isAuth()) {
            return;
        }

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

    isAuth: function() {
        return window.session.user.isAuth;
    },

    isSuperUser: function() {
        return window.session.user.isAuth && window.session.user.isSuperUser;
    },

    isStaff: function() {
        // super user is staff too
        return window.session.user.isAuth && (window.session.user.isStaff || window.session.user.isSuperUser);
    },

    /**
     * Globals permissions.
     * @param module Name of the module.
     * @param model Name of the model of the concerned entity/object.
     * @param action Type name of the action (get, change, list, delete...)
     * @returns {boolean} True if user is auth, and the permission is available or super user, or specials permission
     * when staff user.
     */
    has: function(module, model, action) {
        if (!window.session.user.isAuth) {
            return false;
        }

        if (window.session.user.isSuperUser) {
            return true;
        }

        let perm = module.toLowerCase() + '.' + action.toLowerCase() + '_' + model.toLowerCase();

        if (this.isStaff()) {
            if (perm in this.global) {
                return true;
            }

            // implicit permissions for staff
            // @todo
            if (module === "descriptor") {
                return true;
            } else if (module === "audit") {
                return true;
            }

            return false;
        } else {
            return perm in this.global;
        }
    },

    /**
     * Returns a promise because the async behavior of per object permission getting.
     * @param module
     * @param model
     * @param action
     * @param id
     * @returns {boolean}
     */
    forObject: function(module, model, action, id) {
        if (!window.session.user.isAuth) {
            return false;
        }

        if (window.session.user.isSuperUser) {
            return true;
        }

        // per object, require a query @todo
        alert("@todo");

        let perm = module.toLowerCase() + '.' + action.toLowerCase() + '_' + model.toLowerCase();
        return false;
    },
};

module.exports = PermissionManager;
