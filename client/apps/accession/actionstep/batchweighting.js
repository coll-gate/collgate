/**
 * @file batchweighting.js
 * @brief Batch weighting
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2018-04-10
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let ActionStepFormat = require('./actionstepformat');
let Marionette = require('backbone.marionette');

let Format = function() {
    ActionStepFormat.call(this);

    this.name = "batch_weighting";
    this.group = "standard";
    this.description = _t("Take a list of batches in input, and iteratively weight each.");

    this.type = this.ACTION_TYPE_ITERATIVE;
    this.acceptFormat = ['batch_id'];
    this.dataFormat = ['batch_id'];
};

_.extend(Format.prototype, ActionStepFormat.prototype, {
    defaultFormat: function() {
        return {};
    }
});

Format.ActionStepProcessView = ActionStepFormat.ActionStepProcessView.extend({
    className: 'action-step-process',
    template: require('../templates/actionstep/process/batchweighting.html'),

    initialize: function(options) {
        options || (options = {readonly: true});

        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
    },

    onBeforeDestroy: function() {
    },

    exportInput: function() {

    },

    importData: function() {

    },

    inputsType: function() {
        return 'none';
    },

    inputsData: function() {
        return null;
    }
});

Format.ActionStepReadView = ActionStepFormat.ActionStepReadView.extend({
});

Format.ActionStepFormatDetailsView = ActionStepFormat.ActionStepFormatDetailsView.extend({
    className: 'action-step-format-details',
    // template: require('../templates/actionstep/batchweigthingdetails.html'),

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
