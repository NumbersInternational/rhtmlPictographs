var GraphicCell,
  __hasProp = {}.hasOwnProperty,
  __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

GraphicCell = (function(_super) {
  __extends(GraphicCell, _super);

  function GraphicCell() {
    return GraphicCell.__super__.constructor.apply(this, arguments);
  }

  GraphicCell.prototype.setConfig = function(config) {
    var _ref;
    this.config = config;
    if (this.config.variableImageUrl == null) {
      throw new Error("Must specify 'variableImageUrl'");
    }
    this._verifyKeyIsFloat(this.config, 'percentage', 1, 'Must be number between 0 and 1');
    this._verifyKeyIsRatio(this.config, 'percentage');
    this._verifyKeyIsInt(this.config, 'numImages', 1);
    if (this.config['numRows'] != null) {
      this._verifyKeyIsInt(this.config, 'numRows', 1);
    }
    if (this.config['numCols'] != null) {
      this._verifyKeyIsInt(this.config, 'numCols', 1);
    }
    if ((this.config['numRows'] != null) && (this.config['numCols'] != null)) {
      throw new Error("Cannot specify both numRows and numCols. Choose one, and use numImages to control exact dimensions.");
    }
    if (this.config['direction'] == null) {
      this.config['direction'] = 'horizontal';
    }
    if ((_ref = this.config['direction']) !== 'horizontal' && _ref !== 'vertical') {
      throw new Error("direction must be either (horizontal|vertical)");
    }
    this._verifyKeyIsFloat(this.config, 'interColumnPadding', 0.05, 'Must be number between 0 and 1');
    this._verifyKeyIsRatio(this.config, 'interColumnPadding');
    this._verifyKeyIsFloat(this.config, 'interRowPadding', 0.05, 'Must be number between 0 and 1');
    this._verifyKeyIsRatio(this.config, 'interRowPadding');
    this._processTextConfig('text-header');
    this._processTextConfig('text-overlay');
    this._processTextConfig('text-footer');
    if ((this.config['text-overlay'] != null) && this.config['text-overlay']['text'].match(/^percentage$/)) {
      return this.config['text-overlay']['text'] = "" + ((100 * this.config.percentage).toFixed(0)) + "%";
    }
  };

  GraphicCell.prototype._processTextConfig = function(key) {
    var cssAttribute, textConfig, _i, _len, _ref;
    if (this.config[key] != null) {
      textConfig = _.isString(this.config[key]) ? {
        text: this.config[key]
      } : this.config[key];
      if (textConfig['font-size'] == null) {
        textConfig['font-size'] = BaseCell.getDefault('font-size');
      }
      _ref = ['font-family', 'font-size', 'font-weight', 'font-color'];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        cssAttribute = _ref[_i];
        if (textConfig[cssAttribute] != null) {
          this.setCss(key, cssAttribute, textConfig[cssAttribute]);
        }
      }
      return this.config[key] = textConfig;
    }
  };

  GraphicCell.prototype._draw = function() {
    var backgroundRect, d3Data, enteringLeafNodes, graphicContainer, gridLayout, x, y;
    this._computeDimensions();
    if (this.config['text-header'] != null) {
      x = this.width / 2;
      y = this.dimensions.headerHeight / 2;
      this._addTextTo(this.parentSvg, this.config['text-header']['text'], 'text-header', x, y);
    }
    graphicContainer = this.parentSvg.append('g').attr('class', 'graphic-container').attr('transform', "translate(0," + this.dimensions.graphicOffSet + ")");
    if (this.config['text-footer'] != null) {
      x = this.width / 2;
      y = this.dimensions.footerOffset + this.dimensions.footerHeight / 2;
      this._addTextTo(this.parentSvg, this.config['text-footer']['text'], 'text-footer', x, y);
    }
    d3Data = this._generateDataArray(this.config.percentage, this.config.numImages);
    gridLayout = d3.layout.grid().bands().size([this.width, this.dimensions.graphicHeight]).padding([0.05, 0.05]).padding([this.config['interColumnPadding'], this.config['interRowPadding']]);
    if (this.config['numRows'] != null) {
      gridLayout.rows(this.config['numRows']);
    }
    if (this.config['numCols'] != null) {
      gridLayout.cols(this.config['numCols']);
    }
    enteringLeafNodes = graphicContainer.selectAll(".node").data(gridLayout(d3Data)).enter().append("g").attr("class", function(d) {
      var cssLocation;
      cssLocation = "node-index-" + d.i + " node-xy-" + d.row + "-" + d.col;
      return "node " + cssLocation;
    }).attr("transform", function(d) {
      return "translate(" + d.x + "," + d.y + ")";
    });
    backgroundRect = enteringLeafNodes.append("svg:rect").attr('width', gridLayout.nodeSize()[0]).attr('height', gridLayout.nodeSize()[1]).attr('class', 'background-rect').attr('fill', this.config['background-color'] || 'none');
    if (this.config['debugBorder'] != null) {
      backgroundRect.attr('stroke', 'black').attr('stroke-width', '1');
    }
    if (this.config.baseImageUrl != null) {
      enteringLeafNodes.append("svg:image").attr('width', gridLayout.nodeSize()[0]).attr('height', gridLayout.nodeSize()[1]).attr('xlink:href', this.config.baseImageUrl).attr('class', 'base-image');
    }
    enteringLeafNodes.append('clipPath').attr('id', 'my-clip').append('rect').attr('x', 0).attr('y', (function(_this) {
      return function(d) {
        if (_this.config.direction === 'horizontal') {
          return 0;
        }
        return gridLayout.nodeSize()[1] * (1 - d.percentage);
      };
    })(this)).attr('width', (function(_this) {
      return function(d) {
        if (_this.config.direction === 'horizontal') {
          return gridLayout.nodeSize()[0] * d.percentage;
        }
        return gridLayout.nodeSize()[0];
      };
    })(this)).attr('height', (function(_this) {
      return function(d) {
        if (_this.config.direction === 'vertical') {
          return gridLayout.nodeSize()[1] * d.percentage;
        }
        return gridLayout.nodeSize()[1];
      };
    })(this));
    enteringLeafNodes.append("svg:image").attr('width', gridLayout.nodeSize()[0]).attr('height', gridLayout.nodeSize()[1]).attr('clip-path', 'url(#my-clip)').attr('xlink:href', this.config.variableImageUrl).attr('class', 'variable-image');
    if (this.config['tooltip']) {
      enteringLeafNodes.append("svg:title").text(this.config['tooltip']);
    }
    if (this.config['text-overlay'] != null) {
      x = gridLayout.nodeSize()[0] / 2;
      y = gridLayout.nodeSize()[1] / 2;
      return this._addTextTo(enteringLeafNodes, this.config['text-overlay']['text'], 'text-overlay', x, y);
    }
  };

  GraphicCell.prototype._computeDimensions = function() {
    this.dimensions = {};
    this.dimensions.headerHeight = 0 + (this.config['text-header'] != null ? parseInt(this.config['text-header']['font-size'].replace(/(px|em)/, '')) : 0);
    this.dimensions.footerHeight = 0 + (this.config['text-footer'] != null ? parseInt(this.config['text-footer']['font-size'].replace(/(px|em)/, '')) : 0);
    this.dimensions.graphicHeight = this.height - this.dimensions.headerHeight - this.dimensions.footerHeight;
    this.dimensions.graphicOffSet = 0 + this.dimensions.headerHeight;
    return this.dimensions.footerOffset = 0 + this.dimensions.headerHeight + this.dimensions.graphicHeight;
  };

  GraphicCell.prototype._addTextTo = function(parent, text, myClass, x, y) {
    return parent.append('svg:text').attr('class', myClass).attr('x', x).attr('y', y).style('text-anchor', 'middle').style('alignment-baseline', 'central').style('dominant-baseline', 'central').text(text);
  };

  GraphicCell.prototype._generateDataArray = function(percentage, numImages) {
    var d3Data, num, totalArea, _i;
    d3Data = [];
    totalArea = percentage * numImages;
    for (num = _i = 1; 1 <= numImages ? _i <= numImages : _i >= numImages; num = 1 <= numImages ? ++_i : --_i) {
      percentage = Math.min(1, Math.max(0, 1 + totalArea - num));
      d3Data.push({
        percentage: percentage,
        i: num - 1
      });
    }
    return d3Data;
  };

  return GraphicCell;

})(BaseCell);