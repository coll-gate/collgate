/**
 * @file popover.js
 * @brief Initiate a bootstrap popover for Marionette views.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-01-30
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var Popover = Marionette.Behavior.extend({
    defaults: {
        content: ''
    },
    ui: {
        popover: '.helper',
        content: '.helper > .helper-content'
    },

    onRender: function() {
        var content = this.ui.content.html();
        var text = this.ui.popover.attr("helper-text");
        var title = this.ui.popover.attr("helper-title");
        var trigger = this.ui.popover.attr("helper-trigger");
        var template = undefined;

        if (text || content) {
            this.ui.popover.addClass('btn');
            this.ui.popover.addClass('popover-dismiss');
            this.ui.popover.addClass('glyphicon glyphicon-question-sign');
            this.ui.popover.attr('data-toggle', 'popover');

            // not a css because element attribute (over btn style)
            this.ui.popover.css({
                'top': '-8px',
                'left': '2px',
                'height': '16px',
                'padding': '0px',
                'padding-left': '1px',
                'padding-right': '1px',
                'border': '0px'
            });
        } else if (trigger) {
            this.ui.popover.addClass('popover-dismiss');
            this.ui.popover.attr('data-toggle', 'popover');
        }

        if (this.ui.popover.hasClass("popover-lg"))
            template = '<div class="popover popover-large"><div class="arrow"></div><div class="popover-inner"><h3 class="popover-title"></h3><div class="popover-content"><p></p></div></div></div>'

        if (content) {
            this.ui.popover.popover({
                html: true,
                placement: 'bottom',
                container: false,
                title: title,
                content: content,
                template: template,
                trigger: 'manual'
            });
        } else if (text) {
            this.ui.popover.popover({
                html: false,
                placement: 'bottom',
                container: false,
                title: title,
                content: text,
                template: template,
                trigger: 'manual'
            });
        }

        // because popover button are manually triggered we have to manage it
        if (!trigger) {
            this.ui.popover.click(function(e) {
                // close any other popovers
                $(".popover-dismiss").each(function(i) {
                    if (this !== e.target) {
                        $(this).popover('hide');
                    }
                });

                $(this).popover('toggle');
                return false;
            });
        }
    }
});

module.exports = Popover;
