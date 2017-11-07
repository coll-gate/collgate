/**
 * @file accessionpanel.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-10-23
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'tr',
    className: 'object accessionpanel element',
    attributes: function () {
        return {
            'scope': 'row',
            'element-id': this.model.get('id')
        }
    },
    template: require("../../../descriptor/templates/entity.html"),

    templateContext: function () {
        return {
            columnsList: this.getOption('columnsList'),
            columnsOptions: this.getOption('columnsOptions')
        }
    },

    ui: {
        details: 'td.view-panel-details'
    },

    events: {
        'click @ui.details': 'viewDetails'
    },

    behaviors: {
        ActionBtnEvents: {
            behaviorClass: require('../../../main/behaviors/actionbuttonevents'),
            actions: {
                tag: {title: _t('Rename'), display: true, event: 'onRename'},
                edit: {display: false},
                manage: {display: true, event: 'viewDetails'},
                remove: {display: true, event: 'onDeletePanel'},
                unlink: {display: true, event: 'onUnlinkPanel'}
            }
        }
    },

    initialize: function () {
        this.listenTo(this.model, 'change', this.render, this);
    },

    actionsProperties: function () {
        let properties = {
            manage: {disabled: false},
            remove: {disabled: false}
        };

        // @todo manage permissions

        if (/*!this.model.get('can_delete') ||*/0) {
            properties.remove.disabled = true;
        }

        return properties;
    },

    onRender: function () {
    },

    viewDetails: function () {
        Backbone.history.navigate('app/accession/accessionpanel/' + this.model.get('id') + '/', {trigger: true});
    },

    onRename: function () {
        if (!session.user.isSuperUser || !session.user.isStaff) {
            return false;
        }

        let ChangeName = require('../../../main/views/entityrename');
        let changeName = new ChangeName({
            model: this.model,
            title: _t("Rename the accession panel")
        });

        changeName.render();
        changeName.ui.name.val(this.model.get('name'));

        return false;
    },

    onDeletePanel: function () {
        application.accession.controllers.accessionpanel.delete(this.model);
    },

    onUnlinkPanel: function () {
        let view = this;
        $.ajax({
            type: 'PATCH',
            url: window.application.url(['accession', 'accessionpanel', view.model.id, 'accessions']),
            dataType: 'json',
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({
                'action': 'remove',
                'selection': {
                    'select': {
                        "op": 'in',
                        "term": 'id',
                        "value": [view.getOption('accessionId')]
                    }
                }
            })
        }).done(function () {
            view.model.collection.count();
            view.model.collection.remove(view.model);
        });
    }
});

module.exports = View;
