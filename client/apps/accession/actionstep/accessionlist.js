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
};

_.extend(AccessionList.prototype, ActionStepFormat.prototype, {
    defaultFormat: function() {
        return {};
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
