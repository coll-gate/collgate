/**
 * @file actionstepformat.js
 * @brief Base class for any action step format.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-12-11
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let ActionStepFormat = function() {
    this.name = "";         // format name
    this.group = "";        // related informal group name
};

ActionStepFormat.prototype = {
};

ActionStepFormat.ActionStepFormatDetailsView = Marionette.View.extend({
    className: 'action-step-format-details',
    template: "<div></div>",

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
    },

    getFormat: function() {
        return {
        }
    }
});

module.exports = ActionStepFormat;
