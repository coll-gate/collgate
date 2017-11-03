/**
 * @file eventmessagepanel.js
 * @brief Event message panel layout.
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-02
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');
let Dialog = require('./dialog');

let View = Marionette.View.extend({
    className: "event-message-panel",
    template: require('../templates/eventmessagepanel.html'),

    attributes: {
        'style': 'height: 100%; padding: 5px;'
    },

    regions: {
        'content': 'div.panel-body'
    },

    ui: {
        'add': 'span.add-event-message',
        'refresh': 'span.refresh-event-messages'
    },

    events: {
        'click @ui.add': 'onAddEventMessage',
        'click @ui.refresh': 'onRefreshEventMessages'
    },

    initialize: function(options) {
    },

    onRender: function() {
        let view = this;
        let EventMessageListView = require('./eventmessagelist');

        application.main.collections.eventMessages.fetch().then(function() {
            view.showChildView('content', new EventMessageListView({collection: application.main.collections.eventMessages}));
        });
    },

    onAddEventMessage: function() {
        let CreateEventMessage = Dialog.extend({
            template: require('../templates/eventmessagecreate.html'),

            attributes: {
                id: "dlg_create_event_message"
            },

            ui: {
                message: "form.messages input"
            },

            events: {
                'input @ui.message': 'onMessageInput'
            },

            initialize: function (options) {
                CreateEventMessage.__super__.initialize.apply(this, arguments);
            },

            onMessageInput: function (e) {
                this.validateMessage(e);
            },

            validateMessage: function (e) {
                let v = $(e.target).val();

                if (v.length === 0) {
                    $(e.target).validateField('failed', _t('Should not be empty'));
                    return false;
                }

                $(e.target).validateField('ok');

                return true;
            },

            validateMessages: function() {
                $.each($(this.ui.message), function(i, message) {
                    let v = $(this).val();

                   if (v.length === 0) {
                       $(this).validateField('failed', _t('Should not be empty'));
                       return false;
                    }
                });

                return true;
            },

            onApply: function () {
                let view = this;
                let collection = this.getOption('collection');

                let messages = {};

                $.each($(this.ui.message), function(i, message) {
                    let v = $(this).val();
                    messages[$(message).attr("language")] = v;
                });

                if (this.validateMessages()) {
                    $.ajax({
                        type: "POST",
                        url: collection.url,
                        dataType: 'json',
                        contentType: "application/json; charset=utf-8",
                        data: JSON.stringify(messages)
                    }).done(function(data) {
                        collection.add([data]);
                        $.alert.success(_t("Successfully inserted !"));
                    }).always(function() {
                        view.destroy();
                    });
                }
            }
        });

        let createEventMessage = new CreateEventMessage({collection: this.getChildView('content').collection});
        createEventMessage.render();
    },

    onRefreshEventMessages: function () {
        this.getChildView('content').collection.fetch();
    }
});

module.exports = View;
