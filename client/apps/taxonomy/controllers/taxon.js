/**
 * @file taxon.js
 * @brief Taxon controller
 * @author Frederic SCHERMA
 * @date 2016-04-22
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var TaxonModel = require('../models/taxon');
var TaxonCollection = require('../collections/taxon');
var TaxonListView = require('../views/taxonlist');
var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');
var Dialog = require('../../main/views/dialog');

var TaxonController = Marionette.Object.extend({

    create: function() {
        var CreateTaxonView = Dialog.extend({
            attributes: {
                'id': 'dlg_create_taxon',
            },
            template: require('../templates/taxoncreate.html'),

            ui: {
                create: "button.create",
                language: "#taxon_language",
                name: "#taxon_name",
                rank: "#taxon_rank",
                parent: "#taxon_parent",
                parent_group: ".taxon-parent-group",
            },

            events: {
                'click @ui.create': 'onCreate',
                'input @ui.name': 'onNameInput',
                'change @ui.rank': 'onChangeRank',
            },

            onRender: function () {
                CreateTaxonView.__super__.onRender.apply(this);

                this.ui.parent_group.hide();

                application.main.views.languages.drawSelect(this.ui.language);
                application.taxonomy.views.taxonRanks.drawSelect(this.ui.rank);

                $(this.ui.parent).select2({
                    dropdownParent: $(this.el),
                    ajax: {
                        url: application.baseUrl + "taxonomy/taxon/search/",
                        dataType: 'json',
                        delay: 250,
                        data: function (params) {
                            params.term || (params.term = '');

                            return {
                                filters: JSON.stringify({
                                    method: 'icontains',
                                    fields: ['name', 'rank'],
                                    'name': params.term.trim(),
                                    'rank': parseInt($("#taxon_rank").val())
                                }),
                                cursor: params.next
                            };
                        },
                        processResults: function (data, params) {
                            params.next = null;

                            if (data.items.length >= 30) {
                                params.next = data.next || null;
                            }

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
                                    more: params.next != null
                                }
                            };
                        },
                        cache: true
                    },
                    minimumInputLength: 3,
                    placeholder: gt.gettext("Enter a taxon name. 3 characters at least for auto-completion"),
                });

                $(this.ui.parent).on('select2:select', function (e) {
                    //var id = e.params.data.id;
                });
                /*
                $(this.ui.parent).autocomplete({
                    open: function () {
                        $(this).autocomplete('widget').zIndex(10000);
                    },
                    source: function(req, callback) {
                        var rank = $("#taxon_rank").val();
                        var terms = req.term;

                        $.ajax({
                            type: "GET",
                            url: application.baseUrl + 'taxonomy/search/',
                            dataType: 'json',
                            data: {term: terms, type: "name", mode: "icontains", rank: rank},
                            async: true,
                            cache: true,
                            success: function(data) {
                                callback(data);
                                $("#taxon_parent").attr("parent-id", 0);

                                if (data.length == 0) {
                                    $("#taxon_parent").validateField('failed');
                                } else {
                                    $("#taxon_parent").validateField('');
                                }
                            }
                        });
                    },
                    minLength: 3,
                    delay: 100,
                    //autoFocus: true,
                    search: function(event, ui) {
                        return true;
                    },
                    close: function (event, ui) {
                        var tp = $("#taxon_parent");

                        if (tp.val() === "") {
                            $("#taxon_parent").validateField('failed');
                        }
                    },
                    change: function (event, ui) {
                        var tp = $("#taxon_parent");
                        var rank = $("#taxon_rank").val();

                        $.ajax({
                            type: "GET",
                            url: application.baseUrl + 'taxonomy/search/',
                            dataType: 'json',
                            data: {term: tp.val(), type: "name", mode: "ieq", rank: rank},
                            async: true,
                            cache: true,
                            success: function(data) {
                                if (data.length == 1) {
                                    $("#taxon_parent").attr("parent-id", data[0].id).validateField('ok');
                                } else {
                                     tp.validateField('failed');
                                }
                            },
                        });
                    },
                    select: function(event, ui) {
                        var tp = $("#taxon_parent");
                        tp.attr("parent-id", ui.item.id);
                        tp.validateField('ok');
                    }
                });*/
            },

            onBeforeDestroy: function() {
                this.ui.language.selectpicker('destroy');
                this.ui.rank.selectpicker('destroy');

                CreateTaxonView.__super__.onBeforeDestroy.apply(this);
            },

            onChangeRank: function () {
                // reset parent
                $(this.ui.parent).val('').trigger('change');

                if (this.ui.rank.val() == 60)
                    this.ui.parent_group.hide();
                else
                    this.ui.parent_group.show();
            },

            onNameInput: function () {
                var name = this.ui.name.val().trim();

                if (this.validateName()) {
                    var filters = {
                        method: 'ieq',
                        fields: ['name'],
                        'name': name
                    };

                    $.ajax({
                        type: "GET",
                        url: application.baseUrl + 'taxonomy/taxon/synonym/search/',
                        dataType: 'json',
                        data: {filters: JSON.stringify(filters)},
                        el: this.ui.name,
                        success: function(data) {
                            if (data.items.length > 0) {
                                for (var i in data.items) {
                                    var t = data.items[i];

                                    if (t.value.toUpperCase() == name.toUpperCase()) {
                                        $(this.el).validateField('failed', gt.gettext('Taxon name already in usage'));
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

            validateName: function() {
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

            validate: function() {
                var valid = this.validateName();

                // need parent if not family
                var rankId = parseInt(this.ui.rank.val());
                var parentId = 0;

                if ($(this.ui.parent).val())
                    parentId = parseInt($(this.ui.parent).val());

                if (rankId == 60 && parentId != 0) {
                    $.alert.error(gt.gettext("Family rank cannot have a parent taxon"));
                    valid = false;
                }

                if (rankId > 60 && parentId <= 0) {
                    $.alert.error(gt.gettext("This rank must have a parent taxon"));
                    valid = false;
                }

                if (this.ui.name.hasClass('invalid') || this.ui.parent.hasClass('invalid') || this.ui.rank.hasClass('invalid')) {
                    valid = false;
                }

                return valid;
            },

            onCreate: function() {
                var view = this;
                var name = this.ui.name.val().trim();

                if (this.validate()) {
                    application.taxonomy.collections.taxons.create({
                        name: name,
                        rank: parseInt(this.ui.rank.val()),
                        parent: parseInt($(this.ui.parent).val() || '0'),
                        synonyms: [{
                            name: this.ui.name.val(),
                            type: 0,  // primary
                            language: this.ui.language.val()
                        }]
                    }, {
                        wait: true,
                        success: function (model, resp, options) {
                            view.destroy();
                            $.alert.success(gt.gettext("Taxon successfully created !"));
                        }
                    });
                }
            }
        });

        var createTaxonView = new CreateTaxonView();
        createTaxonView.render();
    }
});

module.exports = TaxonController;
