/**
 * @file menuentrybase.js
 * @brief Menu entry base class.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-08-24
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var MenuEntryBase = function(name, order, auth) {
    this.name = name || "";
    this.order = order || -1;
    this.auth = auth || "ANY";
};

MenuEntryBase.prototype = {
    hasLabel: function() {
        return false;
    }
};

module.exports = MenuEntryBase;
