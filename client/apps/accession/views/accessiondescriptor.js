/**
 * @file accessiondescriptor.js
 * @brief Accession descriptor item view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-19
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var DescribableDetails = require('../../descriptor/views/describabledetails');
var AccessionDescriptorEditView = require('../views/accessiondescriptoredit');

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
        contextLayout.showChildView('title', new TitleView({title: gt.gettext("Descriptors"), glyphicon: 'glyphicon-wrench'}));

        var actions = ['modify'];

        var AccessionDescriptorContextView = require('./accessiondescriptorcontext');
        var contextView = new AccessionDescriptorContextView({actions: actions});
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
        var accessionLayout = application.main.viewContent().getChildView('content');

        var view = new AccessionDescriptorEditView({model: this.model, descriptorMetaModelLayout: this.descriptorMetaModelLayout});
        accessionLayout.showChildView('descriptors', view);
    }
});

module.exports = View;
