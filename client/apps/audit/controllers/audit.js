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

    byUserName: function (username) {
        var ModalView = Marionette.ItemView.extend({
            el: "#dialog_content",
            tagName: "div",
            template: require('../templates/auditbyusername.html'),

            ui: {
                cancel: "button.cancel",
                search: "button.search",
                dialog: "#dlg_audit_by_username",
                username: "#username",
            },

            events: {
                'click @ui.cancel': 'onCancel',
                'click @ui.search': 'onSearch',
                'keydown': 'keyAction',
                'input @ui.username': 'onUserNameInput',
            },

            initialize: function () {
            },

            onRender: function () {
                $(this.ui.dialog).modal();

                $(this.ui.username).select2({
                    ajax: {
                        url: ohgr.baseUrl + "permission/user/search/",  // TODO to main/user/search and same for group
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
                }).select2('open');
            },

            onCancel: function () {
                this.remove();
            },

            onSearch: function () {
                this.remove();

                var username = $(this.ui.username).val();
                var auditCollection = new AuditCollection([]);

                var defaultLayout = new DefaultLayout({});
                ohgr.mainRegion.show(defaultLayout);

                defaultLayout.title.show(new TitleView({title: gt.gettext("List of audit entries related to user") + " " + username}));

                auditCollection.fetch({data: {username: username, page: 1}, processData: true}).then(function () {
                    defaultLayout.content.show(new AuditListView({collection : auditCollection}));
                });
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

        var modal = new ModalView();
        modal.render();
    },

    byEntityUUID: function (uuid) {
        alert("TODO");
        return;
        var auditCollection = new AuditCollection([]);

        var defaultLayout = new DefaultLayout({});
        ohgr.mainRegion.show(defaultLayout);

        defaultLayout.title.show(new TitleView({title: gt.gettext("List of audit entries related to entity") + " " + uuid}));

        auditCollection.fetch({data: {uuid: uuid, page: 1}, processData: true}).then(function () {
            defaultLayout.content.show(new AuditListView({collection : auditCollection}));
        });
    }
});

module.exports = Controller;
