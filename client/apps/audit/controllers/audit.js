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
var ScrollingMoreView = require('../../main/views/scrollingmore');

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
                        url: application.baseUrl + "permission/user/search/",
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
                application.getRegion('modalRegion').reset();
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
                $(this.ui.username).select2('destroy');  // destroy completely the dialog
                $(this.el).modal('hide').data('bs.modal', null);  // and hide the glass-pan
            },

            onBeforeDestroy: function() {
                // this.$el.empty().off();  // unbind the events
                // this.stopListening();
                this.close();
            },
        });

        var modal = new ModalView({controller: this});
        application.getRegion('modalRegion').show(modal);

        modal.on("view:search", function(args) {
            var username = $(args.view.ui.username).val();
            if (username) {
                this.getAuditListByUsername(username);
                args.view.closeAndDestroy();

                Backbone.history.navigate('app/audit/search/?username=' + username, {silent: true});
            }
        }, this);
    },

    getAuditListByUsername: function (username) {
        var auditCollection = new AuditCollection([], {username: username});

        var defaultLayout = new DefaultLayout({});
        application.getRegion('mainRegion').show(defaultLayout);

        defaultLayout.getRegion('title').show(new TitleView({title: gt.gettext("List of audit entries related to user"), object: username}));

        auditCollection.fetch({data: {cursor: null}, processData: true}).then(function () {
            var auditListView = new AuditListView({collection: auditCollection});

            defaultLayout.getRegion('content').show(auditListView);
            defaultLayout.getRegion('content_bottom').show(new ScrollingMoreView({targetView: auditListView}));
        });
    },

    searchByEntity: function (uuid) {
            var ModalView = Marionette.ItemView.extend({
            tagName: 'div',
            attributes: {
                'id': 'dlg_audit_by_entity',
                'class': 'modal',
                'tabindex': -1
            },
            template: require('../templates/auditbyentity.html'),

            ui: {
                cancel: "button.cancel",
                search: "button.search",
                entity: "#entity",
                content_type: "#content_type"
            },

            events: {
                'click @ui.cancel': 'onCancel',
                'keydown': 'keyAction',
                'input @ui.entity': 'onEntityInput',
            },

            triggers: {
                'click @ui.search': 'view:search',
            },

            initialize: function () {
            },

            onRender: function () {
                var view = this;
                $(this.el).modal();

                application.main.views.contentTypes.drawSelect(this.ui.content_type);
                //application.main.views.contentTypes.htmlFromValue(this.el);

                $(this.ui.entity).select2({
                    dropdownParent: $(this.el),
                    content_type: $(this.ui.content_type),
                    ajax: {
                        url: application.baseUrl + "main/entity/search/",
                        dataType: 'json',
                        delay: 250,
                        data: function (params) {
                            params.term || (params.term = '');

                            //var name_match = params.term.match(/^([a-zA-Z0-9_-]{1,})$/);
                            var uuid_match = params.term.match(/^[a-zA-Z0-9]{8}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{4}-[a-zA-Z0-9]{12}$/);

                            var filters = {
                                method: 'icontains'
                            };

                            if (uuid_match) {
                                filters.fields = 'uuid';
                                filters.uuid = params.term;
                            } else {
                                var ct = view.ui.content_type.val().split('.');

                                filters.fields = ['app_label', 'model', 'object_name'];
                                filters.app_label = ct[0];
                                filters.model = ct[1];
                                filters.object_name = params.term;
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
                    placeholder: gt.gettext("Select an entity UUID or name"),
                });
            },

            closeAndDestroy: function() {
                application.getRegion('modalRegion').reset();
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
        application.getRegion('modalRegion').show(modal);

        modal.on("view:search", function(args) {
            var object_id = $(args.view.ui.entity).val();
            var object_name = $(args.view.ui.entity).select2('data')[0].text;
            var ct = $(args.view.ui.content_type).val().split('.');
            if (ct.length == 2 && object_id) {
                this.getAuditListByEntity(ct[0], ct[1], object_id, object_name);
                args.view.closeAndDestroy();

                Backbone.history.navigate('app/audit/search/?app_label=' + ct[0] + '&model=' + ct[1] + '&object_id=' + object_id, {silent: true});
            }
        }, this);
    },

    getAuditListByEntity: function (app_label, model, object_id, object_name) {
        var auditCollection = new AuditCollection([], {entity: {app_label: app_label, model: model, object_id: object_id}});

        var defaultLayout = new DefaultLayout({});
        application.getRegion('mainRegion').show(defaultLayout);

        // if not specified retrieve the entity name
        if (object_name == null) {
            $.ajax({
                url: application.baseUrl + "main/entity/",
                dataType: 'json',
                data: {
                    app_label: app_label,
                    model: model,
                    object_id: object_id
                },
            }).done
            (function (data) {
                defaultLayout.getRegion('title').show(new TitleView({
                    title: gt.gettext("List of audit entries related to entity"),
                    object: data.name
                }));
            });
        } else {
            defaultLayout.getRegion('title').show(new TitleView({
                title: gt.gettext("List of audit entries related to entity"),
                object: object_name
            }));
        }

        auditCollection.fetch({data: {cursor: null}, processData: true}).then(function () {
            var auditListView = new AuditListView({collection: auditCollection});

            defaultLayout.getRegion('content').show(auditListView);
            defaultLayout.getRegion('content_bottom').show(new ScrollingMoreView({targetView: auditListView}));
        });
    }
});

module.exports = Controller;
