/**
 * @file menu.js
 * @brief Dynamic menu management.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-08-24
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var MenuEntryBase = require('./menuentrybase');
var MenuSeparator = require('./menuseparator');

var Menu = function(name, label, order, auth) {
    this.name = name || "";
    this.label = label || "";
    this.order = order || -1;
    this.auth = auth || 'any';
    this.entries = [];
};

Menu.prototype = {
    entry: function(entry) {
        if (entry) {
            if (!(entry instanceof MenuEntryBase)) {
                throw "entry Must be a MenuEntryBase instance or derived";
            }

            if (entry.name) {
                for (var i = 0; i < this.entries; ++i) {
                    if (this.entries[i].name === entry.name) {
                        throw "Menu entry " + entry.name + " is already defined";
                    }
                }
            }

            var pos = 0;
            for (var i = 0; i < this.entries.length; ++i) {
                if (this.entries[i].order <= entry.order) {
                    ++pos;
                } else {
                    break;
                }
            }

            this.entries.splice(pos, 0, entry)
        } else {
            this.entries.push(new MenuSeparator())
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
    render: function(parent) {
        var menuEl = $('<li class="dropdown"></li>');
        menuEl.addClass(this.authTypeClassName());
        menuEl.attr('name', this.name);

        var aEl = $(
            '<a href="#" role="button" class="dropdown-toggle" data-toggle="dropdown">' +
            gt.gettext(this.label || "") + '<b class="caret"></b>' +
            '</a>');

        aEl.attr('id', 'drop-' + this.name);
        menuEl.append(aEl);

        // entries container
        var menuEntries = $('<ul class="dropdown-menu" role="menu" aria-labelledby="menu-drop-' + this.name + '">');
        menuEl.append(menuEntries);

        parent.append(menuEl);

        // with any entries
        for (var i = 0; i < this.entries.length; ++i) {
            this.entries[i].render(menuEntries);
        }
    }
};

module.exports = Menu;
