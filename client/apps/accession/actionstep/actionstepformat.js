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
    this.name = "";          //!< format name
    this.group = "";         //!< related informal group name
    this.description = "";   //!< description of the step used during configuration and processing
    this.iterative = false;  //!< means the process is iterative
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

let downloadData = function (dataFormat, stepIndex) {
    if (dataFormat === 'csv') {
        // download the document as csv
        let form = $('<form></form>');

        form.append('<input type="number" name="step_index" value="' + stepIndex + '">');
        form.append('<input type="text" name="format" value="csv">');

        form.attr('action', window.application.url(['accession', 'action', this.model.get('id'), 'download']))
            .appendTo('body').submit().remove();
    } else if (dataFormat === 'xlsx') {
        // download the document as xlsx
        let form = $('<form></form>');

        form.append('<input type="number" name="step_index" value="' + stepIndex + '">');
        form.append('<input type="text" name="format" value="xlsx">');

        form.attr('action', window.application.url(['accession', 'action', this.model.get('id'), 'download']))
            .appendTo('body').submit().remove();
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
 * Default view for the processing of a step of an action. To be specialized.
 */
ActionStepFormat.ActionStepProcessView = Marionette.View.extend({
    className: 'action-step-process',
    template: "<div></div>",

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {},

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
    },

    stepData: function() {
        return this.model.get('data')['steps'][this.getOption('stepIndex')];
    },

    /**
     * Download the data of the step, format as csv or xlsx.
     * @param data_format
     */
    downloadData: downloadData
});

/**
 * Default view for the reading-back of a step of an action (once processed for read-only). To be specialized.
 */
ActionStepFormat.ActionStepReadView = Marionette.View.extend({
    className: 'action-step-read',
    template: require('../templates/actionstep/read/actionstepread.html'),

    ui: {
        get_data: 'select[name=get-data]',
    },

    events: {
        'change @ui.get_data': 'onGetData',
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        this.ui.get_data.selectpicker({});
    },


    onBeforeDestroy: function () {
        this.ui.get_data.selectpicker('destroy');
    },

    onGetData: function () {
        let type = this.ui.get_data.val();

        if (type === 'original-csv') {
            this.downloadData('csv', this.getOption("stepIndex"));
        } else if (type === 'original-xlsx') {
            this.downloadData('xlsx', this.getOption("stepIndex"));
        } else if (type === 'original-display') {
            window.application.accession.controllers.action.getActionData(this.model.get('id'), this.getOption("stepIndex"));
        }

        this.ui.get_data.val("").selectpicker('refresh');
    },

    /**
     * Download the data of the step, format as csv or xlsx.
     * @param data_format
     */
    downloadData: downloadData
});

module.exports = ActionStepFormat;
