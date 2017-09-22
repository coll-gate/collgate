/**
 * @file descriptor.js
 * @brief Organisation and establishment descriptor item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-03-07
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var DescribableDetails = require('../../descriptor/views/describabledetails');
var DescriptorEditView = require('../views/descriptoredit');

var View = DescribableDetails.extend({
    onShowTab: function() {
        var view = this;

        var contextLayout = application.getView().getChildView('right');
        if (!contextLayout) {
            var DefaultLayout = require('../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            application.getView().showChildView('right', contextLayout);
        }

        var TitleView = require('../../main/views/titleview');
        contextLayout.showChildView('title', new TitleView({title: _t("Descriptors")}));

        var actions = ['modify'];

        var DescriptorContextView = require('./descriptorcontext');
        var contextView = new DescriptorContextView({actions: actions});
        contextLayout.showChildView('content', contextView);

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
        var layout = application.main.viewContent().getChildView('content');

        var view = new DescriptorEditView({model: this.model, descriptorMetaModelLayout: this.descriptorMetaModelLayout});
        layout.showChildView('descriptors', view);
    }
});

module.exports = View;
