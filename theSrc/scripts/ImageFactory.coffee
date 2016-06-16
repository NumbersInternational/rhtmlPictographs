
# I am a singleton, all my methods and variables are static

class ImageFactory

  @addImageTo: (config, width, height) ->
    d3Node = d3.select(this)

    if _.isString config
      config = ImageFactory.parseConfigString config
    else
      unless config.type of ImageFactory.types
        throw new Error "Invalid image creation config : unknown image type #{config.type}"

    #why imageBox? if we place a 100x100 circle in a 200x100 container, the circle goes in the middle.
    #when we create the clipPath, we need to know the circle doesn't start at 0,0 it starts at 50,0
    imageBox = {
      x: 0
      y: 0
      width: width
      height: height
    }
    newImage = ImageFactory.types[config.type](d3Node, config, width, height)
    if _.isObject(newImage) and _.has(newImage, 'newImage')
      imageBox = newImage
      newImage = imageBox.newImage
      delete imageBox.newImage

    if config.verticalclip
      config.verticalclip = ImageFactory.addVerticalClip d3Node, imageBox
      newImage.attr 'clip-path', "url(##{config.verticalclip})"
    if config.horizontalclip
      config.horizontalclip = ImageFactory.addHorizontalClip d3Node, imageBox
      newImage.attr 'clip-path', "url(##{config.horizontalclip})"
    if config.radialclip
      config.radialclip = ImageFactory.addRadialClip d3Node, imageBox
      newImage.attr 'clip-path', "url(##{config.radialclip})"


    return null

  @parseConfigString: (configString) ->
    unless configString.length > 0
      throw new Error "Invalid image creation configString '' : empty string"

    config = {}
    configParts = []

    httpRegex = new RegExp '^(.*?):?(https?://.*)$'
    if matchesHttp = configString.match httpRegex
      configParts = _.without matchesHttp[1].split(':'), 'url'
      config.type = 'url'
      config.url = matchesHttp[2]
    else
      configParts = configString.split(':')

      type = configParts.shift()
      unless type of ImageFactory.types
        throw new Error "Invalid image creation configString '#{configString}' : unknown image type #{type}"
      config['type'] = type

    if type in ['url'] and !config.url?
      config.url = configParts.pop()
      hasDot = new RegExp /\./
      unless config.url and config.url.match(hasDot)
        throw new Error "Invalid image creation configString '#{configString}' : url string must end with a url"

    if type in ['data']
      config.url = 'data:' + configParts.pop()
      unless config.url
        throw new Error "Invalid image creation configString '#{configString}' : data string must have a data url as last string part"

    unknownParts = []
    while part = configParts.shift()

      if part of ImageFactory.keywordHandlers
        handler = ImageFactory.keywordHandlers[part]
        if _.isString handler
          config[handler] = true
      else
        unknownParts.push part

    if unknownParts.length > 1
      throw new Error "Invalid image creation configString '#{configString}' : too many unknown parts: [#{unknownParts.join(',')}]"
    if unknownParts.length == 1
      config['color'] = unknownParts[0]

    return config

  @addCircleTo: (d3Node, config, width, height) ->
    ratio = (p) -> if config.scale then p else 1
    diameter = Math.min(width, height)
    color = ColorFactory.getColor config.color

    newImage = d3Node.append("svg:circle")
      .classed('circle', true)
      .attr 'cx', width/2
      .attr 'cy', height/2
      .attr 'r', (d) -> ratio(d.proportion) * diameter / 2
      .style 'fill', color

    return {
      newImage: newImage
      x: (width - diameter) / 2
      y: (height - diameter) / 2
      width: diameter
      height: diameter
    }

  @addEllipseTo: (d3Node, config, width, height) ->
    ratio = (p) ->
      return if config.scale then p else 1

    color = ColorFactory.getColor config.color

    return d3Node.append("svg:ellipse")
      .classed('ellipse', true)
      .attr 'cx', width/2
      .attr 'cy', height/2
      .attr 'rx', (d) -> width * ratio(d.proportion) / 2
      .attr 'ry', (d) -> height * ratio(d.proportion) / 2
      .style 'fill', color

  @addSquareTo: (d3Node, config, width, height) ->
    ratio = (p) -> return if config.scale then p else 1
    length = Math.min(width,height)

    color = ColorFactory.getColor config.color

    newImage = d3Node.append("svg:rect")
      .classed('square', true)
      .attr 'x', (d) -> (width - length) / 2 + width * (1 - ratio(d.proportion)) / 2
      .attr 'y', (d) -> (height - length) / 2 + height * (1 - ratio(d.proportion)) / 2
      .attr 'width', (d) -> ratio(d.proportion) * length
      .attr 'height', (d) -> ratio(d.proportion) * length
      .style 'fill', color

    return {
      newImage: newImage
      x: (width - length) / 2
      y: (height - length) / 2
      width: length
      height: length
    }

  @addRectTo: (d3Node, config, width, height) ->
    ratio = (p) ->
      return if config.scale then p else 1

    color = ColorFactory.getColor config.color

    return d3Node.append("svg:rect")
      .classed('rect', true)
      .attr 'x', (d) -> width * (1 - ratio(d.proportion)) / 2
      .attr 'y', (d) -> height * (1 - ratio(d.proportion)) / 2
      .attr 'width', (d) -> width * ratio(d.proportion)
      .attr 'height', (d) -> height * ratio(d.proportion)
      .style 'fill', color

  @addRecoloredSvgTo: (d3Node, config, width, height) ->

    newColor = ColorFactory.getColor config.color

    onDownloadSuccess = (data) ->
      svg = jQuery(data).find('svg');
      cleanedSvgString = RecolorSvg.recolor(svg,newColor, width, height)
      d3Node.html(cleanedSvgString)

    onDownloadFail = (data) ->
      throw new Error "could not download #{config.url}"

    jQuery.ajax({url: config.url, dataType: 'xml' })
      .done(onDownloadSuccess)
      .fail(onDownloadFail)

  @addExternalImage: (d3Node, config, width, height) ->
    if config.color
      if config.url.match(/\.svg$/)
        return ImageFactory.addRecoloredSvgTo d3Node, config, width, height
      else
        throw new Error "Cannot recolor #{config.url}: unsupported image type for recoloring"
    else
      return ImageFactory._addExternalImage d3Node, config, width, height

  @_addExternalImage: (d3Node, config, width, height) ->
    ratio = (p) ->
      return if config.scale then p else 1

    return d3Node.append("svg:image")
      .attr 'x', (d) -> width * (1 - ratio(d.proportion)) / 2
      .attr 'y', (d) -> height * (1 - ratio(d.proportion)) / 2
      .attr 'width', (d) -> width * ratio(d.proportion)
      .attr 'height', (d) -> height * ratio(d.proportion)
      .attr 'xlink:href', config.url
      .attr 'class', 'variable-image'

  @addVerticalClip: (d3Node, imageBox) ->
    uniqueId = "clip-id-#{Math.random()}".replace(/\./g, '')
    d3Node.append('clipPath')
      .attr 'id', uniqueId
      .append 'rect'
        .attr 'x', imageBox.x
        .attr 'y', (d) -> imageBox.y + imageBox.height * (1 - d.proportion)
        .attr 'width', imageBox.width
        .attr 'height', (d) -> imageBox.height * d.proportion
    return uniqueId

  @addHorizontalClip: (d3Node, imageBox) ->
    uniqueId = "clip-id-#{Math.random()}".replace(/\./g, '')
    d3Node.append('clipPath')
    .attr 'id', uniqueId
    .append 'rect'
    .attr 'x', imageBox.x
    .attr 'y', imageBox.y
    .attr 'width', (d) -> imageBox.width * d.proportion
    .attr 'height', imageBox.height
    return uniqueId

  @addRadialClip: (d3Node, imageBox) ->
    {x, y, width, height} = imageBox

    uniqueId = "clip-id-#{Math.random()}".replace(/\./g, '')
    d3Node.append('clipPath')
    .attr 'id', uniqueId
    .append 'path'
      .attr 'd', (d) ->
        p = d.proportion
        degrees = p * 360
        w2 = width/2
        h2 = height/2

        #start in the centre, then go straight up, then ...
        pathParts = ["M#{x + w2},#{y + h2} l0,-#{h2}"]

        #trace the edges of the rectangle, returning to the centre once we have "used up" all the proportion
        #probably can be optimized or expressed better ...

        if p >= 1/8
          pathParts.push "l#{w2},0"
        else
          pathParts.push "l#{h2 * Math.tan(degrees * Math.PI/180)},0"

        if p >= 2/8
          pathParts.push "l0,#{h2}"
        else if p > 1/8
          pathParts.push "l0,#{h2 - w2 * Math.tan((90-degrees)* Math.PI/180)}"

        if p >= 3/8
          pathParts.push "l0,#{h2}"
        else if p > 2/8
          pathParts.push "l0,#{w2 * Math.tan((degrees-90)* Math.PI/180)}"

        if p >= 4/8
          pathParts.push "l-#{w2},0"
        else if p > 3/8
          pathParts.push "l-#{w2 - h2 * Math.tan((180-degrees)* Math.PI/180)},0"

        if p >= 5/8
          pathParts.push "l-#{w2},0"
        else if p > 4/8
          pathParts.push "l-#{h2 * Math.tan((degrees-180)* Math.PI/180)},0"

        if p >= 6/8
          pathParts.push "l0,-#{h2}"
        else if p > 5/8
          pathParts.push "l0,-#{h2 - w2 * Math.tan((270-degrees)* Math.PI/180)}"

        if p >= 7/8
          pathParts.push "l0,-#{h2}"
        else if p > 6/8
          pathParts.push "l0,-#{w2 * Math.tan((degrees-270)* Math.PI/180)}"

        if p >= 8/8
          pathParts.push "l#{w2},0"
        else if p > 7/8
          pathParts.push "l#{w2 - h2 * Math.tan((360-degrees)* Math.PI/180)},0"

        pathParts.push 'z'
        return pathParts.join ' '

    return uniqueId

  @types = {
    circle: ImageFactory.addCircleTo
    ellipse: ImageFactory.addEllipseTo
    square: ImageFactory.addSquareTo
    rect: ImageFactory.addRectTo
    url: ImageFactory.addExternalImage
    data: ImageFactory._addExternalImage
  }

  @keywordHandlers = {
    scale: 'scale'
    verticalclip: 'verticalclip'
    vertical: 'verticalclip'
    radialclip: 'radialclip'
    radial: 'radialclip'
    pie: 'radialclip'
    horizontalclip: 'horizontalclip'
    horizontal: 'horizontalclip'
  }

  constructor: () ->
