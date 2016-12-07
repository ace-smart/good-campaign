const db = require('../../models');
const slug = require('slug');
const htmlToText = require('html-to-text');

module.exports = (req, res) => {

  // TODO: Improve validation

  // Validate input
  if (!req.body.templateName || !req.body.type || !req.body.emailBody) {
    res.status(400).send();
    return;
  }

  // Set emailBody to plaintext if type === Plaintext
  const htmlToTextOpts = {
    wordwrap: false,
    ignoreImage: true
  };

  const emailBodyType = req.body.type === 'Plaintext'
    ? htmlToText.fromString(req.body.emailBody, htmlToTextOpts)
    : req.body.emailBody;

  db.template.findOrCreate({
    where: {
      name: req.body.templateName,
      userId: req.user.id
    },
    defaults: {
      name: req.body.templateName,
      fromName: req.body.fromName || '',
      fromEmail: req.body.fromEmail || '',
      emailSubject: req.body.emailSubject || '',
      emailBody: emailBodyType,
      trackingPixelEnabled: req.body.trackingPixelEnabled,
      trackLinksEnabled: req.body.trackLinksEnabled,
      unsubscribeLinkEnabled: req.body.unsubscribeLinkEnabled,
      type: req.body.type,
      userId: req.user.id,
      slug: slug(req.body.templateName)
    }
  }).then(templateInstance => {
    if (templateInstance) { // Does the template already exist?
      res.status(400).send();
    } else {
      res.send();
    }
  }).catch(err => {
    throw err;
  });
};
