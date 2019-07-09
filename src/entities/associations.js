import createRequest, { requiresAuthentication } from '../utilities';
import constants from '../constants';

const defaults = {};
let _baseOptions;


const getById = async (objectId, definitionId, options = {}) => {
  try {
    requiresAuthentication(_baseOptions);
    const mergedProps = Object.assign({}, defaults, _baseOptions, options);
    const products = await createRequest(
      constants.api.associations.byId,
      { objectId, definitionId },
      mergedProps
    );
    return Promise.resolve(products);
  } catch (e) {
    return Promise.reject(e);
  }
};

export default function associations(baseOptions) {
  _baseOptions = baseOptions;

  return {
    /**
     * Get associations by Object ID
     * @async
     * @memberof hs/associations
     * @method getById
     * @param {int} objectId The ID of the object that you want to get the associations for.
     * @param {int} definitionId Association type - see {@link https://developers.hubspot.com/docs/methods/crm-associations/crm-associations-overview|developer docs}
     * @param {object} properties Optional extra properties to add to the request - see {@link https://developers.hubspot.com/docs/methods/crm-associations/get-associations|developer docs}
     * @example
     * const hs = new HubspotClient(props);
     * hs.associations.getById(123412313, 15).then(response => console.log(response))
     * @returns {Promise}
     */
    getById
  };
}
