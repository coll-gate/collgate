/**
 * @file menuentry.js
 * @brief Labeled menu entry class.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-08-24
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var MenuEntryBase = require('./menuentrybase');

var MenuEntry = function(name, label, url, icon, order, auth) {
    MenuEntryBase.call(this, name, order, auth);

    this.label = label || null;
    this.url = url || "#";
    this.icon = icon || null;
    this.$el = null;
};

MenuEntry.prototype = Object.create(MenuEntryBase.prototype);
MenuEntry.prototype.constructor = MenuEntry;

MenuEntry.prototype.hasLabel = function () {
    return true;
};

/**
 * Render the menu entry.
 * @param parent
 */
MenuEntry.prototype.render = function(parent) {
    var entry = $('<li role="presentation" name="' + this.name + '"></li>');
    entry.addClass(this.authTypeClassName());

    var aEl = $('<a role="menuitem" class="url" tabindex="-1" href="' + this.url + '"></a>');

    if (this.icon) {
        if (this.icon.startsWith('fa-')) {
            var iconEl = $('<span class="fa ' + this.icon + '"></span>');
            aEl.append(iconEl);
        } else {
            var iconEl = $('<span class="glyphicon ' + this.icon + '"></span>');
            aEl.append(iconEl);
        }
    } else {
        var noIconEl = $('<span class="fa fa-user" style="visibility: hidden;"></span>');
        aEl.append(noIconEl);
    }

    aEl.append('&nbsp;' + _t(this.label || ""));

    entry.append(aEl);
    parent.append(entry);

    this.$el = entry;

    // and bind events
    this.bind();
};

MenuEntry.prototype.bind = function() {
    // href starting with ~ are actions that directly call a controller,
    // but doesn't modify the URL neither the history
    if (this.url.startsWith("~") && this.url.length > 1) {
        var aEl = this.$el.children("a.url");
        aEl.attr("href", "#");

        var href = this.url;

        aEl.on("click", function(e) {
            // close the menu and prevent default to open the url
            $(".dropdown").removeClass("open");
            $(".dropdown-toggle").attr("aria-expanded", false);

            var parts = href.slice(1).split('/');
            if (!application[parts[0]]) {
                return false;
            };

            var ctrl = application[parts[0]].controllers[parts[1]];
            if (!ctrl) {
                return false;
            }

            var method = parts[2];
            if (!method || !ctrl[method]) {
                return false;
            }

            // deferred call, because we want this menu closed before and processed outside of the signal
            setTimeout(function() {
                ctrl[method]()
            }, 0);

            return false;
        });
    } else if (this.url.startsWith("#") && this.url.length > 1) {
        // href starting with # are route that must be called using the navigation mechanism
        var aEl = this.$el.children("a.url");

        var href = this.url.replace('#', application.baseUrl + 'app/');
        aEl.attr("href", href);

        aEl.on("click", function (e) {
            // close the menu and prevent default to open the url
            $(".dropdown").removeClass("open");
            $(".dropdown-toggle").attr("aria-expanded", false);

            var href = $(this).attr("href").replace('/coll-gate/', '');
            Backbone.history.navigate(href, {trigger: true});

            return false;
        });
    }
};

module.exports = MenuEntry;
