/**
 * @file batchactionformattypemanager.js
 * @brief Base class for any batch action format type views.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-12-14
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let BatchActionTypeFormatManager = function() {
    this.batchActionFormatType = {};
};

BatchActionTypeFormatManager.prototype = {
    registerElement: function (formatType, batchActionFormatType) {
        this.batchActionFormatType[formatType] = batchActionFormatType;
    },

    getElement: function(formatType) {
        return this.batchActionFormatType[formatType];
    },

    newElement: function(formatType) {
        let Element = this.batchActionFormatType[formatType];
        if (Element) {
            return new Element();
        }
        return null;
    }
};

module.exports = BatchActionTypeFormatManager;
