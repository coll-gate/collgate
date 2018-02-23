/**
 * @file batchconsumerbatchproducer.js
 * @brief Batch consumer - Batch producer step
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-12-19
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let ActionStepFormat = require('./actionstepformat');
let Marionette = require('backbone.marionette');

let Format = function() {
    ActionStepFormat.call(this);

    this.name = "batchconsumer_batchproducer";
    this.group = "standard";
    this.description = _t("Take a list of batches in input, and generate one or many batch in outputs.");
};

_.extend(Format.prototype, ActionStepFormat.prototype, {
    defaultFormat: function() {
        return {};
    }
});

Format.ActionStepProcessView = Marionette.View.extend({
    className: 'action-step-process',
    template: require('../templates/actionstep/batchconsumerbatchproducerprocess.html'),

    initialize: function(options) {
        options || (options = {readonly: true});

        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        if (this.getOption('readonly')) {

        } else {

        }
    },

    onBeforeDestroy: function() {
        if (!this.getOption('readonly')) {
        }
    },

    exportInput: function() {

    },

    importData: function() {

    },

    inputsType: function() {
        return null;
    },

    inputsData: function() {
        return null;
    }
});

Format.ActionStepFormatDetailsView = Marionette.View.extend({
    className: 'action-step-format-details',
    template: require('../templates/actionstep/batchconsumerbatchproducer.html'),

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        let format = this.model.get('format');
    },

    storeData: function() {
        return {
        }
    }
});

module.exports = Format;
