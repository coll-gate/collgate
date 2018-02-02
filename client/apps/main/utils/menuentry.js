/**
 * @file menuentry.js
 * @brief Labeled menu entry class.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-08-24
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let MenuEntryBase = require('./menuentrybase');

let MenuEntry = function(name, label, url, icon, order, auth) {
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
    let entry = $('<li role="presentation" name="' + this.name + '"></li>');
    entry.addClass(this.authTypeClassName());

    let aEl = $('<a role="menuitem" class="url" tabindex="-1" href="' + this.url + '"></a>');

    if (this.icon) {
        if (this.icon.startsWith('fa-')) {
            let iconEl = $('<i class="fa ' + this.icon + '"></i>');
            aEl.append(iconEl);
        } else {
            let iconEl = $('<i class="glyphicon ' + this.icon + '"></i>');
            aEl.append(iconEl);
        }
    } else {
        let noIconEl = $('<i class="fa fa-user" style="visibility: hidden;"></i>');
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
    // href starting with ~ are actionstep that directly call a controller,
    // but doesn't modify the URL neither the history
    if (this.url.startsWith("~") && this.url.length > 1) {
        let aEl = this.$el.children("a.url");
        aEl.attr("href", "#");

        let href = this.url;

        aEl.on("click", function(e) {
            // close the menu and prevent default to open the url
            $(".dropdown").removeClass("open");
            $(".dropdown-toggle").attr("aria-expanded", false);

            let parts = href.slice(1).split('/');
            if (!application[parts[0]]) {
                return false;
            };

            let ctrl = application[parts[0]].controllers[parts[1]];
            if (!ctrl) {
                return false;
            }

            let method = parts[2];
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
        let aEl = this.$el.children("a.url");

        let href = this.url.replace('#', window.application.url('app'));
        aEl.attr("href", href);

        aEl.on("click", function (e) {
            // close the menu and prevent default to open the url
            $(".dropdown").removeClass("open");
            $(".dropdown-toggle").attr("aria-expanded", false);

            let href = $(this).attr("href").replace('/coll-gate/', '');
            Backbone.history.navigate(href, {trigger: true});

            return false;
        });
    }
};

module.exports = MenuEntry;
