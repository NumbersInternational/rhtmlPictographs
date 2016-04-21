var DisplayError;

DisplayError = (function() {
  function DisplayError(el, error) {
    this.error = error;
    this.rootElement = _.has(el, 'length') ? el[0] : el;
  }

  DisplayError.prototype.draw = function() {
    var errorContainer, errorImage, errorText;
    errorContainer = $('<div class="pictograph-error-container">');
    errorImage = $('<img width="32px" height="32px" src="https://s3-ap-southeast-2.amazonaws.com/kyle-public-numbers-assets/htmlwidgets/CroppedImage/error_128.png"/>');
    errorText = $('<span>').html(this.error);
    errorContainer.append(errorImage);
    errorContainer.append(errorText);
    $(this.rootElement).empty();
    return $(this.rootElement).append(errorContainer);
  };

  return DisplayError;

})();