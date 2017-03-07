/**
 * @file descriptor.js
 * @brief Organisation and establishment descriptor item view
 * @author Frederic SCHERMA
 * @date 2017-03-07
 * @copyright Copyright (c) 2017 INRA UMR1095 GDEC
 * @license @todo
 * @details
 */

var DescribableDetails = require('../../descriptor/views/describabledetails');
var DescriptorEditView = require('../views/descriptoredit');

var View = DescribableDetails.extend({
    onShowTab: function() {
        var view = this;

        var contextLayout = application.getView().getRegion('right').currentView;
        if (!contextLayout) {
            var DefaultLayout = require('../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            application.getView().getRegion('right').show(contextLayout);
        }

        var TitleView = require('../../main/views/titleview');
        contextLayout.getRegion('title').show(new TitleView({title: gt.gettext("Descriptors")}));

        var actions = ['modify'];

        var DescriptorContextView = require('./descriptorcontext');
        var contextView = new DescriptorContextView({actions: actions});
        contextLayout.getRegion('content').show(contextView);

        contextView.on("describable:modify", function () {
            view.onModify();
        });
    },

    onHideTab: function() {
        application.main.defaultRightView();
    },

    onModify: function () {
        // does not reload models, just redo the views
        var name = this.model.get('name');

        // update the layout content
        var layout = application.view().getRegion('content').currentView;

        var view = new DescriptorEditView({model: this.model, descriptorMetaModelLayout: this.descriptorMetaModelLayout});
        layout.getRegion('descriptors').show(view);
    }
});

module.exports = View;