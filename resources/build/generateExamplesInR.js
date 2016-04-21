var _ = require('lodash');

module.exports = function (parsedFileContents) {
  return new Promise( function (resolve, reject) {
    var content = '';

    content += 'library(devtools)\n'
    content += 'install_github("NumbersInternational/rhtmlPictographs")\n'

    _.forEach(parsedFileContents.features, function(feature) {
      content += '#' + feature.name + "\n";
      _.forEach(feature.scenarios, function(scenario) {
        content += '##' + scenario.name + "\n";
        _.forEach(scenario.description, function(line) {
          content += '###' + line + "\n";
        });
        content += "\n";

        var percentage = _.has(scenario.settings, 'percentage') ? scenario.settings.percentage : 'NULL';

        var rCommand = 'rhtmlPictographs::graphic(' +
          percentage + ',' +
          scenario.width + ',' +
          scenario.height + ',' +
          "'" + (scenario.settingsString || JSON.stringify(scenario.settings)) + "'" +
          ')';

        content += rCommand + "\n";
        content += "\n";
      });
    });
    return resolve(content);
  })
};
