import createRequest, { requiresAuthentication } from '../utilities';
import constants from '../constants';

const defaults = {};
let _baseOptions;


const getLineItemByIds = async (ids, options = {}) => {
  try {
    requiresAuthentication(_baseOptions);
    const method = 'POST';
    const body = {
      ids,
    };
    const mergedProps = Object.assign({}, defaults, _baseOptions, options);
    const result = await createRequest(
      constants.api.objects.getLineItemByIds,
      { method, body },
      mergedProps
    );
    return Promise.resolve(result);
  } catch (e) {
    return Promise.reject(e);
  }
};

export default function objects(baseOptions) {
  _baseOptions = baseOptions;

  return {
    /**
     * Get a group of line items by ID
     * @async
     * @memberof hs/objects
     * @method getLineItemByIds
     * @param {array} ids The ID of the object that you want to get the associations for.
     * @param {object} properties Optional extra properties to add to the request - see {@link https://developers.hubspot.com/docs/methods/crm-associations/get-associations|developer docs}
     * @example
     * const hs = new HubspotClient(props);
     * hs.objects.getLineItemByIds([123412313, 132412315]).then(response => console.log(response))
     * @returns {Promise}
     */
    getLineItemByIds
  };
}
