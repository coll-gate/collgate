/**
 * @file entitychangelabel.js
 * @brief Change any labels for a compatible entity.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-01
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

var Dialog = require('./dialog');

var View = Dialog.extend({
    template: require('../templates/entitychangelabel.html'),

    templateContext: function () {
        return {
            title: this.title
        };
    },

    attributes: {
        id: "dlg_change_labels"
    },

    ui: {
        title: "h4.modal-title",
        label: "form.entity-labels input"
    },

    events: {
        'input @ui.label': 'onLabelInput'
    },

    title: 'Change the labels',

    initialize: function (options) {
        Dialog.__super__.initialize.apply(this, arguments);

        this.mergeOptions(options, ['title']);

        var self = this;

        $.ajax({
            type: "GET",
            url: this.model.url() + 'label/',
            dataType: 'json'
        }).done(function (data) {
            for (var lang_id in data) {
                self.ui.label.filter('[language=' + lang_id + ']').attr('value', data[lang_id]);
            }
        }).fail(function () {
            this.destroy();
        });
    },

    onRender: function () {
        View.__super__.onRender.apply(this);

        this.ui.title.text(this.title);
    },

    onLabelInput: function (e) {
        this.validateLabel(e);
    },

    validateLabel: function (e) {
        var v = $(e.target).val();

        if (v.length < 3) {
            $(e.target).validateField('failed', gt.gettext('3 characters min'));
            return false;
        } else if (v.length > 128) {
            $(e.target).validateField('failed', gt.gettext('128 characters max'));
            return false;
        }

        $(e.target).validateField('ok');

        return true;
    },

    validateLabels: function () {
        $.each($(this.ui.label), function (i, label) {
            var v = $(this).val();

            if (v.length < 3) {
                $(this).validateField('failed', gt.gettext('3 characters min'));
                return false;
            } else if (v.length > 128) {
                $(this).validateField('failed', gt.gettext('128 characters max'));
                return false;
            }
        });

        return true;
    },

    onApply: function () {
        var view = this;
        var model = this.model;

        var labels = {};

        $.each($(this.ui.label), function (i, label) {
            var v = $(this).val();
            labels[$(label).attr("language")] = v;
        });

        if (this.validateLabels()) {
            $.ajax({
                type: "PUT",
                url: model.url() + "label/",
                dataType: 'json',
                contentType: "application/json; charset=utf-8",
                data: JSON.stringify(labels)
            }).done(function () {
                // manually update the current context label
                model.set('label', labels[session.language]);
                $.alert.success(gt.gettext("Successfully labeled !"));
            }).always(function () {
                view.destroy();
            });
        }
    }
});

module.exports = View;
