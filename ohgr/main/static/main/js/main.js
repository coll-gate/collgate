/**
 * @file main.js
 * @brief Main functions of the index.
 * @author Frederic SCHERMA
 * @date 2016-01-26
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 */

/**
 * @details For JQuery/Bootstrap form-control, allow to
 * defines the validation state of a form-group.
 * @param  {Object} elt      jquery .form-control element
 * @param  {string} validity 'ok', 'warn' or 'failed'
 * @param  {string} comment  optional comment below the input
 */
function validateInput(elt, validity, comment) {
    var glyphicon = '';
    var div = elt.parent();

    if (!div.hasClass('has-feedback')) {
        div.addClass('has-feedback');
    }

    var feedback = elt.siblings('span.form-control-feedback');
    if (feedback.length == 0) {
        feedback = $('<span class="glyphicon form-control-feedback" aria-hidden="true"></span>');
        div.append(feedback);
    }

    if (validity == 'ok') {
        feedback.removeClass('glyphicon-refresh');
        feedback.removeClass('glyphicon-remove');
        feedback.addClass('glyphicon-ok');

        div.removeClass('has-error');
        div.removeClass('has-warning');
        div.addClass('has-success');

        elt.removeClass('invalid');
    } else if (validity == 'warn') {
        feedback.addClass('glyphicon-refresh');
        feedback.removeClass('glyphicon-remove');
        feedback.removeClass('glyphicon-ok');

        div.removeClass('has-error');
        div.removeClass('has-success');
        div.addClass('has-warning');

        elt.addClass('invalid');
    } else if (validity == 'failed') {
        feedback.removeClass('glyphicon-refresh');
        feedback.addClass('glyphicon-remove');
        feedback.removeClass('glyphicon-ok');

        div.removeClass('has-warning');
        div.removeClass('has-success');
        div.addClass('has-error');

        elt.addClass('invalid');
    } else {
        feedback.removeClass('glyphicon-refresh');
        feedback.removeClass('glyphicon-remove');
        feedback.removeClass('glyphicon-ok');

        div.removeClass('has-warning');
        div.removeClass('has-success');
        div.removeClass('has-error');

        elt.addClass('invalid');
    }

    if (comment) {
        var help = elt.siblings('span.help-block');
        if (help.length == 0) {
            help = $('<span class="help-block"></span>');
            div.append(help);
        }
        help.show();
        help.text(comment);
    } else {
        var help = elt.siblings('span.help-block');
        if (help.length > 0) {
            help.hide();
        }
    }
}

// common ready dom
$(function() {
    // avoid FancyTree error message on console
    // (opening an empty node, or with invisible nodes as first)
    $(document).on( "error", function() {
        // nothing
    });
});

var _ = django.gettext;
var title = _("Online Host of Genetics Resources");
