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

var MenuManager = function(parent) {
    this.$el = parent;
    this.menus = [];
};

MenuManager.prototype = {
    /**
     * Merge a menu to original menu.
     * @param org
     * @param menu
     */
    mergeMenu: function(org, menu) {
        for (var i = 0; i < menu.entries.length; ++i) {
            org.entry(menu.entries[i]);
        }
    },

    /**
     * Add a new menu to this module. If the menu already exists it is merged with the previous one.
     * @param menu A valid module menu.
     */
    addMenu: function(menu, update) {
        typeof update !== "undefined" || (update = true);

        if (!menu) {
            return;
        }

        if (!(menu instanceof Menu)) {
            throw "menu Must be a Menu object"
        }

        for (var i = 0; i < this.menus.length; ++i) {
            if (this.menus[i].name === menu.name) {
                this.mergeMenu(this.menus[i], menu);
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

        if (this.$el && update) {
            menu.render(this.$el, pos);
        }
    },

    destroy: function() {
        if (this.$el) {
            this.$el.find('li.dropdown').remove();
        }
    },

    /**
     * Render all menu
     * @param parent
     */
    render: function() {
        if (this.$el) {
            this.destroy();

            for (var i = 0; i < this.menus.length; ++i) {
                this.menus[i].render(this.$el, -1);
            }
        }
    },

    /**
     * Get a menu according to its name.
     */
    getMenu: function(name) {
        for (var i = 0; i < this.menus.length; ++i) {
            if (this.menus[i].name === name) {
                return this.menus[i];
            }
        }

        return null;
    },

    /**
     * Remove a complete menu according to its name.
     */
    removeMenu: function(name, destroy) {
        typeof destroy !== "undefined" || (destroy = true);

        for (var i = 0; i < this.menus.length; ++i) {
            var menu = this.menus[i];

            if (menu.name === name) {
                if (destroy) {
                    menu.destroy();
                }

                this.menus.splice(i, 1);
                return;
            }
        }
    }
};

module.exports = MenuManager;
