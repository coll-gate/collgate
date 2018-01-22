/**
 * @file panel.js
 * @brief
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @date 2017-11-07
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'tr',
    className: 'object batchpanel element',
    attributes: function () {
        return {
            'scope': 'row',
            'element-id': this.model.get('id')
        }
    },
    template: require("../../../../descriptor/templates/entity.html"),

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
            behaviorClass: require('../../../../main/behaviors/actionbuttonevents'),
            actions: {
                tag: {title: _t('Rename'), display: true, event: 'onRename'},
                edit: {display: false},
                manage: {display: true, event: 'viewDetails'},
                remove: {display: true, event: 'onDeletePanel'}
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
        Backbone.history.navigate('app/accession/batchpanel/' + this.model.get('id') + '/', {trigger: true});
    },

    onRename: function () {
        if (!window.application.permission.manager.isStaff()) {
            return false;
        }

        let ChangeName = require('../../../../main/views/entityrename');
        let changeName = new ChangeName({
            model: this.model,
            title: _t("Rename the batch panel")
        });

        changeName.render();
        changeName.ui.name.val(this.model.get('name'));

        return false;
    },

    onDeletePanel: function () {
        window.application.accession.controllers.batchpanel.destroy(this.model);
    }
});

module.exports = View;
