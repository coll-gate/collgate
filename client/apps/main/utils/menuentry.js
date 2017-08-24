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

var MenuEntry = function(name, label, dst, icon, order, auth) {
    MenuEntryBase.apply(this, arguments);

    this.label = label || "";
    this.dst = dst || null;
    this.icon = icon || null;
};

_.extend(MenuEntry.prototype, MenuEntryBase.prototype, {

});

module.exports = MenuEntryBase;
