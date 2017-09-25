/**
 * @file classificationentrydescriptor.js
 * @brief Classification entry descriptors view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-12-29
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

var DescribableDetails = require('../../descriptor/views/describabledetails');
var ClassificationEntryDescriptorEditView = require('./classificationentrydescriptoredit');

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
        contextLayout.showChildView('title', new TitleView({title: _t("Descriptors"), glyphicon: 'glyphicon-wrench'}));

        var actions = [];

        if (!this.model.get('descriptor_meta_model')) {
            actions.push('add');
        } else {
            actions.push('modify');
            // actions.push('replace');
            // actions.push('delete');
        }

        var ClassificationEntryDescriptorContextView = require('./classificationentrydescriptorcontext');
        var contextView = new ClassificationEntryDescriptorContextView({actions: actions});
        contextLayout.showChildView('content', contextView);

        contextView.on("describable:modify", function () {
            view.onModify();
        });

        // contextView.on("descriptormetamodel:replace", function () {
        //     // this will update the model and so on the view
        //     var ClassificationEntryDescriptorCreateView = require('./classificationentrydescriptorcreate');
        //     var classificationEntryDescriptorCreateView = new ClassificationEntryDescriptorCreateView({model: view.model});
        //
        //     classificationEntryDescriptorCreateView.onDefine();
        // });
        //
        // contextView.on("descriptormetamodel:delete", function () {
        //     var ConfirmDialog = require('../../main/views/confirmdialog');
        //     var confirmDialog = new ConfirmDialog({
        //         title: _t('Delete descriptors'),
        //         label: _t('Are you sure you want to delete any descriptors for this classification entry ?')
        //     });
        //     confirmDialog.render();
        //
        //     confirmDialog.on('dialog:confirm', function() {
        //         // this will update the model and so on the view
        //         view.model.save({descriptor_meta_model: null}, {patch: true, trigger: true});
        //     });
        // });
    },

    onHideTab: function() {
        application.main.defaultRightView();
    },

    onModify: function() {
        // does not reload models, just redo the views

        // update the descriptor part of the classificationEntry layout
        var classificationEntryLayout = application.main.viewContent().getChildView('content');

        var view = new ClassificationEntryDescriptorEditView({
            model: this.model, descriptorMetaModelLayout: this.descriptorMetaModelLayout});
        classificationEntryLayout.showChildView('descriptors', view);
    }
});

module.exports = View;
