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
    /**
     * Generate the default data related to the step during configuration of the step.
     * To be overridden by the specialization.
     */
    defaultFormat: function() {
        return {};
    }
};

/**
 * Default view for the configuration of the step of the action type. To be specialized.
 */
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

/**
 * Default view for the settings of the step of the action (during processing). To be specialized.
 */
ActionStepFormat.ActionStepProcessView = Marionette.View.extend({
    className: 'action-step-process',
    template: "<div></div>",

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {},

    /**
     * Upload a CSV or XLSX of input.
     */
    exportInputs: function() {},

    /**
     * Download a CSV or XLSX of current input.
     */
    importData: function() {},

    /**
     * Get the currently defined inputs type.
     */
    inputsType: function() {
        return 'none';
    },

    /**
     * Get the related list of inputs depending of the inputs type :
     *  - an array if manual selection
     *  - an id if a panel
     *  - a file object if import of a CSV or XLSX
     */
    inputsData: function() {
        return null;
    }
});

module.exports = ActionStepFormat;
