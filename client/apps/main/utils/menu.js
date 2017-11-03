/**
 * @file menu.js
 * @brief Dynamic menu management.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-08-24
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let MenuEntryBase = require('./menuentrybase');
let MenuSeparator = require('./menuseparator');

let Menu = function(name, label, order, auth) {
    this.name = name || "";
    this.label = label || "";
    this.order = order || -1;
    this.auth = auth || 'any';
    this.entries = [];
    this.$el = null;
};

Menu.prototype = {
    /**
     * Add a menu entry and update or not the view.
     * @param entry Menu entry or separator.
     * @param update If true the menu view is update.
     */
    addEntry: function(entry, update) {
        typeof update !== "undefined" || (update = true);

        if (entry) {
            if (!(entry instanceof MenuEntryBase)) {
                throw "entry Must be a MenuEntryBase instance or derived";
            }

            if (entry.name) {
                for (let i = 0; i < this.entries; ++i) {
                    if (this.entries[i].name === entry.name) {
                        throw "Menu entry " + entry.name + " is already defined";
                    }
                }
            }

            let pos = 0;
            for (let i = 0; i < this.entries.length; ++i) {
                if (this.entries[i].order <= entry.order) {
                    ++pos;
                } else {
                    break;
                }
            }

            this.entries.splice(pos, 0, entry);

            if (update && this.$el) {
                entry.render(this.$el.children('ul.dropdown-menu'));
            }
        } else {
            entry = new MenuSeparator();
            this.entries.push(entry);

            if (update && this.$el) {
                entry.render(this.$el.children('ul.dropdown-menu'));
            }
        }
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
     * Render bootstrap menu.
     * @param parent
     */
    render: function(parent, pos) {
        pos >= 0 || (pos = -1);

        let menuEl = $('<li class="dropdown"></li>');
        menuEl.addClass(this.authTypeClassName());
        menuEl.attr('name', this.name);

        let aEl = $(
            '<a href="#" role="button" class="dropdown-toggle" data-toggle="dropdown">' +
            _t(this.label || "") + '<b class="caret"></b>' +
            '</a>');

        aEl.attr('id', 'drop-' + this.name);
        menuEl.append(aEl);

        // entries container
        let menuEntries = $('<ul class="dropdown-menu" role="menu" aria-labelledby="menu-drop-' + this.name + '">');
        menuEl.append(menuEntries);

        if (pos >= 0 && pos < parent.children('li.dropdown').length) {
            let nextEl = $(parent.children('li.dropdown').get(pos));
            menuEl.insertBefore(nextEl);
        } else {
            parent.append(menuEl);
        }

        // with any entries
        for (let i = 0; i < this.entries.length; ++i) {
            this.entries[i].render(menuEntries);
        }

        this.$el = menuEl;
    },

    /**
     * Remove a menu entry and update the view.
     * @param name Name of the entry to remove.
     * @param destroy By default destroy the view.
     */
    removeEntry: function(name, destroy) {
        typeof destroy !== "undefined" || (destroy = true);

        for (let i = 0; i < this.entries.length; ++i) {
            let entry = this.entries[i];
            if (entry.name === name) {
                if (destroy) {
                    entry.destroy();
                }

                this.entries.splice(i, 1);
                break;
            }
        }
    },

    /**
     * Destroy the view.
     */
    destroy: function () {
        if (this.$el) {
            this.$el.remove();
            this.$el = null;
        }
    }
};

module.exports = Menu;
