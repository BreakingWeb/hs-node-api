import createRequest, { requiresAuthentication } from '../utilities';
import constants from '../constants';

const debug = require('debug')('hubspot-api:tests'); // eslint-disable-line

const defaults = {};
let _baseOptions;

const getById = async (ownerId) => {
  try {
    requiresAuthentication(_baseOptions);
    const mergedProps = Object.assign({}, defaults, _baseOptions);
    const contact = await createRequest(
      constants.api.owners.byId,
      { ownerId },
      mergedProps
    );
    return Promise.resolve(contact);
  } catch (e) {
    return Promise.reject(e);
  }
};

//
// const mergeContacts = async (primary, secondary) => {
//   // FIXME: Implement this
// };

export default function owners(baseOptions) {
  _baseOptions = baseOptions;
  // API
  return {
    /**
     * Get owner by ID
     * @async
     * @memberof hs/owners
     * @method getById
     * @param {int} ownerId The id of owner to retrieve
     * @example
     * const hs = new HubspotClient(props);
     * hs.owners.getById(123412313).then(response => console.log(response))
     * @returns {Promise}
     */
    getById,
  };
}
