/**
 * @file batchdescriptor.js
 * @brief Batch descriptor item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-15
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var DescribableDetails = require('../../descriptor/views/describabledetails');
var BatchDescriptorEditView = require('../views/batchdescriptoredit');

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
        contextLayout.showChildView('title', new TitleView({title: _t("Descriptors"), glyphicon: 'fa-wrench'}));

        var actions = ['modify'];

        var BatchDescriptorContextView = require('./batchdescriptorcontext');
        var contextView = new BatchDescriptorContextView({actions: actions});
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
        var batchLayout = application.main.viewContent().getChildView('content');

        var view = new BatchDescriptorEditView({model: this.model, descriptorMetaModelLayout: this.descriptorMetaModelLayout});
        batchLayout.showChildView('descriptors', view);
    }
});

module.exports = View;

