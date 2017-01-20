/**
 * @file enumordinal.js
 * @brief Display and manage a list of ordinal with text values format of type of descriptor
 * @author Frederic SCHERMA
 * @date 2017-01-20
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var EnumSingle = require('./enumsingle');

var EnumOrdinal = function() {
    EnumSingle.call(this);

    this.name = "enum_ordinal";
    this.group = "list";
}

_.extend(EnumOrdinal.prototype, EnumSingle.prototype, {
});

module.exports = EnumOrdinal;