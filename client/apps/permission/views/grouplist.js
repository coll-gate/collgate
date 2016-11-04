/**
 * @file grouplist.js
 * @brief Permission group list view
 * @author Frederic SCHERMA
 * @date 2016-06-02
 * @copyright Copyright (c) 2016 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var Marionette = require('backbone.marionette');
var PermissionGroupModel = require('../models/group');
var PermissionGroupView = require('../views/group');
var ScrollView = require('../../main/views/scroll');

var View = ScrollView.extend({
    template: require("../templates/grouplist.html"),
    childView: PermissionGroupView,
    childViewContainer: 'tbody.permission-group-list',

    initialize: function() {
        this.listenTo(this.collection, 'reset', this.render, this);
        this.listenTo(this.collection, 'change', this.render, this);

        View.__super__.initialize.apply(this);
    },
});

module.exports = View;
