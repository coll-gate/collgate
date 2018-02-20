/**
 * @file accessionlst.js
 * @brief Simple accession list action step
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-12-11
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let ActionStepFormat = require('./actionstepformat');
let Marionette = require('backbone.marionette');

let AccessionList = function() {
    ActionStepFormat.call(this);

    this.name = "accession_list";
    this.group = "standard";
    this.description = _t("Take a list of accession in input and dispose this same list as output for the next step.");
};

_.extend(AccessionList.prototype, ActionStepFormat.prototype, {
    defaultFormat: function() {
        return {};
    }
});

AccessionList.ActionStepProcessView = Marionette.View.extend({
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

AccessionList.ActionStepFormatDetailsView = Marionette.View.extend({
    className: 'action-step-format-details',
    template: require('../templates/actionstep/accessionlist.html'),

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

module.exports = AccessionList;
