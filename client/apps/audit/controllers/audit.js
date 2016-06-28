/**
 * @file audit.js
 * @brief Audit controller
 * @author Frederic SCHERMA
 * @date 2016-06-24
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var AuditCollection = require('../collections/audit');
var AuditListView = require('../views/auditlist');
var DefaultLayout = require('../../main/views/defaultlayout');
var TitleView = require('../../main/views/titleview');

var Controller = Marionette.Controller.extend({

    searchByUserName: function () {
        var ModalView = Marionette.ItemView.extend({
            tagName: 'div',
            attributes: {
                'id': 'dlg_audit_by_username',
                'class': 'modal',
                'tabindex': -1
            },
            template: require('../templates/auditbyusername.html'),

            ui: {
                cancel: "button.cancel",
                search: "button.search",
                dialog: "#dlg_audit_by_username",
                username: "#username",
            },

            events: {
                'click @ui.cancel': 'onCancel',
                'keydown': 'keyAction',
                'input @ui.username': 'onUserNameInput',
            },

            triggers: {
                'click @ui.search': 'view:search',
            },

            initialize: function () {
            },

            onRender: function () {
                $(this.el).modal();

                $(this.ui.username).select2({
                    dropdownParent: $(this.el),
                    ajax: {
                        url: ohgr.baseUrl + "permission/user/search/",
                        dataType: 'json',
                        delay: 250,
                        data: function (params) {
                            params.term || (params.term = '');

                            var filters = {
                                method: 'icontains',
                                fields: '*',
                                '*': params.term.split(' ').filter(function (t) { return t.length > 2; }),
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
                                    id: data.items[i].value,
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
                    placeholder: gt.gettext("Select a username"),
                });
                /*$(this.ui.username).autocomplete({
                    open: function () {
                        $(this).autocomplete('widget').zIndex(10000);
                    },
                    source: function(req, callback) {
                        var terms = req.term || '';

                        var filters = {
                            method: 'icontains',
                            fields: '*',
                            '*': terms.split(' ').filter(function (t) { return t.length > 2; }),
                        };

                        $.ajax({
                            type: "GET",
                            url: ohgr.baseUrl + 'permission/user/search/',
                            dataType: 'json',
                            data: {filters: JSON.stringify(filters), page: 1},
                            async: true,
                            cache: true,
                            success: function(data) {
                                var results = [];

                                for (var i = 0; i < data.items.length; ++i) {
                                    results.push({
                                        value: data.items[i].value,
                                        label: data.items[i].label
                                    })
                                }

                                callback(results);
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
                    },
                    change: function (event, ui) {
                    },
                    select: function(event, ui) {
                    }
                });*/
            },

            closeAndDestroy: function() {
                ohgr.getRegion('modalRegion').reset();
            },

            onCancel: function () {
                this.closeAndDestroy();
            },

            keyAction: function(e) {
                var code = e.keyCode || e.which;
                if (code == 27) {
                    this.closeAndDestroy();
                }
            },

            close: function () {
                $(this.ui.username).select2('destroy');
                $(this.el).modal('hide').data('bs.modal', null);
            },

            onBeforeDestroy: function() {
                // this.$el.empty().off();  // unbind the events
                // this.stopListening();
                this.close();
            },
        });

        var modal = new ModalView({controller: this});
        ohgr.getRegion('modalRegion').show(modal);

        modal.on("view:search", function(args) {
            var username = $(args.view.ui.username).val();
            if (username) {
                this.getAuditListByUsername(username);
                args.view.closeAndDestroy();
            }
        }, this);
    },

    getAuditListByUsername: function (username) {
        var auditCollection = new AuditCollection([]);

        var defaultLayout = new DefaultLayout({});
        ohgr.mainRegion.show(defaultLayout);

        defaultLayout.title.show(new TitleView({title: gt.gettext("List of audit entries related to user") + " " + username}));

        auditCollection.fetch({data: {username: username, page: 1}, processData: true}).then(function () {
            defaultLayout.content.show(new AuditListView({collection: auditCollection}));
        });
    },

    searchByEntityUUID: function (uuid) {
        alert("TODO");
    },

    getAuditListByUUID: function (uuid) {
        var auditCollection = new AuditCollection([]);

        var defaultLayout = new DefaultLayout({});
        ohgr.mainRegion.show(defaultLayout);

        defaultLayout.title.show(new TitleView({title: gt.gettext("List of audit entries related to entity") + " " + uuid}));

        auditCollection.fetch({data: {uuid: uuid, page: 1}, processData: true}).then(function () {
            defaultLayout.content.show(new AuditListView({collection: auditCollection}));
        });
    }
});

module.exports = Controller;
