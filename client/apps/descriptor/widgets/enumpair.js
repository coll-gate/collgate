/**
 * @file enumpair.js
 * @brief Display and manage a list of pair values format of type of descriptor
 * @author Frederic SCHERMA
 * @date 2017-01-20
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var EnumSingle = require('./enumsingle');

var EnumPair = function() {
    EnumSingle.call(this);

    this.name = "enum_pair";
    this.group = "list";
}

_.extend(EnumPair.prototype, EnumSingle.prototype, {
});

module.exports = EnumPair;