/**
 * @file descriptorformattypemanager.js
 * @brief Base class for any descriptor format type widgets.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-20
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let DescriptorFormatTypeManager = function() {
    this.descriptorFormatType = {};
};

DescriptorFormatTypeManager.prototype = {
    registerElement: function (formatType, descriptorFormatType) {
        this.descriptorFormatType[formatType] = descriptorFormatType;
    },

    getElement: function(formatType) {
        let element = this.descriptorFormatType[formatType];
        return element;
    },

    newElement: function(formatType) {
        let Element = this.descriptorFormatType[formatType];
        if (Element) {
            return new Element();
        }
        return null;
    }
};

module.exports = DescriptorFormatTypeManager;
