"use strict";

var _createClass = (function () { function defineProperties(target, props) { for (var key in props) { var prop = props[key]; prop.configurable = true; if (prop.value) prop.writable = true; } Object.defineProperties(target, props); } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

var Generator = require("./generator");
var _ = require("underscore");
var Immutable = require("immutable");

var Aggregator = (function () {
    function Aggregator(size, processor, selector, observer) {
        _classCallCheck(this, Aggregator);

        this._generator = new Generator(size);
        this._processor = processor;
        this._selector = selector;
        this._currentBucket = null;

        //Callback
        this._onEmit = observer;
    }

    _createClass(Aggregator, {
        bucket: {

            /**
             * Gets the current bucket or returns a new one.
             *
             * If a new bucket is generated the result of the old bucket is emitted
             * automatically.
             */

            value: function bucket(d) {
                var _this = this;

                var thisBucketIndex = this._generator.bucketIndex(d);
                var currentBucketIndex = this._currentBucket ? this._currentBucket.index().asString() : "";

                if (thisBucketIndex !== currentBucketIndex) {
                    if (this._currentBucket) {
                        this._currentBucket.aggregate(this._processor, function (event) {
                            _this._onEmit && _this._onEmit(_this._currentBucket.index(), event);
                        });
                    }
                    this._currentBucket = this._generator.bucket(d);
                }

                return this._currentBucket;
            }
        },
        done: {

            /**
             * Forces the current bucket to emit
             */

            value: function done() {
                var _this = this;

                if (this._currentBucket) {
                    this._currentBucket.aggregate(this._processor, function (event) {
                        _this._onEmit && _this._onEmit(_this._currentBucket.index(), event);
                        _this._currentBucket = null;
                    });
                }
            }
        },
        addEvent: {

            /**
             * Add an event, which will be assigned to a bucket
             */

            value: function addEvent(event, cb) {
                var t = event.timestamp();
                var bucket = this.bucket(t);

                //
                // Adding the value to the bucket. This could be an async operation
                // so the passed in callback to this function will be called when this
                // is done.
                //

                bucket.addEvent(event, this._aggregationFn, function (err) {
                    if (err) {
                        console.error("Could not add value to bucket:", err);
                    }
                    cb && cb(err);
                });
            }
        },
        onEmit: {
            value: function onEmit(cb) {
                this._onEmit = cb;
            }
        }
    });

    return Aggregator;
})();

module.exports = Aggregator;