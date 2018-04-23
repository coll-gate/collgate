/**
 * @file accessionconsumerbatchproducerit.js
 * @brief Accession consumer - Batch producer step iterative version
 * @author Frédéric SCHERMA (INRA UMR1095)
 * @date 2018-04-10
 * @copyright Copyright (c) 2018 INRA/CIRAD
 * @license MIT (see LICENSE file)
 * @details
 */

let ActionStepFormat = require('./actionstepformat');
let AccessionConsumerBatchProducer = require('./accessionconsumerbatchproducer');
let ProgressActionList = require('../views/action/progressaccessionlist');
let AccessionCollection = require('../collections/accession');

let Format = function() {
    ActionStepFormat.call(this);

    this.name = "accessionconsumer_batchproducer_it";
    this.group = "standard";
    this.description = _t("Take a list of accession in input and generate one or many batch in output.");

    this.type = this.ACTION_TYPE_ITERATIVE;
    this.acceptFormat = ['accession_id'];
    this.dataFormat = ['batch_id'];
};

_.extend(Format.prototype, ActionStepFormat.prototype, {
    defaultFormat: function() {
       return {
            'options': {},
            'producers': []
        };
    }
});

Format.ActionStepProcessView = AccessionConsumerBatchProducer.ActionStepProcessView.extend({
    // @todo what needed in this case
});

Format.ActionStepFormatDetailsView = AccessionConsumerBatchProducer.ActionStepFormatDetailsView.extend({
});

Format.ActionStepFormatDetailsView = AccessionConsumerBatchProducer.ActionStepFormatDetailsView.extend({
});

Format.ActionStepProgressView = ProgressActionList.extend({

    initialize: function (options) {
        this.collection = new AccessionCollection([], {
            action_id: this.model.get('id'),
            action_step_idx: options.action_step_idx
        });

        ProgressActionList.__super__.initialize.apply(this, arguments);
    }
});

module.exports = Format;
