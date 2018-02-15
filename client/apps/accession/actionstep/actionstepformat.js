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

    onRender: function() {
    },

    storeData: function() {
    }
});

ActionStepFormat.ActionStepProcessView = Marionette.View.extend({
    className: 'action-step-process',
    template: "<div></div>",

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
    },

    exportInput: function() {

    },

    importData: function() {

    }
});

module.exports = ActionStepFormat;
