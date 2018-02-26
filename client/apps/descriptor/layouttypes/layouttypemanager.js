/**
 * @file layouttypemanager.js
 * @brief Base class for any descriptor layout type views.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-09-13
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let LayoutTypeManager = function() {
    this.layoutTypes = {};
};

LayoutTypeManager.prototype = {
    registerElement: function (modelName, viewClass) {
        this.layoutTypes[viewClass.layoutTarget] = viewClass;
    },

    getElement: function(modelName) {
        let element = this.layoutTypes[modelName];
        return element;
    },

    makeView: function(modelName, model) {
        let Element = this.layoutTypes[modelName];
        if (Element) {
            return new Element({mode: model});
        }
        return null;
    }
};

module.exports = LayoutTypeManager;
