/**
 * @file actionstepformatmanager.js
 * @brief Manager for action step format.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-12-14
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let ActionStepFormatManager = function() {
    this.actionStepFormat = {};
};

ActionStepFormatManager.prototype = {
    registerElement: function (stepFormatName, actionStepFormat) {
        this.actionStepFormat[stepFormatName] = actionStepFormat;
    },

    getElement: function(formatType) {
        return this.actionStepFormat[formatType];
    },

    newElement: function(formatType) {
        let Element = this.actionStepFormat[formatType];
        if (Element) {
            return new Element();
        }
        return null;
    }
};

module.exports = ActionStepFormatManager;
