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
            var ModalView = Marionette.ItemView.extend({
            tagName: 'div',
            attributes: {
                'id': 'dlg_audit_by_uuuid',
                'class': 'modal',
                'tabindex': -1
            },
            template: require('../templates/auditbyuuid.html'),

            ui: {
                cancel: "button.cancel",
                search: "button.search",
                dialog: "#dlg_audit_by_uuid",
                uuid: "#uuid",
            },

            events: {
                'click @ui.cancel': 'onCancel',
                'keydown': 'keyAction',
                'input @ui.uuid': 'onUUIDInput',
            },

            triggers: {
                'click @ui.search': 'view:search',
            },

            initialize: function () {
            },

            onRender: function () {
                $(this.el).modal();

                $(this.ui.uuid).select2({
                    dropdownParent: $(this.el),
                    ajax: {
                        url: ohgr.baseUrl + "main/entity/search/",
                        dataType: 'json',
                        delay: 250,
                        data: function (params) {
                            params.term || (params.term = '');

                            var match1 = params.term.match(/^([a-zA-Z_]{3,}).([a-zA-Z_]{3,})\s+([a-zA-Z0-9_]{3,})$/);
                            var match2 = params.term.match(/^[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}$/);

                            var filters = {
                                method: 'icontains'
                            };

                            if (match1 && match1.length == 4) {
                                filters.fields = ['app_label', 'model', 'object_name'];
                                filters.app_label = match1[1];
                                filters.model = match1[2];
                                filters.object_name = match1[3];
                            } else if (match2) {
                                filters.fields = 'uuid';
                                filters.uuid = params.term;
                            } else {
                                filters.fields = ['app_label', 'model', 'object_name'];
                                filters.app_label = 'taxonomy';
                                filters.model = 'taxon';
                                filters.object_name = '_';

                                return {
                                    page: params.page,
                                    filters: JSON.stringify(filters),
                                }
                            }

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
                                    text: data.items[i].name
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
                    placeholder: gt.gettext("Select an entity UUID or a app_label.model object_name"),
                });
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
                $(this.ui.uuid).select2('destroy');
                $(this.el).modal('hide').data('bs.modal', null);
            },

            onBeforeDestroy: function() {
                this.close();
            },
        });

        var modal = new ModalView({controller: this});
        ohgr.getRegion('modalRegion').show(modal);

        modal.on("view:search", function(args) {
            var uuid = $(args.view.ui.uuid).val();
            if (uuid) {
                this.getAuditListByUUID(uuid, uuid); // TODO how to get label from select2 selection (data ?)
                args.view.closeAndDestroy();
            }
        }, this);
    },

    getAuditListByUUID: function (uuid, name) {
        var auditCollection = new AuditCollection([]);

        var defaultLayout = new DefaultLayout({});
        ohgr.mainRegion.show(defaultLayout);

        defaultLayout.title.show(new TitleView({title: gt.gettext("List of audit entries related to entity") + " " + name}));

        auditCollection.fetch({data: {uuid: uuid, page: 1}, processData: true}).then(function () {
            defaultLayout.content.show(new AuditListView({collection: auditCollection}));
        });
    }
});

module.exports = Controller;
