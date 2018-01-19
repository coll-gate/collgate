/**
 * @file main.js
 * @brief Main (root) layout with 3 columns
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-26
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');

let MainLayout = Marionette.View.extend({
    template: require('../templates/main.html'),
    className: "column",

    regions: {
        'left': "div.root-left-bar",
        'content': "div.root-content",
        'right': "div.root-right-bar"
    },

    ui: {
        'left': "div.root-left-bar",
        'content': "div.root-content",
        'right': "div.root-right-bar"
    },

    check_status_timeout: 3*60*1000,   // every 3 minutes

    initialize: function() {
        let uiSetting = window.application.getUserSetting(
            "ui", window.application.UI_SETTING_VERSION, window.application.UI_DEFAULT_SETTING);

        this.currentDisplayMode = uiSetting['display_mode'];
        this.compactDisplay = false;
    },

    setDisplay: function(mode) {
        // full width for mobile devices
        let panels = [
            this.ui.left,
            this.ui.content,
            this.ui.right
        ];

        let m = mode.split('-');
        for (let i = 0; i < panels.length; ++i) {
            let classes = panels[i].attr('class').split(' ');

            for (let j = 0; j < classes.length; ++j) {
                if (classes[j].startsWith('col-')) {
                    panels[i].removeClass(classes[j]);
                }
            }

            if (m[i] && m[i] > 0) {
                panels[i].addClass("col-md-" + m[i]);
                panels[i].css("display", "block");
            }
            else {
                panels[i].addClass("col-md-" + m[i]);
                panels[i].css("display", "none");
            }
        }

        this.currentDisplayMode = mode;

        window.application.updateMessengerDisplay();
    },

    onResize: function() {
        let view = this.getChildView('left');
        if (view && view.onResize) {
            view.onResize();
        }

        view = this.getChildView('content');
        if (view && view.onResize) {
            view.onResize();
        }

        view = this.getChildView('right');
        if (view && view.onResize) {
            view.onResize();
        }

        // this.ui.right.css('height', this.ui.content.height() + 10 + "px");  bug on table on resize
        this.ui.right.css('height', "100%");

        // hide if previously shown
        if (this.ui.right.hasClass('col-is-hover') && this.ui.content.hasClass('col-md-12')) {
            this.hideRightPane();
        }

        // restricted width
        if ($(window).width() <= 994/*768*/) {
            this.compactDisplay = true;

            // full width for mobile devices
            this.setDisplay('0-12-0');
        } else {
            if (this.compactDisplay) {
                let displayMode = window.application.getUserSetting(
                    "ui", window.application.UI_SETTING_VERSION, window.application.UI_DEFAULT_SETTING)['display_mode'];

                // restore to previous setting
                this.setDisplay(displayMode);
                this.compactDisplay = false;
            }
        }

        // display grabber in full width
        if (this.ui.content.hasClass('col-md-12') || this.compactDisplay) {
            let right = $('div.container').css('padding-right').replace('px', '');
            this.ui.content.children('div.root-right-bar-grabber').css('display', 'block').css('right', '-' + right + 'px');
        } else {
            this.ui.content.children('div.root-right-bar-grabber').css('display', 'none')
        }
    },

    childViewEvents: {
        'select:tab': function (region, child) {
            this.triggerMethod('select:tab', region, child);
        },
        'dom:refresh': function(child) {
            // re-inject the grabber column each time the content has changed
            if (child && child.$el.parent().hasClass('root-content')) {
                let grabber = this.ui.content.children('div.root-right-bar-grabber');
                if (grabber.length === 0) {
                    grabber = $('<div class="root-right-bar-grabber"></div>');
                    this.ui.content.append(grabber);

                    this.ui.content.children('div.root-right-bar-grabber').on('mouseover', $.proxy(this.onMouseHoverRightPane, this));
                }

                if (this.ui.content.hasClass('col-md-12')) {
                    let right = $('div.container').css('padding-right').replace('px', '');
                    grabber.css('display', 'block').css('right', '-' + right + 'px');
                } else {
                    grabber.css('display', 'none');
                }
            }
        }
    },

    onDomRefresh: function() {
        $('body').on('mouseover', $.proxy(this.onMouseOut, this));
        $(window).on('scroll', $.proxy(this.onWindowScroll, this));
        $(window).on('focus', $.proxy(this.onWindowFocus, this));
    },

    onDestroy: function() {
        // cleanup bound events
        $('body').off('mouseover', $.proxy(this.onMouseOut, this));
        $(window).off('scroll', $.proxy(this.onWindowScroll, this));
    },

    onWindowScroll: function() {
        if (this.ui.right.hasClass('col-is-hover') && this.ui.content.hasClass('col-md-12')) {
            let top = this.ui.content.position().top;
            let height = this.ui.content.outerHeight();

            // adjust top position for mobile devices
            let scrollTop = $(window).scrollTop();
            if (scrollTop !== 0 || $(window).height() < $('body').height()) {
                top = scrollTop + 15;
                height = $(window).height() - 30;
            }

            this.ui.right.css('top', top).css('height', height);
        }
    },

    onMouseHoverRightPane: function() {
        if (!this.ui.right.hasClass('col-is-hover') && this.ui.content.hasClass('col-md-12')) {
            if (this.ui.right.children().length === 0) {
                return false;
            }

            let top = this.ui.content.position().top;
            let height = this.ui.content.outerHeight();

            // for mobile devices the top and height must be adjusted by scroll height and viewport height
            let scrollTop = $(window).scrollTop();
            if (scrollTop !== 0 || $(window).height() < $('body').height()) {
                top = scrollTop + 15;
                height = $(window).height() - 30;
            }

            this.ui.right.css({
                position: 'absolute',
                display: 'block',
                'min-width': '16.6667%',
                'max-width': '33.3334%',
                right: '0px',
                height: height + "px",
                top: top + "px",
                'padding-right': '0px',
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
        this.checkSessionValidity();

        return false;
    },

    hideRightPane: function() {
        if (this.ui.right.hasClass('col-is-hover') && this.ui.content.hasClass('col-md-12')) {
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
    },
    
    onWindowFocus: function () {
        this.checkSessionValidity();
        return false;
    },

    checkSessionValidity: function() {
        // only if user is authenticated
        if (!session.user.isAuth) {
            return;
        }

        // check only if no activities since a certain delta time
        let now = new Date().getTime();
        if (now - session.user.lastAction > this.check_status_timeout) {
            if (this.checkStatus) {
                return;
            }

            this.checkStatus = true;

            $.ajax({
                method: "GET",
                url: window.application.url(['main', 'profile', 'status']),
                dataType: 'json',
                view: this
            }).done(function (data) {
                // lastAction timestamp is set during global jQuery callback on driver.js
                this.view.checkStatus = false;

                if (!data.is_auth) {
                    session.user.isAuth = false;

                    // session terminated, message and back to home page
                    window.location.assign(window.application.url(['app', 'home']));
                }
            });
        }
    }
});

module.exports = MainLayout;
