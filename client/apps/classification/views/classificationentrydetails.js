/**
 * @file classificationentrydetails.js
 * @brief Classification entry details item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-04-20
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');

var Dialog = require('../../main/views/dialog');

var View = Marionette.View.extend({
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

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        application.main.views.languages.htmlFromValue(this.el);
        application.classification.views.classificationEntrySynonymTypes.htmlFromValue(this.el);

        // @todo factorize
        var values = [];
        var self = this;

        this.$el.find('span.classification-rank').each(function(i, element) {
            values.push(parseInt($(this).attr('value')));
        });

        application.main.cache.lookup({
            type: 'entity',
            format: {
                model: 'classification.classificationrank',
                details: true
            }
        }, values).done(function (data) {
            self.$el.find('span.classification-rank').each(function(i, element) {
                var value = $(this).attr('value');

                $(this).attr('data-content', data[value].value.label)
                    .popover({trigger: 'hover', placement: 'bottom'});
            });
        });
    },

    onViewClassificationEntry: function(e) {
        var cls_id = $(e.target).data('classification-entry-id');

        Backbone.history.navigate("app/classification/classificationentry/" + cls_id + "/", {trigger: true});
    },

    onChangeParent: function () {
        var ChangeParent = Dialog.extend({
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

                var rank = parseInt(this.model.get('rank'));

                $(this.ui.parent).select2({
                    dropdownParent: $(this.el),
                    ajax: {
                        url: application.baseUrl + "classification/classificationentry/search/",
                        dataType: 'json',
                        delay: 250,
                        data: function (params) {
                            params.term || (params.term = '');

                            var filters = {
                                method: 'icontains',
                                fields: ['name', 'rank'],
                                'name': params.term,
                                'rank': rank
                            };

                            return {
                                page: params.page,
                                filters: JSON.stringify(filters),
                            };
                        },
                        processResults: function (data, params) {
                            // no pagination
                            params.page = params.page || 1;

                            var results = [];

                            for (var i = 0; i < data.items.length; ++i) {
                                results.push({
                                    id: data.items[i].id,
                                    text: data.items[i].label
                                });
                            }

                            return {
                                results: results,
                                pagination: {
                                    more: (params.page * 30) < data.total_count
                                }
                            };
                        },
                        cache: true
                    },
                    minimumInputLength: 3,
                    placeholder: gt.gettext("Enter a classification entry name. 3 characters at least for auto-completion"),
                });
            },

            onBeforeDestroy: function() {
                this.ui.parent.select2('destroy');

                ChangeParent.__super__.onBeforeDestroy.apply(this);
            },

            onApply: function() {
                var model = this.getOption('model');
                var parent = null;

                if (this.ui.parent.val()) {
                    parent = parseInt($(this.ui.parent).val());
                }

                model.save({parent: parent}, {patch: true, wait: true});

                this.destroy();
            }
        });

        var changeParent = new ChangeParent({
            model: this.model
        });

        changeParent.render();
    }
});

module.exports = View;
