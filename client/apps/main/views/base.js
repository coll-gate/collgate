/**
 * @file base.js
 * @brief About view
 * @author Frederic SCHERMA
 * @date 2016-06-14
 * @copyright
 * @license
 * @details http://smnh.me/extending-events-and-attributes-of-the-inherited-backbone-views/
 */

var Marionette = require('backbone.marionette');

var BaseView = Backbone.View.extend({

    extendableProperties: {
        "events": "defaults",
        "className": function(propertyName, prototypeValue) {
            this[propertyName] += " " + prototypeValue;
        }
    },

    extendProperties: function(properties) {
        var propertyName, prototypeValue, extendMethod,
            prototype = this.constructor.prototype;

        while (prototype) {
            for (propertyName in properties) {
                if (properties.hasOwnProperty(propertyName) && prototype.hasOwnProperty(propertyName)) {
                    prototypeValue = _.result(prototype, propertyName);
                    extendMethod = properties[propertyName];
                    if (!this.hasOwnProperty(propertyName)) {
                        this[propertyName] = prototypeValue;
                    } else if (_.isFunction(extendMethod)) {
                        extendMethod.call(this, propertyName, prototypeValue);
                    } else if (extendMethod === "defaults") {
                        _.defaults(this[propertyName], prototypeValue);
                    }
                }
            }
            prototype = prototype.constructor.__super__;
        }
    },

    constructor: function() {
        if (this.extendableProperties) {
            // First, extend the extendableProperties by collecting all the extendable properties
            // defined by classes in the prototype chain.
            this.extendProperties({"extendableProperties": "defaults"});

            // Now, extend all the properties defined in the final extendableProperties object
            this.extendProperties(this.extendableProperties);
        }

        Backbone.View.apply(this, arguments);
    }
});

module.exports = BaseView;
