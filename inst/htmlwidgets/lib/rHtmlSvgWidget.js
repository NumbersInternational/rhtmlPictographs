// Generated by CoffeeScript 1.8.0
var RhtmlSvgWidget,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

RhtmlSvgWidget = (function(_super) {
  __extends(RhtmlSvgWidget, _super);

  RhtmlSvgWidget.widgetIndex = -1;

  function RhtmlSvgWidget(el, width, height) {
    RhtmlSvgWidget.__super__.constructor.call(this, el, width, height);
    this.rootElement = _.has(el, 'length') ? el[0] : el;
    this.initialWidth = width;
    this.initialHeight = height;
    RhtmlSvgWidget.widgetIndex++;
  }

  RhtmlSvgWidget.prototype.setConfig = function(config) {
    this.config = config;
    if (!this.config['table-id']) {
      this.config['table-id'] = "rhtmlwidget-" + RhtmlSvgWidget.widgetIndex;
    }
    return this._processConfig();
  };

  RhtmlSvgWidget.prototype.draw = function() {
    this._manipulateRootElementSize();
    this._addRootSvgToRootElement();
    return this._redraw();
  };

  RhtmlSvgWidget.prototype.resize = function(width, height) {};

  RhtmlSvgWidget.prototype._processConfig = function() {
    throw new Error('Must override _processConfig in child class of RhtmlSvgWidget');
  };

  RhtmlSvgWidget.prototype._redraw = function() {
    throw new Error('Must override _redraw in child class of RhtmlSvgWidget');
  };

  RhtmlSvgWidget.prototype._manipulateRootElementSize = function() {
    $(this.rootElement).attr('style', '');
    if (this.config['resizable']) {
      return $(this.rootElement).width('100%').height('100%');
    } else {
      return $(this.rootElement).width(this.initialWidth).height(this.initialHeight);
    }
  };

  RhtmlSvgWidget.prototype._addRootSvgToRootElement = function() {
    var anonSvg;
    anonSvg = $('<svg class="rhtmlwidget-outer-svg">').addClass(this.config['table-id']).attr('id', this.config['table-id']).attr('width', '100%').attr('height', '100%');
    $(this.rootElement).append(anonSvg);
    this.outerSvg = d3.select(anonSvg[0]);
    document.getElementsByClassName("" + this.config['table-id'] + " rhtmlwidget-outer-svg")[0].setAttribute('viewBox', "0 0 " + this.initialWidth + " " + this.initialHeight);
    if (this.config['preserveAspectRatio'] != null) {
      document.getElementsByClassName("" + this.config['table-id'] + " rhtmlwidget-outer-svg")[0].setAttribute('preserveAspectRatio', this.config['preserveAspectRatio']);
    }
    return null;
  };

  return RhtmlSvgWidget;

})(RhtmlStatefulWidget);

if (typeof module !== 'undefined') {
  module.exports = RhtmlSvgWidget;
}
