/**
 * @file main.js
 * @brief Main (root) layout with 3 columns
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-26
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var MainLayout = Marionette.LayoutView.extend({
    template: require('../templates/main.html'),
    className: "column",

    regions: {
        'left': "div.root-left-bar",
        'content': "div.root-content",
        'right': "div.root-right-bar"
    },

    ui: {
        'content': "div.root-content",
        'right': "div.root-right-bar",
        'right_grabber': "div.root-right-bar-grabber"
    },

    events: {
        'mouseover @ui.right_grabber': 'onMouseHoverRightPane'
    },

    onResize: function() {
        var view = this.getRegion('left');
        if (view && view.currentView && view.currentView.onResize) {
            view.currentView.onResize();
        }

        view = this.getRegion('content');
        if (view && view.currentView && view.currentView.onResize) {
            view.currentView.onResize();
        }

        view = this.getRegion('right');
        if (view && view.currentView && view.currentView.onResize) {
            view.currentView.onResize();
        }

        this.ui.right.css('height', this.ui.content.height() + 10 + "px");
        // this.ui.right_grabber.css('height', this.ui.content.height() + "px");
        this.ui.right_grabber.css('top', this.ui.content.position().top + "px");

        if (this.ui.right.hasClass('col-md-0')) {
            this.ui.right_grabber.css('display', 'block');
        } else {
            this.ui.right_grabber.css('display', 'none');
        }

        if (this.ui.right.hasClass('col-is-hover') && this.ui.right.hasClass('col-md-0')) {
            this.hideRightPane();
        }
    },

    childEvents: {
        'dom:refresh': function(child) {
            // re-inject the grabbe column each time the content has changed
            if (child && child.$el.parent().hasClass('root-content')) {
                var grabber = $('<div class="root-right-bar-grabber"></div>');
                this.ui.content.append(grabber);
            }
        }
    },

    onDomRefresh: function() {
        $('body').on('mouseover', $.proxy(this.onMouseOut, this));
    },

    onMouseHoverRightPane: function() {
        if (!this.ui.right.hasClass('col-is-hover') && this.ui.right.hasClass('col-md-0')) {
            this.ui.right.css({
                position: 'absolute',
                display: 'block',
                'min-width': '16.6667%',
                'max-width': '33.3334%',
                right: '0px',
                height: this.ui.content.height() + 10 + "px",
                top: this.ui.content.position().top + "px",
                'padding-right': '1px',
                'z-index': 1000
            }).addClass('col-is-hover');

            this.ui.right.children('div').children('div')
                .css('border-left', '5px solid #444')
                .css('border-right', '0')
                .css('border-top', '5px solid #444')
                .css('border-bottom', '5px solid #444');
        }

        return false;
    },

    onMouseOut: function(e) {
        if ($(e.target).closest('div.root-right-bar').length > 0) {
            return false;
        }

        this.hideRightPane();

        return false;
    },

    hideRightPane: function() {
        if (this.ui.right.hasClass('col-is-hover') && this.ui.right.hasClass('col-md-0')) {
            this.ui.right.css({
                position: '',
                display: 'none',
                width: '',
                right: '',
                top: '',
                'padding-right': '5px',
                'z-index': ''
            }).removeClass('col-is-hover');

            this.ui.right.children('div').children('div')
                .css('border-left', '')
                .css('border-right', '')
                .css('border-top', '')
                .css('border-bottom', '');
        }
    }
});

module.exports = MainLayout;
