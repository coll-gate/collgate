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
var TaxonDetailsView = require('../views/taxondetails');
var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');

var TaxonController = Marionette.Controller.extend({

    create: function() {
        var CreateTaxonView = Marionette.ItemView.extend({
            el: "#dialog_content",
            tagName: "div",
            template: require('../templates/taxoncreate.html'),

            ui: {
                "cancel": "button.cancel",
                "create": "button.create",
                "dialog": "#dlg_create_taxon",
                "name": "#taxon_name",
                "rank": "#taxon_rank",
                "parent": "#taxon_parent",
            },

            events: {
                'click @ui.cancel': 'onCancel',
                'click @ui.create': 'onCreate',
                'keydown': 'keyAction',
                'input @ui.name': 'onNameInput',
                'change @ui.rank': 'onChangeRank',
            },

            initialize: function () {
            },

            onRender: function () {
                $(this.ui.dialog).modal();

                ohgr.taxonomy.views.taxonRanks.drawSelect(this.ui.rank);

                $(this.ui.parent).autocomplete({
                    open: function () {
                        $(this).autocomplete('widget').zIndex(10000);
                    },
                    source: function(req, callback) {
                        var rank = $("#taxon_rank").val();
                        var terms = req.term;/*
                        var terms = [];
                        var exprs = req.term.split('+')
                        var matched;
                        for (var i = 0; i < exprs.length; ++i) {
                            var expr = exprs[i].trim();
                            matched = expr.match(/^\[(.+)\](.*)/);

                            if (matched) {
                                terms.push({term: matched[2], type: matched[1], mode: 'icontains'});
                            } else {
                                terms.push({term: expr, type: 'name', mode: 'icontains'});
                            }
                        }
            */
                        $.ajax({
                            type: "GET",
                            url: ohgr.baseUrl + 'taxonomy/search/',
                            dataType: 'json',
                            data: {term: terms, type: "name", mode: "icontains", rank: rank},
                            async: true,
                            cache: true,
                            success: function(data) {
                                callback(data);
                                validateInput( $("#taxon_parent"), '');
                                $("#taxon_parent").attr("parent-id", 0);
                            }
                        });
                    },
                    minLength: 3,
                    delay: 100,
                    search: function(event, ui) {
                        return true;
                    },
                    focus: function(event, ui) {

                    },
                    change: function (event, ui) {
                        // TODO
                        var tr = $("#taxon_parent");

                        if (ui.item == null) {
                            tr.attr("parent-id", 0);

                            if (tr.val() != "") {
                                validateInput(tr, 'failed');
                            }
                        }
                    },
                    select: function(event, ui) {
                        var tp = $("#taxon_parent");
                        tp.attr("parent-id", ui.item.id);
                        validateInput(tp, 'ok');
                    }
                });
            },

            onCancel: function () {
                this.remove();
            },

            onChangeRank: function () {
                // reset parent
                this.ui.parent.val('');
                this.ui.parent.attr('parent-id', 0);
                validateInput(this.ui.parent, '');
            },

            onNameInput: function () {
                if (this.validateName()) {
                    $.ajax({
                        type: "GET",
                        url: ohgr.baseUrl + 'taxonomy/search/',
                        dataType: 'json',
                        data: {term: this.ui.name.val(), type: "name", mode: "ieq"},
                        el: this.ui.name,
                        success: function(data) {
                            if (data.length > 0) {
                                for (var i in data) {
                                    var t = data[i];

                                    if (t.value.toUpperCase() == this.el.val().toUpperCase()) {
                                        validateInput(this.el, 'failed', gettext('Taxon name already in usage'));
                                        break;
                                    }
                                }
                            } else {
                                validateInput(this.el, 'ok');
                            }
                        }/*,
                        error: function() {
                            error(gettext('Unable to search taxon by name'));
                        },*/
                    });
                }
            },

            validateName: function() {
                var v = this.ui.name.val();
                var re = /^[a-zA-Z0-9_\-]+$/i;

                if (v.length > 0 && !re.test(v)) {
                    validateInput(this.ui.name, 'failed', gettext("Invalid characters (alphanumeric, _ and - only)"));
                    return false;
                } else if (v.length < 3) {
                    validateInput(this.ui.name, 'failed', gettext('3 characters min'));
                    return false;
                }

                return true;
            },

            validate: function() {
                var valid = this.validateName();

                // need parent if not family
                var rankId = parseInt(this.ui.rank.val());
                var parentId = parseInt(this.ui.parent.attr('parent-id') || '0');

                if (rankId == 60 && parentId != 0) {
                    validateInput(this.ui.parent, 'failed', gettext("Family rank cannot have a parent taxon"));
                    valid = false;
                }

                if (rankId > 60 && parentId <= 0) {
                    validateInput(this.ui.parent, 'failed', gettext("This rank must have a parent taxon"));
                    valid = false;
                }

                if (this.ui.name.hasClass('invalid') || this.ui.parent.hasClass('invalid') || this.ui.rank.hasClass('invalid')) {
                    valid = false;
                }

                return valid;
            },

            onCreate: function() {
                if (this.validate()) {
                    // send
                    $.ajax({
                        type: "POST",
                        url: ohgr.baseUrl + "taxonomy/",
                        dataType: 'json',
                        contentType: "application/json; charset=utf-8",
                        view: this,
                        data: JSON.stringify({
                            taxon: {
                                name: this.ui.name.val(),
                                rank: parseInt(this.ui.rank.val()),
                                parent: parseInt(this.ui.parent.attr('parent-id') || '0'),
                            }
                        }),
                        success: function (data) {
                            if (data.result == "success") {
                                $(this.view.ui.dialog).modal('hide');
                                this.view.remove();
                                success(gettext("Taxon successfully created !"));

                                var collection = ohgr.taxonomy.collections.taxons;
                                collection.add({
                                    id: data.id,
                                    name: this.view.ui.name.val(),
                                    rank: this.view.ui.rank.val(),
                                    parent: this.view.ui.parent.attr('parent-id'),
                                });
                            }
                        }
                    });
                }
            },

            keyAction: function(e) {
                var code = e.keyCode || e.which;
                if (code == 27) {
                    this.remove();
                }
            },

            remove: function() {
              this.$el.empty().off(); /* off to unbind the events */
              this.stopListening();
              return this;
            }
        });

        var createTaxonView = new CreateTaxonView();
        createTaxonView.render();
    },
});

module.exports = TaxonController;
