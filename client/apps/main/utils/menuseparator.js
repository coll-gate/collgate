/**
 * @file menuentryseparator.js
 * @brief Separator menu entry class.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-08-24
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var MenuEntryBase = require('./menuentrybase');

var MenuSeparator = function(name, order, auth) {
    MenuEntryBase.apply(this, arguments);
};

_.extend(MenuSeparator.prototype, MenuEntryBase.prototype, {

});

module.exports = MenuSeparator;
