/**
 * @file entitychangelabel.js
 * @brief Change any labels for a compatible entity.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-01
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Dialog = require('./dialog');

let View = Dialog.extend({
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

        let self = this;

        $.ajax({
            type: "GET",
            url: this.model.url() + 'label/',
            dataType: 'json'
        }).done(function (data) {
            for (let lang_id in data) {
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
        let v = $(e.target).val();

        if (v.length < 1) {
            $(e.target).validateField('failed', _t('characters_min', {count: 1}));
            return false;
        } else if (v.length > 128) {
            $(e.target).validateField('failed', _t('characters_max', {count: 128}));
            return false;
        }

        $(e.target).validateField('ok');

        return true;
    },

    validateLabels: function () {
        $.each($(this.ui.label), function (i, label) {
            let v = $(this).val();

            if (v.length < 1) {
                $(this).validateField('failed', _t('characters_min', {count: 1}));
                return false;
            } else if (v.length > 128) {
                $(this).validateField('failed', _t('characters_max', {count: 128}));
                return false;
            }
        });

        return true;
    },

    onApply: function () {
        let view = this;
        let model = this.model;

        let labels = {};

        $.each($(this.ui.label), function (i, label) {
            let v = $(this).val();
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
                model.set('label', labels[window.session.language]);
                $.alert.success(_t("Successfully labeled !"));
            }).always(function () {
                view.destroy();
            });
        }
    }
});

module.exports = View;
