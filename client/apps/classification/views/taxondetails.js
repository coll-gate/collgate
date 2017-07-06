/**
 * @file taxondetails.js
 * @brief Taxon details item view
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
    className: 'object taxon',
    template: require('../templates/taxondetails.html'),

    attributes: {
        style: "height: 25px; overflow-y: auto;"
    },

    ui: {
        "view_taxon": ".view-taxon",
        "change_parent": "span.change-parent",
        "taxon_rank": ".taxon-rank[name=taxon-rank]"
    },

    events: {
        'click @ui.view_taxon': 'onViewTaxon',
        'click @ui.change_parent': 'onChangeParent'
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        application.main.views.languages.htmlFromValue(this.el);
        application.classification.views.taxonSynonymTypes.htmlFromValue(this.el);
        application.classification.views.taxonRanks.elHtmlFromValue(this.ui.taxon_rank);
        application.classification.views.taxonRanks.attributeFromValue(this.el, 'title');
    },

    onViewTaxon: function(e) {
        var taxon_id = $(e.target).data('taxon-id');

        Backbone.history.navigate("app/classification/taxon/" + taxon_id + "/", {trigger: true});
    },

    onChangeParent: function () {
        var ChangeParent = Dialog.extend({
            template: require('../templates/taxonchangeparent.html'),

            attributes: {
                id: "dlg_change_parent"
            },

            ui: {
                parent: "#taxon_parent"
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
                        url: application.baseUrl + "classification/taxon/search/",
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
                    placeholder: gt.gettext("Enter a taxon name. 3 characters at least for auto-completion"),
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
