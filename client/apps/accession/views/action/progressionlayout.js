/**
 * @file progressionlayout.js
 * @brief Optimized layout for the progression tab of action details
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2018-04-13
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let LayoutView = require('../../../main/views/layout');
let ActionModel = require('../../models/action');
let ActionTypeModel = require('../../models/actiontype');
let ScrollingMoreView = require('../../../main/views/scrollingmore');
let ContentBottomLayout = require('../../../main/views/contentbottomlayout');

let Layout = LayoutView.extend({
    template: require("../../templates/action/progressionlayout.html"),

    attributes: {
        style: "height: 100%;"
    },

    ui: {
    },

    regions: {
    },

    events: {
    },

    initialize: function (model, options) {
        Layout.__super__.initialize.apply(this, arguments);

        if (this.model.isNew()) {
            this.listenTo(this.model, 'change:id', this.onActionCreate, this);
        } else {
            this.listenTo(this.model, 'change:data', this.onActionUpdate, this);
        }
    },

    onRender: function () {
    },

    onBeforeDetach: function () {
    }
});

module.exports = Layout;
