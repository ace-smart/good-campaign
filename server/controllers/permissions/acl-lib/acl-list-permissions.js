const ACL = require('../../../models').acl;

module.exports = function(id, userId) {

  /*
    Returns a promise containing the type of permission granted
    @params id = primaryKey id to a row in the ACL table. Extracted from req.cookies.user (if provided)
    @params userId = the logged in user's id
  */

  // If id is undefined, no cookie has been set. Therefore the user is not accessing another's account and has full access be default.
  if (!id) {
    return Promise.resolve({
      userId,
      lists: 'Write'
    });
  }

  return ACL.findById(id)
    .then(userInstance => {
      if (userInstance) {
        const listsAccess = {
          lists: userInstance.getDataValue('templates'),
          userId: userInstance.getDataValue('userId')
        };
        return listsAccess;
      } else {
        throw 'Permission denied';
      }
    })
    .catch(err => {
      throw err;
    });
};
