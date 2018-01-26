/**
 * @file actionformattypemanager.js
 * @brief Base class for any action format type views.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-12-14
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let ActionTypeFormatManager = function() {
    this.actionFormatType = {};
};

ActionTypeFormatManager.prototype = {
    registerElement: function (formatType, actionFormatType) {
        this.actionFormatType[formatType] = actionFormatType;
    },

    getElement: function(formatType) {
        return this.actionFormatType[formatType];
    },

    newElement: function(formatType) {
        let Element = this.actionFormatType[formatType];
        if (Element) {
            return new Element();
        }
        return null;
    }
};

module.exports = ActionTypeFormatManager;
