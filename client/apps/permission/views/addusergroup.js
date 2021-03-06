/**
 * @file addusergroup.js
 * @brief Add a user to a group collection
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-06-15
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    tagName: 'div',
    className: 'user-add',
    template: require('../templates/addusergroup.html'),

    ui: {
        add_user: ".add-user",
        username: "select.username",
    },

    events: {
        'click @ui.add_user': 'addUser',
    },

    initialize: function(options) {
        options || (options = {});
        this.collection = options.collection;
    },

    onDomRefresh: function () {
        let select = this.ui.username;
        let collection = this.collection;

        $(select).select2({
            ajax: {
                url: window.application.url(['permission', 'user', 'search']),
                dataType: 'json',
                delay: 250,
                data: function (params) {
                    params.term || (params.term = '');

                    let filters = {
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

                    let results = [];

                    for (let i = 0; i < data.items.length; ++i) {
                        // ignore results in collection of users
                        if (collection.findWhere({username: data.items[i].value}) == undefined) {
                            results.push({
                                id: data.items[i].value,
                                text: data.items[i].label
                            });
                        }
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
            placeholder: _t("Select a username"),
        });
    },

    addUser: function () {
        let el = this.ui.username;

        if (el.val()) {
            let username = el.val();
            el.val(null).trigger("change");
            this.collection.create({username: username}, {wait: true});
        }
    },
});

module.exports = View;
