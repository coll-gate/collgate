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
    this.description = "";  // description of the step used during configuration and processing
};

ActionStepFormat.prototype = {
    defaultFormat: function() {
        return {};
    }
};

ActionStepFormat.ActionStepFormatDetailsView = Marionette.View.extend({
    className: 'action-step-format-details',
    template: "<div></div>",

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {},

    /**
     * Read the options from the UI and setup them to the action type format (related step).
     */
    storeData: function() {}
});

ActionStepFormat.ActionStepProcessView = Marionette.View.extend({
    className: 'action-step-process',
    template: "<div></div>",

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {},

    /**
     * Upload a CSV or XLSX of input for the current step.
     */
    exportInput: function() {},

    /**
     * Download a CSV or XLSX of current input for the current step.
     */
    importData: function() {},

    /**
     * Apply a PATCH on the action on the current step with actually defined assets.
     */
    processStep: function() {}
});

module.exports = ActionStepFormat;
