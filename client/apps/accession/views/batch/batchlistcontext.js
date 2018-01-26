/**
 * @file batchlistcontext.js
 * @brief Batch list context menu
 * @author Medhi BOULNEMOUR (INRA UMR1095)
 * @author Frederic SCHERMA (INRA UMR1095)
 * @date 2017-11-06
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'div',
    template: require('../../../main/templates/contextmenu.html'),
    className: "context batch-list",
    templateContext: function () {
        return {
            actions: this.getOption('actions'),
            options: {
                'create-panel': {className: 'btn-default', label: _t('Create new panel')},
                'link-to-panel': {className: 'btn-default', label: _t('Link to existing panel')},
                'unlink-batches': {className: 'btn-danger', label: _t('Unlink batches')}
            }
        }
    },

    ui: {
        'create-panel': 'button[name="create-panel"]',
        'link-to-panel': 'button[name="link-to-panel"]',
        'unlink-batches': 'button[name="unlink-batches"]'
    },

    triggers: {
        "click @ui.create-panel": "panel:create",
        "click @ui.link-to-panel": "panel:link-batches",
        "click @ui.unlink-batches": "batches:unlink"
    },

    initialize: function (options) {
        this.accessionId = options.accessionId || -1;
        this.advancedTable = options.advancedTable || null;
    },

    onRender: function () {
        let self = this;

        let createAction = $('<select name="action-type" data-width="100%" data-style="btn-success" title="' + _t('Create an action') + '"></select>');
        let BatchActionTypeCollection = require('../../collections/actiontype');

        let batchActionTypeCollection = new BatchActionTypeCollection();
        batchActionTypeCollection.fetch({}).done(function (data) {
            for (let i = 0; i < data.items.length; ++i) {
                createAction.append($('<option value="' + data.items[i].id + '">' + data.items[i].label + '</option>'));
            }

            self.$el.find("div.describable-header").children("div.btn-group-vertical").prepend(createAction);

            createAction.selectpicker({
                style: 'btn-default',
                container: 'body'
            }).on('change', $.proxy(self.onCreateAction, self));

            self.$el.find("span.filter-option.pull-left").css("text-align", "center");
        });
    },


    onCreateAction: function(e) {
        let val = parseInt($(e.target).selectpicker().val());
        let accessionId = this.getOption("accessionId");
        let inputBatches = false;

        if (this.advancedTable && this.advancedTable.getSelection) {
            let selection = this.advancedTable.getSelection('select');
            if (typeof selection === "boolean") {
                if (selection) {
                    // how to support that, need many input collection on server side ...
                    // inputBatches = advancedTable.collection.models
                }
            } else {
                inputBatches = selection;
            }
        }

        $.ajax({
            type: "POST",
            url: window.application.url(['accession', 'action']),
            dataType: 'json',
            contentType: "application/json; charset=utf-8",
            data: JSON.stringify({
                "accession": accessionId,
                "type": val,
                "batches": inputBatches
            })
        }).done(function(data) {
            // @todo
        });
    }
});

module.exports = View;
