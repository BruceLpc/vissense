/*! { "name": "vissense", "version": "0.2.2", "homepage": "https://vissense.github.io/vissense","copyright": "(c) 2015 tbk" } */
!function(root, factory) {
    "use strict";
    root.VisSense = factory(root, root.document);
}(this, function(window, document, undefined) {
    "use strict";
    function debounce(callback, delay) {
        var timer = null;
        return function() {
            var self = this, args = arguments;
            clearTimeout(timer), timer = setTimeout(function() {
                callback.apply(self, args);
            }, delay);
        };
    }
    function defaults(dest, source) {
        if (!isObject(dest)) return source;
        for (var keys = Object.keys(source), i = 0, n = keys.length; n > i; i++) {
            var prop = keys[i];
            void 0 === dest[prop] && (dest[prop] = source[prop]);
        }
        return dest;
    }
    function defer(callback) {
        return window.setTimeout(function() {
            callback();
        }, 0);
    }
    function fireIf(when, callback) {
        return function() {
            return (isFunction(when) ? when() : when) ? callback() : undefined;
        };
    }
    function extend(dest, source, callback) {
        for (var index = -1, props = Object.keys(source), length = props.length, ask = isFunction(callback); ++index < length; ) {
            var key = props[index];
            dest[key] = ask ? callback(dest[key], source[key], key, dest, source) : source[key];
        }
        return dest;
    }
    function identity(value) {
        return value;
    }
    function isDefined(value) {
        return value !== undefined;
    }
    function isArray(value) {
        return value && "object" == typeof value && "number" == typeof value.length && "[object Array]" === Object.prototype.toString.call(value) || !1;
    }
    function isElement(value) {
        return value && 1 === value.nodeType || !1;
    }
    function isFunction(value) {
        return "function" == typeof value || !1;
    }
    function isObject(value) {
        var type = typeof value;
        return "function" === type || value && "object" === type || !1;
    }
    function noop() {}
    function now() {
        return new Date().getTime();
    }
    function viewport() {
        return {
            height: window.innerHeight,
            width: window.innerWidth
        };
    }
    function computedStyle(element) {
        return window.getComputedStyle(element, null);
    }
    function styleProperty(style, property) {
        return style.getPropertyValue(property);
    }
    function isDisplayed(element, style) {
        style || (style = computedStyle(element));
        var display = styleProperty(style, "display");
        if ("none" === display) return !1;
        var visibility = styleProperty(style, "visibility");
        return "hidden" === visibility || "collapse" === visibility ? !1 : element.parentNode && element.parentNode.style ? isDisplayed(element.parentNode, computedStyle(element)) : !0;
    }
    function isVisibleByStyling(element) {
        if (element === document) return !0;
        if (!element || !element.parentNode) return !1;
        var style = computedStyle(element), displayed = isDisplayed(element, style);
        return displayed !== !0 ? !1 : !0;
    }
    function isInViewport(rect, viewport) {
        return !rect || rect.width <= 0 || rect.height <= 0 ? !1 : rect.bottom > 0 && rect.right > 0 && rect.top < viewport.height && rect.left < viewport.width;
    }
    function percentage(element) {
        if (!isPageVisible()) return 0;
        var rect = element.getBoundingClientRect(), view = viewport();
        if (!isInViewport(rect, view) || !isVisibleByStyling(element)) return 0;
        var vh = 0, vw = 0;
        return rect.top >= 0 ? vh = Math.min(rect.height, view.height - rect.top) : rect.bottom > 0 && (vh = Math.min(view.height, rect.bottom)), 
        rect.left >= 0 ? vw = Math.min(rect.width, view.width - rect.left) : rect.right > 0 && (vw = Math.min(view.width, rect.right)), 
        Math.round(vh * vw / (rect.height * rect.width) * 1e3) / 1e3;
    }
    function isPageVisible() {
        return VisibilityApi ? !document[VisibilityApi[0]] : !0;
    }
    function VisSense(element, config) {
        if (!(this instanceof VisSense)) return new VisSense(element, config);
        if (!isElement(element)) throw new Error("not an element node");
        this._element = element, this._config = defaults(config, {
            fullyvisible: 1,
            hidden: 0,
            getVisiblePercentage: percentage
        });
    }
    function nextState(visobj, currentState) {
        var newState = visobj.state(), percentage = newState.percentage;
        return currentState && percentage === currentState.percentage && currentState.percentage === currentState.previous.percentage ? currentState : newState.hidden ? VisSense.VisState.hidden(percentage, currentState) : newState.fullyvisible ? VisSense.VisState.fullyvisible(percentage, currentState) : VisSense.VisState.visible(percentage, currentState);
    }
    function VisMon(visobj, config) {
        var me = this, _config = defaults(config, {
            strategy: [ new VisMon.Strategy.PollingStrategy(), new VisMon.Strategy.EventStrategy() ]
        }), strategies = isArray(_config.strategy) ? _config.strategy : [ _config.strategy ];
        me._strategy = new VisMon.Strategy.CompositeStrategy(strategies), me._visobj = visobj, 
        me._state = {}, me._pubsub = new PubSub(), me._events = [ "update", "hidden", "visible", "fullyvisible", "percentagechange", "visibilitychange" ], 
        this._pubsub.on("update", function() {
            me._state.code !== me._state.previous.code && me._pubsub.publish("visibilitychange", [ me ]);
        }), this._pubsub.on("update", function() {
            var newValue = me._state.percentage, oldValue = me._state.previous.percentage;
            newValue !== oldValue && me._pubsub.publish("percentagechange", [ newValue, oldValue, me ]);
        }), this._pubsub.on("visibilitychange", function() {
            me._state.fullyvisible && me._pubsub.publish("fullyvisible", [ me ]);
        }), this._pubsub.on("visibilitychange", function() {
            me._state.visible && !me._state.previous.visible && me._pubsub.publish("visible", [ me ]);
        }), this._pubsub.on("visibilitychange", function() {
            me._state.hidden && me._pubsub.publish("hidden", [ me ]);
        });
        for (var i = 0, n = me._events.length; n > i; i++) _config[me._events[i]] && me.on(me._events[i], _config[me._events[i]]);
    }
    var VisibilityApi = function(undefined) {
        for (var event = "visibilitychange", dict = [ [ "hidden", event ], [ "mozHidden", "moz" + event ], [ "webkitHidden", "webkit" + event ], [ "msHidden", "ms" + event ] ], i = 0, n = dict.length; n > i; i++) if (document[dict[i][0]] !== undefined) return dict[i];
    }(), PubSub = function(undefined) {
        function PubSub() {
            this._cache = {};
        }
        return PubSub.prototype.on = function(topic, callback) {
            if (!isFunction(callback)) return noop;
            this._cache[topic] || (this._cache[topic] = []);
            var listener = function(args) {
                return callback.apply(undefined, args || []);
            };
            this._cache[topic].push(listener);
            var me = this;
            return function() {
                var index = me._cache[topic].indexOf(listener);
                return index > -1 ? (me._cache[topic].splice(index, 1), !0) : !1;
            };
        }, PubSub.prototype.publish = function(topic, args) {
            for (var listeners = this._cache[topic], listenersCount = listeners ? listeners.length : 0, i = 0; listenersCount > i; i++) listeners[i](args || []);
        }, PubSub;
    }();
    VisSense.prototype.state = function() {
        var perc = this._config.getVisiblePercentage(this._element);
        return perc <= this._config.hidden ? VisSense.VisState.hidden(perc) : perc >= this._config.fullyvisible ? VisSense.VisState.fullyvisible(perc) : VisSense.VisState.visible(perc);
    }, VisSense.prototype.percentage = function() {
        return this.state().percentage;
    }, VisSense.prototype.isFullyVisible = function() {
        return this.state().fullyvisible;
    }, VisSense.prototype.isVisible = function() {
        return this.state().visible;
    }, VisSense.prototype.isHidden = function() {
        return this.state().hidden;
    }, VisSense.fn = VisSense.prototype, VisSense.of = function(element, config) {
        return new VisSense(element, config);
    };
    var STATES = {
        HIDDEN: [ 0, "hidden" ],
        VISIBLE: [ 1, "visible" ],
        FULLY_VISIBLE: [ 2, "fullyvisible" ]
    };
    return VisSense.VisState = function() {
        function newVisState(state, percentage, previous) {
            return previous && delete previous.previous, {
                code: state[0],
                state: state[1],
                percentage: percentage,
                previous: previous || {},
                fullyvisible: state[0] === STATES.FULLY_VISIBLE[0],
                visible: state[0] === STATES.VISIBLE[0] || state[0] === STATES.FULLY_VISIBLE[0],
                hidden: state[0] === STATES.HIDDEN[0]
            };
        }
        return {
            hidden: function(percentage, previous) {
                return newVisState(STATES.HIDDEN, percentage, previous);
            },
            visible: function(percentage, previous) {
                return newVisState(STATES.VISIBLE, percentage, previous);
            },
            fullyvisible: function(percentage, previous) {
                return newVisState(STATES.FULLY_VISIBLE, percentage, previous);
            }
        };
    }(), VisMon.prototype.visobj = function() {
        return this._visobj;
    }, VisMon.prototype.state = function() {
        return this._state;
    }, VisMon.prototype.start = function() {
        return this._strategy.start(this), this;
    }, VisMon.prototype.stop = function() {
        return this._strategy.stop(this);
    }, VisMon.prototype.use = function(strategy) {
        return this.stop(), this._strategy = strategy, this.start();
    }, VisMon.prototype.update = function() {
        this._state = nextState(this._visobj, this._state), this._pubsub.publish("update", [ this ]);
    }, VisMon.prototype.onUpdate = function(callback) {
        return this._pubsub.on("update", callback);
    }, VisMon.prototype.onVisibilityChange = function(callback) {
        return this._pubsub.on("visibilitychange", callback);
    }, VisMon.prototype.onPercentageChange = function(callback) {
        return this._pubsub.on("percentagechange", callback);
    }, VisMon.prototype.onVisible = function(callback) {
        return this._pubsub.on("visible", callback);
    }, VisMon.prototype.onFullyVisible = function(callback) {
        return this._pubsub.on("fullyvisible", callback);
    }, VisMon.prototype.onHidden = function(callback) {
        return this._pubsub.on("hidden", callback);
    }, VisMon.prototype.on = function(topic, callback) {
        var me = this;
        switch (topic) {
          case "update":
            return me.onUpdate(callback);

          case "hidden":
            return me.onHidden(callback);

          case "visible":
            return me.onVisible(callback);

          case "fullyvisible":
            return me.onFullyVisible(callback);

          case "percentagechange":
            return me.onPercentageChange(callback);

          case "visibilitychange":
            return me.onVisibilityChange(callback);
        }
        return this._pubsub.on(topic, callback);
    }, VisMon.Strategy = function() {}, VisMon.Strategy.prototype.start = function() {
        throw new Error("Strategy#start needs to be overridden.");
    }, VisMon.Strategy.prototype.stop = function() {
        throw new Error("Strategy#stop needs to be overridden.");
    }, VisMon.Strategy.NoopStrategy = function() {}, VisMon.Strategy.NoopStrategy.prototype = Object.create(VisMon.Strategy.prototype), 
    VisMon.Strategy.NoopStrategy.prototype.start = function(monitor) {
        monitor.update();
    }, VisMon.Strategy.NoopStrategy.prototype.stop = function() {}, VisMon.Strategy.CompositeStrategy = function(strategies) {
        this._strategies = isArray(strategies) ? strategies : [], this._started = !1;
    }, VisMon.Strategy.CompositeStrategy.prototype = Object.create(VisMon.Strategy.prototype), 
    VisMon.Strategy.CompositeStrategy.prototype.start = function(monitor) {
        for (var i = 0, n = this._strategies.length; n > i; i++) this._strategies[i].start(monitor);
    }, VisMon.Strategy.CompositeStrategy.prototype.stop = function(monitor) {
        for (var i = 0, n = this._strategies.length; n > i; i++) this._strategies[i].stop(monitor);
    }, VisMon.Strategy.PollingStrategy = function(config) {
        this._config = defaults(config, {
            interval: 1e3
        }), this._started = !1;
    }, VisMon.Strategy.PollingStrategy.prototype = Object.create(VisMon.Strategy.prototype), 
    VisMon.Strategy.PollingStrategy.prototype.start = function(monitor) {
        if (!this._started) {
            var me = this;
            !function update() {
                monitor.update(), me._timeoutId = setTimeout(update, me._config.interval);
            }(), this._started = !0;
        }
        return this._started;
    }, VisMon.Strategy.PollingStrategy.prototype.stop = function() {
        return this._started ? (clearTimeout(this._timeoutId), this._started = !1, !0) : !1;
    }, VisMon.Strategy.EventStrategy = function(config) {
        this._config = defaults(config, {
            debounce: 50
        }), this._started = !1;
    }, VisMon.Strategy.EventStrategy.prototype = Object.create(VisMon.Strategy.prototype), 
    VisMon.Strategy.EventStrategy.prototype.start = function(monitor) {
        var me = this;
        return me._started || (me._update = debounce(function() {
            monitor.update();
        }, me._config.debounce), VisibilityApi && addEventListener(VisibilityApi[1], me._update), 
        addEventListener("scroll", me._update), addEventListener("resize", me._update), 
        me._update(), me._started = !0), this._started;
    }, VisMon.Strategy.EventStrategy.prototype.stop = function() {
        var me = this;
        return me._started ? (removeEventListener("resize", me._update), removeEventListener("scroll", me._update), 
        VisibilityApi && removeEventListener(VisibilityApi[1], me._update), me._started = !1, 
        !0) : !1;
    }, VisSense.VisMon = VisMon, VisSense.PubSub = PubSub, VisSense.fn.monitor = function(config) {
        return new VisMon(this, config);
    }, VisSense.Utils = {
        debounce: debounce,
        defaults: defaults,
        defer: defer,
        extend: extend,
        fireIf: fireIf,
        identity: identity,
        isArray: isArray,
        isDefined: isDefined,
        isElement: isElement,
        isFunction: isFunction,
        isObject: isObject,
        isPageVisible: isPageVisible,
        isVisibleByStyling: isVisibleByStyling,
        noop: noop,
        now: now,
        percentage: percentage,
        _viewport: viewport,
        _isInViewport: isInViewport,
        _isDisplayed: isDisplayed,
        _computedStyle: computedStyle,
        _styleProperty: styleProperty
    }, VisSense;
});