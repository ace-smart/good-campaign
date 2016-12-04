const list = require('../../models').list;
const listsubscriber = require('../../models').listsubscriber;

module.exports = (req, res) => {
  // Find all subscribers belonging to a list
  const userId = req.user.id;
  const listId = req.query.listId;

  const offset = req.query.offset;
  const limit = req.query.limit;
  const filters = JSON.parse(req.query.filters) || {};

  list.findOne({
    where: {
      userId,
      id: listId
    },
    attributes: ['name', 'createdAt', 'updatedAt'],
    raw: true
  }).then(instancesArray => {
    if (!instancesArray) {
      res.status(401)  //??
        .send({
          message: 'not authorised to view list or list does not exist'
        });
      return;
    } else {
      let where = { listId };
      if (filters.subscribed === 'true') {
        where.subscribed = true;
      } else if (filters.subscribed === 'false') {
        where.subscribed = false;
      }

      listsubscriber.findAll({
        where,
        offset: ( offset - 1) * limit,
        limit,
        order: [ ['id', 'ASC'] ],
        attributes: ['id', 'email', 'subscribed', 'createdAt', 'updatedAt', 'mostRecentStatus'],
        raw: true
      }).then(instancesArray => {
        listsubscriber.count({
          where
        }).then(total => {
          res.send({ subscribers: instancesArray, total });
        })
      });
    }
  });
};
