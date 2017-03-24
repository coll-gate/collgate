/**
 * @file organisationdetails.js
 * @brief Details view for organisation.
 * @author Frederic SCHERMA
 * @date 2017-03-07
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var Dialog = require('../../main/views/dialog');

var View = Marionette.ItemView.extend({
    tagName: "div",
    template: require('../templates/organisationdetails.html'),

    attributes: {
        style: "height: 25px; overflow-y: auto;"
    },

    ui: {
        'organisation_type': '.organisation-type',
        'change_type': '.change-type'
    },

    events: {
        'click @ui.change_type': 'onChangeType'
    },

    initialize: function(options) {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
       application.organisation.views.organisationTypes.htmlFromValue(this.el);
    },

    onChangeType: function () {
        var EditOrganisation = Dialog.extend({
            template: require('../templates/organisationedit.html'),

            attributes: {
                id: "dlg_edit_organisation"
            },

            ui: {
                name: "#organisation_name",
                type: "#organisation_type"
            },

            events: {
                'click @ui.apply': 'onApply',
                'input @ui.name': 'onNameInput'
            },

            initialize: function (options) {
                EditOrganisation.__super__.initialize.apply(this);
            },

            onRender: function () {
                EditOrganisation.__super__.onRender.apply(this);

                application.organisation.views.organisationTypes.drawSelect(this.ui.type);

                this.ui.name.val(this.getOption('model').get('name'));
                this.ui.type.selectpicker('val', this.getOption('model').get('type'));
            },

            onBeforeDestroy: function () {
                this.ui.type.selectpicker('destroy');

                EditOrganisation.__super__.onBeforeDestroy.apply(this);
            },

            onNameInput: function () {
                var name = this.ui.name.val().trim();
                var organisation_id = this.model.get('id');

                if (this.validateName()) {
                    var filters = {
                        method: 'ieq',
                        fields: ['name'],
                        'name': name
                    };

                    $.ajax({
                        type: "GET",
                        url: application.baseUrl + 'organisation/organisation/search/',
                        dataType: 'json',
                        data: {filters: JSON.stringify(filters)},
                        el: this.ui.name,
                        success: function (data) {
                            if (data.items.length > 0) {
                                for (var i in data.items) {
                                    var t = data.items[i];

                                    if (t.value.toUpperCase() == name.toUpperCase() && t.id != organisation_id) {
                                        $(this.el).validateField('failed', gt.gettext('Organisation name already in usage'));
                                        break;
                                    }
                                }
                            } else {
                                $(this.el).validateField('ok');
                            }
                        }
                    });
                }
            },

            validateName: function () {
                var v = this.ui.name.val().trim();

                if (v.length > 64) {
                    $(this.ui.name).validateField('failed', gt.gettext("64 characters max"));
                    return false;
                } else if (v.length < 3) {
                    $(this.ui.name).validateField('failed', gt.gettext('3 characters min'));
                    return false;
                }

                return true;
            },

            validate: function () {
                var valid = this.validateName();

                if (this.ui.name.hasClass('invalid') || this.ui.type.hasClass('invalid')) {
                    valid = false;
                }

                return valid;
            },

            onApply: function() {
                var model = this.getOption('model');
                var name = this.ui.name.val().trim();
                var type = this.ui.type.val();

                var data = {};

                if (name != model.get('name')) {
                    data.name = name;
                }

                if (type != model.get('type')) {
                    data.type = type;
                }

                if (model.isNew()) {
                    if (name != model.get('name')) {
                        model.set('name', name);
                    }

                    if (type != model.get('type')) {
                        model.set('type', type);
                    }
                } else {
                    model.save(data, {patch: true, wait: true});
                }

                this.destroy();
            }
        });

        var editOrganisation = new EditOrganisation({
            model: this.model
        });

        editOrganisation.render();
    }
});

module.exports = View;
