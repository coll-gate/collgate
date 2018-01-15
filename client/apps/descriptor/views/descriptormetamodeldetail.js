/**
 * @file descriptormetamodeldetail.js
 * @brief Detail for a meta-model of descriptor view
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2016-10-27
 * @copyright Copyright (c) 2016 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details 
 */

let Marionette = require('backbone.marionette');

let View = Marionette.View.extend({
    className: 'object descriptor-meta-model-detail',
    template: require('../templates/descriptormetamodeldetail.html'),

    regions: {
        'content': "div.contextual-region"
    },

    ui: {
        name: '#descriptor_meta_model_name',
        description: '#descriptor_meta_model_description',
        save: '#save'
    },

    events: {
        'click @ui.save': 'saveDescriptorMetaModel',
        'input @ui.name': 'inputName',
    },

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        let target = this.model.get('target');

        // update the contextual region according to the format
        let Element = window.application.descriptor.descriptorMetaModelTypes.getElement(target);
        if (Element) {
            this.showChildView('content', new Element({model: this.model}));
        } else {
            this.getRegion('content').empty();
        }
    },

    inputName: function () {
        let v = this.ui.name.val();
        let re = /^[a-zA-Z0-9_-]+$/i;

        if (v.length > 0 && !re.test(v)) {
            $(this.ui.name).validateField('failed', _t("Invalid characters (alphanumeric, _ and - only)"));
        } else if (v.length < 3) {
            $(this.ui.name).validateField('failed', _t('characters_min', {count: 3}));
        } else {
            $(this.ui.name).validateField('ok');
        }
    },

    saveDescriptorMetaModel: function () {
        if (!$(this.ui.name.isValidField()))
            return;

        let target = this.model.get('target');
        let name = this.ui.name.val();
        let description = this.ui.description.val();

        let parameters = {
            'type': target,
            'data': this.getChildView('content') ? this.getChildView('content').getData() : {}
        };

        this.model.save({
            name: name,
            description: description,
            parameters: parameters
        }, {wait: true}).done(function() { $.alert.success(_t("Done")); });
    }
});

module.exports = View;
