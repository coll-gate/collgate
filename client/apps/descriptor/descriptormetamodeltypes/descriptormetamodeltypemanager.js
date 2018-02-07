/**
 * @file descriptormetamodeltypemanager.js
 * @brief Base class for any descriptor layout type views.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-13
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let DescriptorMetaModelTypeManager = function() {
    this.descriptorMetaModelTypes = {};
};

DescriptorMetaModelTypeManager.prototype = {
    registerElement: function (modelName, viewClass) {
        this.descriptorMetaModelTypes[viewClass.descriptorMetaModelTarget] = viewClass;
    },

    getElement: function(modelName) {
        let element = this.descriptorMetaModelTypes[modelName];
        return element;
    },

    makeView: function(modelName, model) {
        let Element = this.descriptorMetaModelTypes[modelName];
        if (Element) {
            return new Element({mode: model});
        }
        return null;
    }
};

module.exports = DescriptorMetaModelTypeManager;
