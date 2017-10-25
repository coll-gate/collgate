/**
 * @file entitypath.js
 * @brief Classification entry path + entity name item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-29
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');
let Dialog = require('../../main/views/dialog');
let Search = require('../../main/utils/search');

let ClassificationEntryModel = require('../models/classificationentry');

let View = Marionette.View.extend({
    tagName: 'div',
    template: require('../templates/entitypath.html'),
    templateContext: function () {
        return {
            classificationEntry: this.classificationEntry
        };
    },

    classificationEntry: {name: '', rank: 0, parent_details: []},
    noLink: false,

    attributes: {
        style: "height: 25px; overflow-y: auto;"
    },

    ui: {
        view_classification_entry: ".view-classification-entry",
        change_parent: ".change-parent"
    },

    events: {
        'click @ui.view_classification_entry': 'onViewClassificationEntry',
        'click @ui.change_parent': 'onChangeParent'
    },

    initialize: function(options) {
        this.mergeOptions(options, ['classificationEntry']);

        this.listenTo(this.model, 'change:name', this.render, this);
        this.listenTo(this.model, 'change:primary_classification_entry', this.updateParent, this);
    },

    updateParent: function(model, value) {
        let view = this;

        // update the classificationEntry
        this.classificationEntry = new ClassificationEntryModel({id: value});
        this.classificationEntry.fetch().then(function() {
            if (!view.isRendered()) {
                return;
            }

            view.render();
        });
    },

    onRender: function() {
        this.$el.popupcell('init', {
            className: 'classification-rank',
            type: 'entity',
            children: true,
            format: {
                model: 'classification.classificationrank',
                details: true
            }
        });

        if (this.getOption('noLink')) {
            this.ui.view_classification_entry.removeClass('action');
        }
    },

    onViewClassificationEntry: function(e) {
        if (this.getOption('noLink')) {
            return;
        }

        let cls_id = $(e.target).data('classification-entry-id');
        Backbone.history.navigate("app/classification/classificationentry/" + cls_id + "/", {trigger: true});
    },

    onChangeParent: function() {
        let ChangeParent = Dialog.extend({
            template: require('../templates/classificationentrychangeparent.html'),

            attributes: {
                id: "dlg_change_parent"
            },

            ui: {
                parent: "#classification_entry_parent"
            },

            initialize: function (options) {
                ChangeParent.__super__.initialize.apply(this);
            },

            onRender: function () {
                ChangeParent.__super__.onRender.apply(this);

                let classificationRankId = this.getOption('classificationEntry').get('id');

                this.ui.parent.select2(Search(
                    this.$el,
                    window.application.url(['classification', 'classificationentry', 'search']),
                    function (params) {
                        return {
                            method: 'icontains',
                            fields: ['name', 'rank'],
                            'name': params.term,
                            'rank': classificationRankId
                        };
                    }, {
                        placeholder: _t("Enter a classification entry name. 3 characters at least for auto-completion")
                    })
                );
            },

            onBeforeDestroy: function() {
                this.ui.parent.select2('destroy');

                ChangeParent.__super__.onBeforeDestroy.apply(this);
            },

            onApply: function() {
                let model = this.getOption('model');
                let classificationEntryId = parseInt($(this.ui.parent).val());

                if (isNaN(classificationEntryId)) {
                    $.alert.error(_t('Undefined classification entry.'));
                    return false;
                }

                if (model.isNew()) {
                    model.set('primary_classification_entry', classificationEntryId);
                } else {
                    model.save({primary_classification_entry: classificationEntryId}, {patch: true, wait: true});
                }

                this.destroy();
            },
        });

        let changeParent = new ChangeParent({
            model: this.model,
            classificationEntry: this.classificationEntry
        });

        changeParent.render();
    }
});

module.exports = View;
