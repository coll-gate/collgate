/**
 * @file classificationentrydetails.js
 * @brief Classification entry details item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-20
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
    className: 'object classification-entry',
    template: require('../templates/classificationentrydetails.html'),

    attributes: {
        style: "height: 25px; overflow-y: auto;"
    },

    ui: {
        "view_classification_entry": ".view-classification-entry",
        "change_parent": "span.change-parent",
        "classification_rank": ".classification-rank[name=classification-rank]"
    },

    events: {
        'click @ui.view_classification_entry': 'onViewClassificationEntry',
        'click @ui.change_parent': 'onChangeParent'
    },

    noLink: false,

    initialize: function(options) {
        this.listenTo(this.model, 'change', this.render, this);
        this.listenTo(this.model, 'change:parent', this.updateParent, this);
    },

    updateParent: function(model, value) {
        let view = this;

        // update the parent
        let parentClassificationEntry = new ClassificationEntryModel({id: this.model.get('parent')});
        parentClassificationEntry.fetch().then(function () {
            if (!view.isRendered()) {
                return;
            }

            let parentDetails = [];

            parentDetails.push({
                id: parentClassificationEntry.get('id'),
                name: parentClassificationEntry.get('name'),
                rank: parentClassificationEntry.get('rank'),
                parent: parentClassificationEntry.get('parent')
            });

            parentDetails.push.apply(parentDetails, parentClassificationEntry.get('parent_details'));

            view.model.set('parent_details', parentDetails);
            view.render();
        });
    },

    onRender: function() {
        window.application.main.views.languages.htmlFromValue(this.el);
        window.application.main.views.entitySynonymTypes.htmlFromValue(this.el);

        this.$el.find('span[name=details]').asyncvalue('init', {
            className: 'classification-rank',
            type: 'entity',
            format: {
                model: 'classification.classificationrank',
                details: true
            }
        });

        this.$el.find('span[name=parents]').popupcell('init', {
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

    onChangeParent: function () {
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

                let rank = parseInt(this.model.get('rank'));

                this.ui.parent.select2(Search(
                    this.$el,
                    window.application.url(['classification', 'classificationentry', 'search']),
                    function (params) {
                        return {
                            method: 'icontains',
                            fields: ['name', 'rank'],
                            'name': params.term,
                            'rank': rank
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
                let parentId = parseInt(this.ui.parent.val());

                if (isNaN(parentId)) {
                    $.alert.error(_t('Undefined classification entry.'));
                    return false;
                }

                if (model.isNew()) {
                    model.set('parent', parentId);
                } else {
                    model.save({parent: parentId}, {patch: true, wait: true});
                }

                this.destroy();
            }
        });

        let changeParent = new ChangeParent({
            model: this.model
        });

        changeParent.render();
    }
});

module.exports = View;
