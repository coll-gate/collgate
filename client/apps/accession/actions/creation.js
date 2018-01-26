/**
 * @file creation.js
 * @brief Display and manage a creation format of type of action
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-12-11
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let ActionFormatType = require('./actiontypeformat');
let Marionette = require('backbone.marionette');

let CreationFormat = function() {
    ActionFormatType.call(this);

    this.name = "creation";
    this.group = "standard";
};

_.extend(CreationFormat.prototype, ActionFormatType.prototype, {

});

CreationFormat.ActionTypeFormatDetailsView = Marionette.View.extend({
    className: 'action-format-details-format',
    template: require('../templates/actions/creation.html'),

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        let format = this.model.get('format');
    },

    getFormat: function() {
        return {
        }
    }
});

module.exports = CreationFormat;
