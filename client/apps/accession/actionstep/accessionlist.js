/**
 * @file accessionlst.js
 * @brief Simple accession list action step
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2017-12-11
 * @copyright Copyright (c) 2017 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let ActionStepFormat = require('./actionstepformat');
let Marionette = require('backbone.marionette');

let AccessionList = function() {
    ActionStepFormat.call(this);

    this.name = "accession_list";
    this.group = "standard";
    this.description = _t("Take a list of accession in input and dispose this same list as output for the next step.");
};

_.extend(AccessionList.prototype, ActionStepFormat.prototype, {
    defaultFormat: function() {
        return {};
    }
});

AccessionList.ActionStepProcessView = Marionette.View.extend({
    className: 'action-step-process',
    template: require('../templates/actionstep/accessionlistprocess.html'),

    ui: {
        list_type: "select[name=accession-list-type]",
        panel_group: "div[name=panel]",
        upload_group: "div[name=upload]",
        manual_group: "div[name=manual]",
        panel: "select[name=accession-panel]",
        upload: "input[name=accession-upload]",
        manual: "select[name=accession-list]"
    },

    events: {
        'change @ui.list_type': 'onChangeListType'
    },

    initialize: function(options) {
        options || (options = {readonly: true});

        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        if (this.getOption('readonly')) {

        } else {
            this.ui.list_type.selectpicker({});
        }
    },

    onAttach: function () {
        if (this.getOption('readonly')) {
            // @todo can download the list of entries as CSV or XLSX
        } else {
            this.ui.panel.select2({
                dropdownParent: this.$el,
                ajax: {
                    url: window.application.url(['accession', 'accessionpanel', 'search']),
                    dataType: 'json',
                    delay: 250,
                    data: function (params) {
                        params.term || (params.term = '');

                        return {
                            filters: JSON.stringify({
                                method: 'icontains',
                                fields: ['name'],
                                name: params.term
                            }),
                            cursor: params.next
                        };
                    },
                    processResults: function (data, params) {
                        params.next = null;

                        if (data.items.length >= 30) {
                            params.next = data.next || null;
                        }

                        let results = [];

                        for (let i = 0; i < data.items.length; ++i) {
                            results.push({
                                id: data.items[i].id,
                                text: data.items[i].label
                            });
                        }

                        return {
                            results: results,
                            pagination: {
                                more: params.next != null
                            }
                        };
                    },
                    cache: true
                },
                minimumInputLength: 3,
                placeholder: _t("Select a panel")
            });

            this.ui.manual.select2({
                multiple: true,
                dropdownParent: this.$el,
                ajax: {
                    url: window.application.url(['accession', 'accession', 'search']),
                    dataType: 'json',
                    delay: 250,
                    data: function (params) {
                        params.term || (params.term = '');

                        return {
                            filters: JSON.stringify({
                                method: 'icontains',
                                fields: ['name', 'code'],
                                name: params.term
                            }),
                            cursor: params.next
                        };
                    },
                    processResults: function (data, params) {
                        params.next = null;

                        if (data.items.length >= 30) {
                            params.next = data.next || null;
                        }

                        let results = [];

                        for (let i = 0; i < data.items.length; ++i) {
                            results.push({
                                id: data.items[i].id,
                                text: data.items[i].label
                            });
                        }

                        return {
                            results: results,
                            pagination: {
                                more: params.next != null
                            }
                        };
                    },
                    cache: true
                },
                // fix when a selected element is larger... but not a perfect solution
                width: (this.$el.innerWidth() - 20 - 15) + "px",
                allowClear: true,
                minimumInputLength: 1,
                placeholder: _t("Enter a value.")
            }).fixSelect2Position();
        }
    },

    onBeforeDestroy: function() {
        this.ui.list_type.selectpicker('destroy');

        if (!this.getOption('readonly')) {
         //   this.ui.manual.select2('destroy');
//            this.ui.panel.select2('destroy');
        }
    },

    exportInput: function() {

    },

    importData: function() {

    },

    inputsType: function() {
        return this.ui.list_type.val();
    },

    inputsData: function() {
        let v = this.ui.list_type.val();

        if (v === "panel") {
            return parseInt(this.ui.panel.val());
        } else if (v === "upload") {
            return {}; // @todo
        } else if (v === "list") {
            let ids = this.ui.manual.val();

            let results = _.map(ids, function (id) {
                return parseInt(id);
            });

            return results;
        }

        return null;
    },

    onChangeListType: function() {
        let v = this.ui.list_type.val();

        if (v === "panel") {
            this.ui.panel_group.css('display', 'block');
            this.ui.upload_group.css('display', 'none');
            this.ui.manual_group.css('display', 'none');
        } else if (v === "upload") {
            this.ui.panel_group.css('display', 'none');
            this.ui.upload_group.css('display', 'block');
            this.ui.manual_group.css('display', 'none');
        } else if (v === "list") {
            this.ui.panel_group.css('display', 'none');
            this.ui.upload_group.css('display', 'none');
            this.ui.manual_group.css('display', 'block');
        }
    }
});

AccessionList.ActionStepFormatDetailsView = Marionette.View.extend({
    className: 'action-step-format-details',
    template: require('../templates/actionstep/accessionlist.html'),

    initialize: function() {
        this.listenTo(this.model, 'change', this.render, this);
    },

    onRender: function() {
        let format = this.model.get('format');
    },

    storeData: function() {
        return {
        }
    }
});

module.exports = AccessionList;
