/**
 * @file menuentryseparator.js
 * @brief Separator menu entry class.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-08-24
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let MenuEntryBase = require('./menuentrybase');

let MenuSeparator = function(order, auth) {
    MenuEntryBase.call(this, null, order, auth);
};

MenuSeparator.prototype = Object.create(MenuEntryBase.prototype);
MenuSeparator.prototype.constructor = MenuSeparator;

/**
 * Render the menu entry.
 * @param parent
 */
MenuSeparator.prototype.render = function(parent) {
    let entry = $('<li role="presentation" class="divider" name="' + this.name + '"></li>');
    entry.addClass(this.authTypeClassName());

    parent.append(entry);
};

module.exports = MenuSeparator;
