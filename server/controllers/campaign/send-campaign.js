const db = require('../../models');
const email = require('./email');
const AWS = require('aws-sdk');

// TODO: Validate contents abide to Amazon's limits https://docs.aws.amazon.com/ses/latest/DeveloperGuide/limits.html

/*
Reveives
{"listName":"test","campaignName":"sfds","fromName":"fsdsdf","fromEmail":"me@gmail.com","emailSubject":"ssdff","emailBody":"<p>sdfsf</p>"}
*/

module.exports = (req, res) => {

  // If req.body.id was not supplied or is not a number, cancel
  if (!req.body.id || typeof req.body.id !== 'number') {
    res.status(400).send();
    return;
  }

  function *sendCampaign() {
    const userId = req.user.id;
    const campaignId = req.body.id;

    // NOTE: Current assumption is that the user is using Amazon SES. Can modularise and change this if necessary.

    // 1. Confirm user has set their keys & retrieve them
    const { accessKey, secretKey } = yield getAmazonKeys(userId);

    // 2. Confirm the campaign id belongs to the user and retrieve the associated listId
    const campaignInfo = yield campaignBelongsToUser(userId, campaignId);

    // 3. Get the user's Max24HourSend - SentLast24Hours to determine available email quota, then get MaxSendRate
    const quotas = yield getEmailQuotas(accessKey, secretKey);

    // 4. Count the number of list subscribers to message. If this is above the daily quota, send an error.
    const totalListSubscribers = yield countListSubscribers(campaignInfo.listId, quotas.AvailableToday);

    // 5. At this stage, we've ready to send the campaign. Respond that the request was successful.
    res.send({ message: `Your emails are being sent! We'll notify you when this is done.` });

    // 6. Send the campaign.
    yield email.amazon.controller(generator, db.listsubscriber, campaignInfo, accessKey, secretKey, quotas, totalListSubscribers);

    // 7. If there was an error preventing emails from being sent, send it here. Otherwise, TODO: push a notification

  }

  const generator = sendCampaign();
  generator.next();

  // Validate the campaign belongs to the user
  function campaignBelongsToUser(userId, campaignId) {
    db.campaign.findOne({
      where: {
        id: campaignId,
        userId: userId
      }
    }).then(campaignInstance => {
      if (!campaignInstance) {
        res.status(401).send();
      } else {
        campaignObject = campaignInstance.get({ plain:true });
        const listId = campaignObject.listId;
        const { fromName, fromEmail, emailSubject, emailBody } = campaignObject;

        generator.next({ listId, fromName, fromEmail, emailSubject, emailBody });
      }
    }).catch(err => {
      throw err;
    });
  }

  function getAmazonKeys(userId) {
    db.setting.findOne({
      where: {
        userId: userId
      }
    }).then(settingInstance => {
      if (!settingInstance) {
        // This should never happen as settings are created on account creation
        res.status(500).send();
      } else {
        settingObject = settingInstance.get({ plain:true });

        const accessKey = settingObject.amazonSimpleEmailServiceAccessKey;
        const secretKey = settingObject.amazonSimpleEmailServiceSecretKey;

        // If either key is blank, the user needs to set their settings
        if (accessKey === '' || secretKey === '') {
          res.status(400).send({ message:'Please provide your details for your Amazon account under "Settings".' });
        } else {
          generator.next({ accessKey, secretKey });
        }
      }
    }).catch(err => {
      throw err;
      res.status(500).send();
    });
  }

  function getEmailQuotas(accessKey, secretKey) {
    const ses = new AWS.SES({
      accessKeyId: accessKey,
      secretAccessKey: secretKey,
      region: `eu-west-1` //TODO: Get this from the client
    });

    ses.getSendQuota((err, data) => {
      if (err) { // Either access keys are wrong here or the request is being placed too quickly
        res.status(400).send({ message: 'Please confirm your Amazon SES settings and try again later.' });
      } else {
        const { Max24HourSend, SentLast24Hours, MaxSendRate } = data;
        const AvailableToday = Max24HourSend - SentLast24Hours;
        generator.next({ Max24HourSend, SentLast24Hours, MaxSendRate, AvailableToday });
      }
    });
  }

  function countListSubscribers(listId, AvailableToday) {
    db.listsubscriber.count({
      where: {
        listId: listId
      }
    }).then(total => {
      if (total > AvailableToday) {
        res.status(400).send({ message: `This list exceeds your 24 hour allowance of ${AvailableToday} emails. Please upgrade your SES limit.` });
      } else {
        generator.next(total);
      }
    }).catch(err => {
      throw err;
      res.status(500).send();
    });
  }

}
