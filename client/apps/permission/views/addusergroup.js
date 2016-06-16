/**
 * @file addusegroup.js
 * @brief Add a user to a group collection
 * @author Frederic SCHERMA
 * @date 2016-06-15
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');

var View = Marionette.ItemView.extend({
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
        var select = this.ui.username;
        $(select).select2({
            ajax: {
                url: ohgr.baseUrl + "permission/user/search/",
                dataType: 'json',
                delay: 250,
                data: function (params) {
                    params.term || (params.term = '');
                    var lterms = params.term.split(' ');

                    // TODO exclude results contained in ... ...group/:groupname/user/
                    var filters = {
                        method: 'icontains',
                        fields: '*',
                        '*': [],
                    };

                    // TODO exclude results contained in ... ...group/:groupname/user/
                    for (var t in lterms) {
                        if (lterms[t].length >= 3) {
                            filters['*'].push(lterms[t]);
                        }
                    }

                    return {
                        page: params.page,
                        filters: JSON.stringify(filters),
                    };
                },
                processResults: function (data, params) {
                    // parse the results into the format expected by Select2
                    // since we are using custom formatting functions we do not need to
                    // alter the remote JSON data, except to indicate that infinite
                    // scrolling can be used
                    params.page = params.page || 1;

                    var results = [];

                    for (var i = 0; i < data.items.length; ++i) {
                        results.push({
                            id: data.items[i].value,
                            text: data.items[i].label
                        })
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

    addUser: function () {
        var el = this.ui.username;

        if (el.val()) {
            var username = el.val();
            el.val(null).trigger("change");
            this.collection.create({username: username}, {wait: true});
        }
    },
});

module.exports = View;
