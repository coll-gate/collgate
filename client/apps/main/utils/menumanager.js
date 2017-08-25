/**
 * @file menumanager.js
 * @brief Dynamic menu manager.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-08-24
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Menu = require('./menu');

var MenuManager = function() {
    this.menus = [];
};

MenuManager.prototype = {
    /**
     * Merge a menu to original menu.
     * @param org
     * @param menu
     */
    merge: function(org, menu) {
        for (var i = 0; i < menu.entries.length; ++i) {
            org.entry(menu.entries[i]);
        }
    },

    /**
     * Add a new menu to this module. If the menu already exists it is merged with the previous one.
     * @param menu A valid module menu.
     */
    add: function(menu) {
        if (!menu) {
            return;
        }

        if (!(menu instanceof Menu)) {
            throw "menu Must be a Menu object"
        }

        for (var i = 0; i < this.menus.length; ++i) {
            if (this.menus[i].name === menu.name) {
                this.merge(this.menus[i], menu);
                return;
            }
        }

        var pos = 0;
        for (var i = 0; i < this.menus.length; ++i) {
            if (this.menus[i].order <= menu.order) {
                ++pos;
            } else {
                break;
            }
        }

        this.menus.splice(pos, 0, menu);
    },

    /**
     * Render all menu
     * @param parent
     */
    render: function(parent) {
        parent.find('li.dropdown').remove();

        for (var i = 0; i < this.menus.length; ++i) {
            this.menus[i].render(parent);
        }
    }
};

module.exports = MenuManager;
