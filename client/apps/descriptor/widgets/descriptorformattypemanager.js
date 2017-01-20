/**
 * @file descriptorformattype.js
 * @brief Base class for any descriptor format type widgets.
 * @author Frederic SCHERMA
 * @date 2017-01-20
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescriptorFormatTypeManager = function() {
    this.descriptorFormatType = {};
};

DescriptorFormatTypeManager.prototype = {
    registerElement: function (formatType, descriptorFormatType) {
        this.descriptorFormatType[formatType] = descriptorFormatType;
    },

    getElement: function(formatType) {
        var element = this.descriptorFormatType[formatType];
        return element;
    },

    newElement: function(formatType) {
        var Element = this.descriptorFormatType[formatType];
        if (Element) {
            return new Element();
        }
        return null;
    }
};

module.exports = DescriptorFormatTypeManager;