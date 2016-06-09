/**
 * @file groupuserlist.js
 * @brief Permission user list from a group view
 * @author Frederic SCHERMA
 * @date 2016-06-09
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var PermissionGroupUserModel = require('../models/groupuser');
var PermissionGroupUserView = require('../views/groupuser');

var View = Marionette.CompositeView.extend({
    template: require("../templates/groupuserlist.html"),
    childView: PermissionGroupUserView,
    childViewContainer: 'tbody.group-user-list',

    ui: {
        add_user: 'span.add-user',
        username: 'input.username',
    },

    events: {
        'click @ui.add_user': 'addUserToGroup',
    },

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);
        //this.listenTo(this.collection, 'add', this.render, this);
        //this.listenTo(this.collection, 'remove', this.render, this);
        this.listenTo(this.collection, 'change', this.render, this);
    },

    onRender: function() {
        // TODO could be a select2 widget because of templating and more efficient selection
        $(this.ui.username).autocomplete({
            open: function () {
                $(this).autocomplete('widget').zIndex(10000);
                $(this).validateField('');
            },
            source: function(req, callback) {
                var lterms = req.term.split(' ');
                var terms = [];

                // TODO exclude results contained in ... ...group/:groupname/user/
                for (var t in lterms) {
                    if (lterms[t].length >= 3) {
                        terms.push(lterms[t]);
                    }
                }

                $.ajax({
                    type: "GET",
                    url: ohgr.baseUrl + 'permission/user/search/',
                    dataType: 'json',
                    data: {term: JSON.stringify(terms), type: "*", mode: "icontains", exclude: ""},
                    el: this.element,
                    async: true,
                    cache: true,
                    success: function(data) {
                        callback(data);
                    }
                });
            },
            minLength: 3,
            delay: 100,
            autoFocus: true,
            search: function(event, ui) {
                var lterms = $(this).val().split(' ');
                var terms = [];

                for (var t in lterms) {
                    if (lterms[t].length >= 3) {
                        terms.push(lterms[t]);
                    }
                }

                return terms.length > 0;
            },
            close: function (event, ui) {
                if ($(this).val() === "") {
                    $(this).validateField('');
                }
            },
            response: function (event, ui) {
                if (ui.content.length == 0) {
                    $(this).validateField('failed');
                }
            },
            change: function (event, ui) {
                if ($(this).val() === "") {
                    $(this).validateField('');
                } else if (!ui.item) {
                    $(this).validateField('failed');
                }
            },
            select: function(event, ui) {
                $(this).validateField('ok');
            }
        });
    },

    addUserToGroup: function () {
        var el = this.ui.username;

        if ($(el).isValidField()) {
            var username = el.val();
            this.collection.create({username: username}, {wait: true});
            $(el).cleanField();
        }
    }
});

module.exports = View;
