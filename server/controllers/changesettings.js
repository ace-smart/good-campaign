'use strict'
const _ = require('lodash');
const Setting = require('../models').setting;

module.exports = function(req, res) {
  console.log(req.body);
  const settingsToChange = _.pickBy(req.body);

  // Exit if there are no settings to change
  if (_.isEmpty(settingsToChange)) {
    res.status(400).send({ message: 'The SES credentials form is empty' });
    return;
  }

  /*
    TODO: Check settingsToChange.amazonSimpleEmailServiceAccessKey and settingsToChange.amazonSimpleEmailServiceSecretKey for validity using regex
 */
  Setting.update({
    amazonSimpleEmailServiceAccessKey: settingsToChange.amazonSimpleEmailServiceAccessKey,
    amazonSimpleEmailServiceSecretKey: settingsToChange.amazonSimpleEmailServiceSecretKey
  }, {
    where: {
      userId: req.user.id
    }
  }).then(result => {
    res.send({ message: 'SES credentials saved' });
  }).catch(err => {
    throw err;
    res.status(500).send();
  });
}
