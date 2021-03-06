/**
 * @file dialog.js
 * @brief Dialog helper view.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-21
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: "div",
    attributes: {
        'id': 'dlg_default',
        'class': 'modal',
        'tabindex': -1
    },

    ui: {
        cancel: "button.cancel",
        apply: "button.apply"
    },

    events: {
        'click @ui.cancel': 'onCancel',
        'click @ui.apply': 'onApply',
        'keydown': 'escapeKey'
    },

    constructor: function() {
        let prototype = this.constructor.prototype;

        this.events = {};
        this.defaultOptions = {};
        this.ui = {};
        this.attributes = {};
        this.className = "";

        while (prototype) {
            if (prototype.hasOwnProperty("events")) {
                _.defaults(this.events, prototype.events);
            }
            if (prototype.hasOwnProperty("defaultOptions")) {
                _.defaults(this.defaultOptions, prototype.defaultOptions);
            }
            if (prototype.hasOwnProperty("ui")) {
                _.defaults(this.ui, prototype.ui);
            }
            if (prototype.hasOwnProperty("attributes")) {
                _.defaults(this.attributes, prototype.attributes);
            }
            if (prototype.hasOwnProperty("className")) {
                this.className += " " + prototype.className;
            }
            prototype = prototype.constructor.__super__;
        }

        Marionette.View.apply(this, arguments);
    },

    initialize: function (options) {
        View.__super__.initialize.apply(this);
    },

    onRender: function () {
        // display the bootstrap modal
        $(this.el).modal();

        // interest on this even when the user click on the backdrop
        $(this.el).on('hidden.bs.modal', $.proxy(function() {
            this.destroy();
        }, this));

        // auto-focus is processed now on the first input having the auto-focus attribute
        $(this.el).find(':input[autofocus]').focus();
    },

    onBeforeDestroy: function() {
        // unbind the event before remove the bs.modal to avoid a double destroy call
        $(this.el).off('hidden.bs.modal');
        $(this.el).modal('hide').data('bs.modal', null);
    },

    onCancel: function () {
        this.destroy();
    },

    escapeKey: function(e) {
        let code = e.keyCode || e.which;

        // escape key cancel
        if (code === 27) {
            this.destroy();
        }

        // enter on num-pad enter
        if (code === 13) {
            // click apply
            this.triggerMethod('apply');

            // avoid reload page
            return false;
        }
    }
});

module.exports = View;
