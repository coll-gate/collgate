/**
 * @file entitypath.js
 * @brief Taxon path + entity name item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-29
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var Marionette = require('backbone.marionette');
var Dialog = require('../../main/views/dialog');

var TaxonModel = require('../models/taxon');

var View = Marionette.View.extend({
    tagName: 'div',
    template: require('../templates/entitypath.html'),
    templateContext: function () {
        return {
            taxon: this.taxon
        };
    },

    taxon: {name: '', rank: 0, parent_details: []},
    noLink: false,

    attributes: {
        style: "height: 25px; overflow-y: auto;"
    },

    ui: {
        view_taxon: ".view-taxon",
        taxon_rank: ".taxon-ranks",
        change_parent: ".change-parent"
    },

    events: {
        'click @ui.view_taxon': 'onViewTaxon',
        'click @ui.change_parent': 'onChangeParent'
    },

    initialize: function(options) {
        this.mergeOptions(options, ['taxon']);

        this.listenTo(this.model, 'change:name', this.render, this);
        this.listenTo(this.model, 'change:parent', this.updateParent, this);
    },

    updateParent: function(model, value) {
        var view = this;

        // update the taxon
        this.taxon = new TaxonModel({id: value});
        this.taxon.fetch().then(function() {
            view.render();
        });
    },

    onRender: function() {
        application.classification.views.taxonRanks.attributeFromValue(this.el, 'title');

        if (this.getOption('noLink')) {
            this.ui.view_taxon.removeClass('action');
        }
    },

    onViewTaxon: function(e) {
        if (this.getOption('noLink')) {
            return;
        }

        var taxon_id = $(e.target).data('taxon-id');
        Backbone.history.navigate("app/classification/taxon/" + taxon_id + "/", {trigger: true});
    },

    onChangeParent: function() {
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

                var rank = 100;

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

                if ($(this.ui.parent).val()) {
                    parent = parseInt($(this.ui.parent).val());
                }

                if (model.isNew()) {
                    model.set('parent', parent);
                } else {
                    model.save({parent: parent}, {patch: true, wait: true});
                }

                this.destroy();
            },
        });

        var changeParent = new ChangeParent({
            model: this.model
        });

        changeParent.render();
    }
});

module.exports = View;
