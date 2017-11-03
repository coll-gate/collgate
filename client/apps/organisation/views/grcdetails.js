/**
 * @file grcdetails.js
 * @brief GRC details item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-28
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'div',
    className: 'object grc',
    template: require('../templates/grcdetails.html'),

    ui: {
        'name': 'input[name=name]',
        'identifier': 'input[name=identifier]',
        'description': 'textarea[name=description]',
        'save': '#grc_save'
    },

    events: {
        'click @ui.save': 'updateDetails'
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
    },

    updateDetails: function() {
        this.model.save({
            name: this.ui.name.val(),
            identifier: this.ui.identifier.val(),
            description: this.ui.description.val()
        }, {
            success: function() {
                $.alert.success(_t("Done"));
            }
        });
    }
});

module.exports = View;
