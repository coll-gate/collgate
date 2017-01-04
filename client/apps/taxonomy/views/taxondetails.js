/**
 * @file taxondetails.js
 * @brief Taxon details item view
 * @author Frederic SCHERMA
 * @date 2016-04-20
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var Dialog = require('../../main/views/dialog');

var View = Marionette.ItemView.extend({
    tagName: 'div',
    className: 'element object taxon',
    template: require('../templates/taxondetails.html'),

    ui: {
        "view_taxon": ".view-taxon",
        "taxon_rank": ".taxon-ranks",
        "change_parent": "span.change-parent"
    },

    events: {
        'click @ui.view_taxon': 'onViewTaxon',
        'click @ui.change_parent': 'onChangeParent',
    },

    initialize: function() {
        this.listenTo(this.model, 'reset', this.render, this);
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        application.main.views.languages.htmlFromValue(this.el);
        application.taxonomy.views.taxonSynonymTypes.htmlFromValue(this.el);
        application.taxonomy.views.taxonRanks.htmlFromValue(this.el);
    },

    onViewTaxon: function(e) {
        var taxon_id = $(e.target).data('taxon-id');

        Backbone.history.navigate("app/taxonomy/taxon/" + taxon_id + "/", {trigger: true});
    },

    onChangeParent: function () {
        var ChangeParent = Dialog.extend({
            template: require('../templates/taxonchangeparent.html'),

            attributes: {
                id: "dlg_change_parent",
            },

            ui: {
                parent: "#taxon_parent",
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
                        url: application.baseUrl + "taxonomy/taxon/search/",
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

            onApply: function() {
                var model = this.getOption('model');
                var parent = null;

                if (this.ui.parent.val()) {
                    parent = parseInt($(this.ui.parent).val());
                }

                model.save({parent: parent}, {patch: true, wait: true});
                this.remove();
            },
        });

        var changeParent = new ChangeParent({
            model: this.model
        });

        changeParent.render();
    }
});

module.exports = View;
