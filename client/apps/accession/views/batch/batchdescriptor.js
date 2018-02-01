/**
 * @file batchdescriptor.js
 * @brief Batch descriptor item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-02-15
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let DescribableDetails = require('../../../descriptor/views/describabledetails');
let BatchDescriptorEditView = require('./batchdescriptoredit');

let View = DescribableDetails.extend({
    onShowTab: function() {
        let view = this;

        let contextLayout = application.getView().getChildView('right');
        if (!contextLayout) {
            let DefaultLayout = require('../../../main/views/defaultlayout');
            contextLayout = new DefaultLayout();
            application.getView().showChildView('right', contextLayout);
        }

        let TitleView = require('../../../main/views/titleview');
        contextLayout.showChildView('title', new TitleView({title: _t("Descriptors"), glyphicon: 'fa-wrench'}));

        let actions = ['modify'];

        let BatchDescriptorContextView = require('./batchdescriptorcontext');
        let contextView = new BatchDescriptorContextView({actions: actions});
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
        let name = this.model.get('name');

        // update the layout content
        let batchLayout = application.main.viewContent().getChildView('content');

        let view = new BatchDescriptorEditView({model: this.model, descriptorMetaModelLayout: this.descriptorMetaModelLayout,
            descriptorCollection: this.descriptorCollection
        });
        batchLayout.showChildView('descriptors', view);
    }
});

module.exports = View;

