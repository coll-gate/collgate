/**
 * @file menuentrybase.js
 * @brief Menu entry base class.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-08-24
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let MenuEntryBase = function(name, order, auth) {
    this.name = name || "";
    this.order = order || -1;
    this.auth = auth || "ANY";
};

MenuEntryBase.prototype = {
    hasLabel: function() {
        return false;
    },

    /**
     * Get authentication type class name
     * @returns {*}
     */
    authTypeClassName: function() {
        if (this.auth === "any") {
            return "auth-any"
        } else if (this.auth === "guest") {
            return "auth-guest"
        } else if (this.auth === "user") {
            return "auth-user"
        } else if (this.auth === "staff") {
            return "auth-staff"
        } else if (this.auth === "superuser") {
            return "auth-superuser"
        } else {
            return "";
        }
    },

    /**
     * Render the menu entry.
     * @param parent
     */
    render: function(parent) {
        /* nothing */
    },

    /**
     * Destroy the view.
     */
    destroy: function() {
        if (this.$el) {
            this.$el.remove();
            this.$el = null;
        }
    }
};

module.exports = MenuEntryBase;
