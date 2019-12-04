import createRequest, { requiresAuthentication } from '../utilities';
import constants from '../constants';

const defaults = {};
let _baseOptions;

const createProducts = async newProducts => {
  try {
    requiresAuthentication(_baseOptions);
    const mergedProps = Object.assign({}, defaults, _baseOptions);
    const method = 'POST';
    const url = constants.api.products.createProducts;

    const body = newProducts.map(p => Object.keys(p).map(key => ({
      property: key,
      value: p[key]
    })));

    await createRequest(url, { method, body }, mergedProps);
    return Promise.resolve({ deleted: true });
  } catch (e) {
    return Promise.reject(e.message);
  }
};

const createProduct = async newProduct => {
  try {
    requiresAuthentication(_baseOptions);
    const mergedProps = Object.assign({}, defaults, _baseOptions);
    const method = 'POST';
    const url = constants.api.products.createProduct;

    const body = Object.keys(newProduct).map(key => ({
      property: key,
      value: newProduct[key]
    }));

    await createRequest(url, { method, body }, mergedProps);
    return Promise.resolve({ deleted: true });
  } catch (e) {
    return Promise.reject(e.message);
  }
};

const getAll = async (opts = {}) => {
  try {
    requiresAuthentication(_baseOptions);
    const { limit, offset, properties, propertiesWithHistory } = opts;

    const allowedProps = { limit, offset, properties, propertiesWithHistory };
    const mergedProps = Object.assign({}, defaults, _baseOptions, allowedProps);

    const allProducts = await createRequest(
      constants.api.products.getAll,
      {},
      mergedProps
    );

    return Promise.resolve(allProducts);
  } catch (e) {
    return Promise.reject(e.message);
  }
};

const batchDelete = async deletes => {
  try {
    requiresAuthentication(_baseOptions);
    const mergedProps = Object.assign({}, defaults, _baseOptions);
    const method = 'POST';
    const url = constants.api.products.batchDelete;
    await createRequest(url, { method, body: { ids: deletes } }, mergedProps);
    return Promise.resolve({ deleted: true });
  } catch (e) {
    return Promise.reject(e.message);
  }
};

export default function products(baseOptions) {
  _baseOptions = baseOptions;

  return {
    createProduct,
    createProducts,
    /**
     * Get all products
     * @async
     * @memberof hs/products
     * @method getAll
     * @param {object} opts
     * @example
     * const hs = new HubspotClient(props);
     * hs.products.getAll({
     *   limit: 2,
     *   offset: 12356,
     *   properties: ['dealname', 'pipeline'],
     *   propertiesWithHistory: ['dealstage']
     * }).then(response => console.log(response));
     * @property {int} opts.limit
     * @property {int} opts.offset
     * @property {array} opts.properties
     * @property {array} opts.propertiesWithHistory
     * @returns {Promise}
     */
    getAll,
    /**
     * Delete a group of products
     * @async
     * @memberof hs/products
     * @method batchDelete
     * @param {array} delete Array of objects. objectId corresponds with a productId. See Example below.
     * @example
     * const hs = new HubspotClient(props);
     * const delete = [1642813, 1645205]);
     * hs.products.batchDelete(delete).then(response => console.log(response));
     * @returns {Promise}
     * If successful the promise will resolve with { deleted: true }. Otherwise the promise will resolve with an error message.
     */
    batchDelete,
  };
}
