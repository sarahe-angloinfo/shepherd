/*! tether-shepherd 1.0.0 */

(function(root, factory) {
  if (typeof define === 'function' && define.amd) {
    define(["tether"], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('tether'));
  } else {
    root.Shepher = factory(root.Tether);
  }
}(this, function(Tether) {

/* global Tether */

'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x4, _x5, _x6) { var _again = true; _function: while (_again) { var object = _x4, property = _x5, receiver = _x6; desc = parent = getter = undefined; _again = false; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x4 = parent; _x5 = property; _x6 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) subClass.__proto__ = superClass; }

var _Tether$Utils = Tether.Utils;
var Evented = _Tether$Utils.Evented;
var addClass = _Tether$Utils.addClass;
var extend = _Tether$Utils.extend;
var getBounds = _Tether$Utils.getBounds;
var hasClass = _Tether$Utils.hasClass;
var removeClass = _Tether$Utils.removeClass;
var uniqueId = _Tether$Utils.uniqueId;

var Shepherd = new Evented();

var ATTACHMENT = {
  'top': 'bottom center',
  'left': 'middle right',
  'right': 'middle left',
  'bottom': 'top center',
  'center': 'middle center' };

function createFromHTML(html) {
  var el = document.createElement('div');
  el.innerHTML = html;
  return el.children[0];
}

function matchesSelector(el, sel) {
  var matches = undefined;
  if (typeof el.matches !== 'undefined') {
    matches = el.matches;
  } else if (typeof el.matchesSelector !== 'undefined') {
    matches = el.matchesSelector;
  } else if (typeof el.msMatchesSelector !== 'undefined') {
    matches = el.msMatchesSelector;
  } else if (typeof el.webkitMatchesSelector !== 'undefined') {
    matches = el.webkitMatchesSelector;
  } else if (typeof el.mozMatchesSelector !== 'undefined') {
    matches = el.mozMatchesSelector;
  } else if (typeof el.oMatchesSelector !== 'undefined') {
    matches = el.oMatchesSelector;
  }
  return matches.call(el, sel);
}

function parseShorthand(obj, props) {
  if (obj === null || typeof obj === 'undefined') {
    return obj;
  } else if (typeof obj === 'object') {
    return obj;
  }

  var vals = obj.split(' ');
  var valsLen = vals.length;
  var propsLen = props.length;
  if (valsLen > propsLen) {
    vals[0] = vals.slice(0, valsLen - propsLen + 1).join(' ');
    vals.splice(1, (valsLen, propsLen));
  }

  var out = {};
  for (var i = 0; i < propsLen; ++i) {
    var prop = props[i];
    out[prop] = vals[i];
  }

  return out;
}

var Step = (function (_Evented) {
  function Step(tour, options) {
    _classCallCheck(this, Step);

    _get(Object.getPrototypeOf(Step.prototype), 'constructor', this).call(this, tour, options);
    this.tour = tour;
    this.setOptions(options);
    return this;
  }

  _inherits(Step, _Evented);

  _createClass(Step, [{
    key: 'setOptions',
    value: function setOptions() {
      var options = arguments[0] === undefined ? {} : arguments[0];

      this.options = options;
      this.destroy();

      this.id = this.options.id || this.id || 'step-' + uniqueId();

      var when = this.options.when;
      if (when) {
        for (var _event in when) {
          if (({}).hasOwnProperty.call(when, _event)) {
            var handler = when[_event];
            this.on(_event, handler, this);
          }
        }
      }

      if (!this.options.buttons) {
        this.options.buttons = [{
          text: 'Next',
          action: this.tour.next
        }];
      }
    }
  }, {
    key: 'getTour',
    value: function getTour() {
      return this.tour;
    }
  }, {
    key: 'bindAdvance',
    value: function bindAdvance() {
      var _this = this;

      // An empty selector matches the step element

      var _parseShorthand = parseShorthand(this.options.advanceOn, ['selector', 'event']);

      var event = _parseShorthand.event;
      var selector = _parseShorthand.selector;

      var handler = function handler(e) {
        if (!_this.isOpen()) {
          return;
        }

        if (typeof selector !== 'undefined') {
          if (matchesSelector(e.target, selector)) {
            _this.tour.next();
          }
        } else {
          if (_this.el && e.target === _this.el) {
            _this.tour.next();
          }
        }
      };

      // TODO: this should also bind/unbind on show/hide
      document.body.addEventListener(event, handler);
      this.on('destroy', function () {
        return document.body.removeEventListener(event, handler);
      });
    }
  }, {
    key: 'getAttachTo',
    value: function getAttachTo() {
      var opts = parseShorthand(this.options.attachTo, ['element', 'on']) || {};
      var selector = opts.element;

      if (typeof selector === 'string') {
        opts.element = document.querySelector(selector);

        if (!opts.element) {
          throw new Error('The element for this Shepherd step was not found ' + selector);
        }
      }

      return opts;
    }
  }, {
    key: 'setupTether',
    value: function setupTether() {
      if (typeof Tether === 'undefined') {
        throw new Error('Using the attachment feature of Shepherd requires the Tether library');
      }

      var opts = this.getAttachTo();
      var attachment = ATTACHMENT[opts.on || 'right'];
      if (typeof opts.element === 'undefined') {
        opts.element = 'viewport';
        attachment = 'middle center';
      }

      var tetherOpts = {
        classPrefix: 'shepherd',
        element: this.el,
        constraints: [{
          to: 'window',
          pin: true,
          attachment: 'together'
        }],
        target: opts.element,
        offset: opts.offset || '0 0',
        attachment: attachment };

      this.tether = new Tether(extend(tetherOpts, this.options.tetherOptions));
    }
  }, {
    key: 'show',
    value: function show() {
      var _this2 = this;

      if (typeof this.options.beforeShowPromise !== 'undefined') {
        var beforeShowPromise = this.options.beforeShowPromise();
        if (typeof beforeShowPromise !== 'undefined') {
          return beforeShowPromise.then(function () {
            return _this2._show();
          });
        }
      }
      this._show();
    }
  }, {
    key: '_show',
    value: function _show() {
      var _this3 = this;

      this.trigger('before-show');

      if (!this.el) {
        this.render();
      }

      addClass(this.el, 'shepherd-open');

      document.body.setAttribute('data-shepherd-step', this.id);

      this.setupTether();

      if (this.options.scrollTo) {
        setTimeout(function () {
          _this3.scrollTo();
        });
      }

      this.trigger('show');
    }
  }, {
    key: 'hide',
    value: function hide() {
      this.trigger('before-hide');

      removeClass(this.el, 'shepherd-open');

      document.body.removeAttribute('data-shepherd-step');

      if (typeof this.tether !== 'undefined') {
        this.tether.destroy();
      }
      this.tether = null;

      this.trigger('hide');
    }
  }, {
    key: 'isOpen',
    value: function isOpen() {
      return hasClass(this.el, 'shepherd-open');
    }
  }, {
    key: 'cancel',
    value: function cancel() {
      this.tour.cancel();
      this.trigger('cancel');
    }
  }, {
    key: 'complete',
    value: function complete() {
      this.tour.complete();
      this.trigger('complete');
    }
  }, {
    key: 'scrollTo',
    value: function scrollTo() {
      var _getAttachTo = this.getAttachTo();

      var element = _getAttachTo.element;

      if (typeof this.options.scrollToHandler !== 'undefined') {
        this.options.scrollToHandler(element);
      } else if (typeof element !== 'undefined') {
        element.scrollIntoView();
      }
    }
  }, {
    key: 'destroy',
    value: function destroy() {
      if (typeof this.el !== 'undefined') {
        document.body.removeChild(this.el);
        delete this.el;
      }

      if (typeof this.tether !== 'undefined') {
        this.tether.destroy();
      }
      this.tether = null;

      this.trigger('destroy');
    }
  }, {
    key: 'render',
    value: function render() {
      if (typeof this.el !== 'undefined') {
        this.destroy();
      }

      this.el = createFromHTML('<div class=\'shepherd-step ' + (this.options.classes || '') + '\' data-id=\'' + this.id + '\'></div>');

      var content = document.createElement('div');
      content.className = 'shepherd-content';
      this.el.appendChild(content);

      var header = document.createElement('header');
      content.appendChild(header);

      if (typeof this.options.title !== 'undefined') {
        header.innerHTML += '<h3 class=\'shepherd-title\'>' + this.options.title + '</h3>';
        this.el.className += ' shepherd-has-title';
      }

      if (this.options.showCancelLink) {
        var link = createFromHTML('<a href class=\'shepherd-cancel-link\'>✕</a>');
        header.appendChild(link);

        this.el.className += ' shepherd-has-cancel-link';

        this.bindCancelLink(link);
      }

      if (typeof this.options.text !== 'undefined') {
        var text = createFromHTML('<div class=\'shepherd-text\'></div>');
        var paragraphs = this.options.text;

        if (typeof paragraphs === 'function') {
          paragraphs = paragraphs.call(this, text);
        }

        if (paragraphs instanceof HTMLElement) {
          text.appendChild(paragraphs);
        } else {
          if (typeof paragraphs === 'string') {
            paragraphs = [paragraphs];
          }

          for (var i = 0; i < paragraphs.length; ++i) {
            var paragraph = paragraphs[i];
            text.innerHTML += '<p>' + paragraph + '</p>';
          }
        }

        content.appendChild(text);
      }

      var footer = document.createElement('footer');

      if (this.options.buttons) {
        var buttons = createFromHTML('<ul class=\'shepherd-buttons\'></ul>');

        for (var i = 0; i < this.options.buttons.length; ++i) {
          var cfg = this.options.buttons[i];
          var button = createFromHTML('<li><a class=\'shepherd-button ' + (cfg.classes || '') + '\'>' + cfg.text + '</a>');
          buttons.appendChild(button);
          this.bindButtonEvents(cfg, button.querySelector('a'));
        }

        footer.appendChild(buttons);
      }

      content.appendChild(footer);

      document.body.appendChild(this.el);

      this.setupTether();

      if (this.options.advanceOn) {
        this.bindAdvance();
      }
    }
  }, {
    key: 'bindCancelLink',
    value: function bindCancelLink(link) {
      var _this4 = this;

      link.addEventListener('click', function (e) {
        e.preventDefault();
        _this4.cancel();
      });
    }
  }, {
    key: 'bindButtonEvents',
    value: function bindButtonEvents(cfg, el) {
      var _this5 = this;

      cfg.events = cfg.events || {};
      if (typeof cfg.action !== 'undefined') {
        // Including both a click event and an action is not supported
        cfg.events.click = cfg.action;
      }

      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = cfg.events[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var _event2 = _step.value;

          if (({}).hasOwnProperty.call(cfg.events, _event2)) {
            var handler = cgf.events[_event2];
            if (typeof handler === 'string') {
              (function () {
                var page = handler;
                handler = function () {
                  return _this5.tour.show(page);
                };
              })();
            }
            el.addEventListener(_event2, handler);
          }
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator['return']) {
            _iterator['return']();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }

      this.on('destroy', function () {
        var _iteratorNormalCompletion2 = true;
        var _didIteratorError2 = false;
        var _iteratorError2 = undefined;

        try {
          for (var _iterator2 = cfg.events[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
            var _event3 = _step2.value;

            if (({}).hasOwnProperty.call(cfg.events, _event3)) {
              var handler = cgf.events[_event3];
              el.removeEventListener(_event3, handler);
            }
          }
        } catch (err) {
          _didIteratorError2 = true;
          _iteratorError2 = err;
        } finally {
          try {
            if (!_iteratorNormalCompletion2 && _iterator2['return']) {
              _iterator2['return']();
            }
          } finally {
            if (_didIteratorError2) {
              throw _iteratorError2;
            }
          }
        }
      });
    }
  }]);

  return Step;
})(Evented);

var Tour = (function (_Evented2) {
  function Tour() {
    var _this6 = this;

    var options = arguments[0] === undefined ? {} : arguments[0];

    _classCallCheck(this, Tour);

    _get(Object.getPrototypeOf(Tour.prototype), 'constructor', this).call(this, options);
    this.options = options;
    this.steps = this.options.steps || [];

    // Pass these events onto the global Shepherd object
    var events = ['complete', 'cancel', 'hide', 'start', 'show', 'active', 'inactive'];
    for (var i = 0; i < events.length; ++i) {
      var _event4 = events[i];
      (function (e) {
        _this6.on(e, function (opts) {
          opts = opts || {};
          opts.tour = _this6;
          Shepherd.trigger(e, opts);
        });
      })(_event4);
    }

    return this;
  }

  _inherits(Tour, _Evented2);

  _createClass(Tour, [{
    key: 'addStep',
    value: function addStep(name, step) {
      if (typeof step === 'undefined') {
        step = name;
      }

      if (!step instanceof Step) {
        if (typeof name === 'string' || typeof name === 'number') {
          step.id = name.toString();
        }
        step = extend({}, this.options.defaults, step);
        step = new Step(this, step);
      } else {
        step.tour = this;
      }

      this.steps.push(step);
      return this;
    }
  }, {
    key: 'getById',
    value: function getById(id) {
      for (var i = 0; i < this.steps.length; ++i) {
        var step = this.steps[i];
        if (step.id === id) {
          return step;
        }
      }
    }
  }, {
    key: 'getCurrentStep',
    value: function getCurrentStep() {
      return this.currentStep;
    }
  }, {
    key: 'next',
    value: function next() {
      var index = this.steps.indexOf(this.currentStep);

      if (index === this.steps.length - 1) {
        this.hide(index);
        this.trigger('complete');
        this.done();
      } else {
        this.show(index + 1);
      }
    }
  }, {
    key: 'back',
    value: function back() {
      var index = this.steps.indexOf(this.currentStep);
      this.show(index - 1);
    }
  }, {
    key: 'cancel',
    value: function cancel() {
      if (typeof this.currentStep !== 'undefined') {
        this.currentStep.hide();
      }
      this.trigger('cancel');
      this.done();
    }
  }, {
    key: 'complete',
    value: function complete() {
      if (typeof this.currentStep !== 'undefined') {
        this.currentStep.hide();
      }
      this.trigger('complete');
      this.done();
    }
  }, {
    key: 'hide',
    value: function hide() {
      if (typeof this.currentStep !== 'undefined') {
        this.currentStep.hide();
      }
      this.trigger('hide');
      this.done();
    }
  }, {
    key: 'done',
    value: function done() {
      Shepherd.activeTour = null;
      removeClass(document.body, 'shepherd-active');
      this.trigger('inactive', { tour: this });
    }
  }, {
    key: 'show',
    value: function show() {
      var key = arguments[0] === undefined ? 0 : arguments[0];

      if (this.currentStep) {
        this.currentStep.hide();
      } else {
        addClass(document.body, 'shepherd-active');
        this.trigger('active', { tour: this });
      }

      Shepherd.activeTour = this;

      if (typeof key === 'string') {
        next = this.getById(key);
      } else {
        next = this.steps[key];
      }

      if (next) {
        this.trigger('show', {
          step: next,
          previous: this.currentStep
        });

        this.currentStep = next;
        next.show();
      }
    }
  }, {
    key: 'start',
    value: function start() {
      this.trigger('start');

      this.currentStep = null;
      this.next();
    }
  }]);

  return Tour;
})(Evented);

extend(Shepherd, { Tour: Tour, Step: Step, Evented: Evented });
return Shepher;

}));
