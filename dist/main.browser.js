'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var qs = _interopDefault(require('querystring'));
var axios = _interopDefault(require('axios'));
var fs = _interopDefault(require('fs'));
var FormData = _interopDefault(require('form-data'));
var omit = _interopDefault(require('lodash.omit'));

var asyncToGenerator = function (fn) {
  return function () {
    var gen = fn.apply(this, arguments);
    return new Promise(function (resolve, reject) {
      function step(key, arg) {
        try {
          var info = gen[key](arg);
          var value = info.value;
        } catch (error) {
          reject(error);
          return;
        }

        if (info.done) {
          resolve(value);
        } else {
          return Promise.resolve(value).then(function (value) {
            step("next", value);
          }, function (err) {
            step("throw", err);
          });
        }
      }

      return step("next");
    });
  };
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();





var defineProperty = function (obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
};

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

var debugApp = require('debug')('hubspot-api:utilities');

var requiresAuthentication = function requiresAuthentication(_ref) {
  var hapikey = _ref.hapikey,
      accessToken = _ref.accessToken;

  if (!hapikey && !accessToken) {
    throw new Error('This method requires hapikey/accessToken authentication');
  }
};

var interpolate = function interpolate(template, data) {
  var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

  // For escaping strings to go in regex
  var regexEscape = /([$^\\/()|?+*[\]{}.-])/g;
  var delimiter = opts.delimiter || '{}';
  var delLen = delimiter.length;
  var lDelLen = Math.ceil(delLen / 2);
  // escape delimiters for regex
  var lDel = delimiter.substr(0, lDelLen).replace(regexEscape, '\\$1');
  var rDel = delimiter.substr(lDelLen, delLen).replace(regexEscape, '\\$1') || lDel;

  // construct the new regex
  var regex = new RegExp(lDel + '[^' + lDel + rDel + ']+' + rDel, 'g');

  return template.replace(regex, function (placeholder) {
    var key = placeholder.slice(lDelLen, -lDelLen);
    var keyParts = key.split('.');
    var val = void 0;
    var i = 0;
    var len = keyParts.length;

    if (key in data) {
      // need to be backwards compatible with "flattened" data.
      val = data[key];
    } else {
      // look up the chain
      val = data;
      for (; i < len; i++) {
        if (keyParts[i] in val) {
          val = val[keyParts[i]];
        } else {
          return placeholder;
        }
      }
    }
    return val;
  });
};

var createRequest = (function () {
  var _ref2 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(uri, options) {
    var props = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var properties, url, method, headers, timeout, data, response;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            properties = Object.keys(props).reduce(function (acc, curr) {
              if (typeof props[curr] !== 'undefined') {
                acc[curr] = props[curr];
              }
              return acc;
            }, {});
            // Prevent this from being appended to URL.

            delete properties.accessToken;

            url = interpolate(uri, options) + '?' + qs.stringify(properties);

            debugApp('url: ' + url);
            method = options.method || 'GET';

            debugApp(method + ': ' + url);
            headers = _extends({}, options.headers);
            timeout = 30000;
            data = void 0;

            if (props.accessToken) {
              Object.assign(headers, { Authorization: 'Bearer ' + props.accessToken });
            }

            if (options.data) {
              data = options.data;
            }

            if (options.body) {
              data = options.body;
            }

            _context.next = 15;
            return axios({ url: url, method: method, headers: headers, timeout: timeout, data: data });

          case 15:
            response = _context.sent;
            return _context.abrupt('return', Promise.resolve(response.data));

          case 19:
            _context.prev = 19;
            _context.t0 = _context['catch'](0);
            return _context.abrupt('return', Promise.reject(_context.t0));

          case 22:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, this, [[0, 19]]);
  }));

  function createRequest(_x2, _x3) {
    return _ref2.apply(this, arguments);
  }

  return createRequest;
})();

var queryStringParamInterpolator = function queryStringParamInterpolator(objs, original) {
  var response = Object.keys(objs).map(function (key) {
    if (key && objs[key]) {
      // Remove from the original object
      delete original[key];
      var innerResp = Object.keys(objs[key]).reduce(function (acc, curr) {
        acc[key + '__' + curr] = objs[key][curr];
        return acc;
      }, {});
      return innerResp;
    }
    return undefined;
  }).reduce(function (acc, curr) {
    Object.assign(acc, curr);
    return acc;
  }, {});

  return Object.assign(original, response);
};

var sanitizeObject = function sanitizeObject(obj) {
  return JSON.parse(JSON.stringify(obj));
};

var defaultApiHost = process.env.COS_API_HOST || 'https://api.hubapi.com';

var constants = {
  api: {
    account: {
      details: defaultApiHost + '/integrations/v1/me',
      dailyLimit: defaultApiHost + '/integrations/v1/limit/daily'
    },
    files: {
      getFilesInFolder: defaultApiHost + '/filemanager/api/v2/files',
      upload: defaultApiHost + '/filemanager/api/v3/files/upload'
    },
    pages: {
      create: defaultApiHost + '/content/api/v2/pages',
      byId: defaultApiHost + '/content/api/v2/pages/{id}',
      clone: defaultApiHost + '/content/api/v2/pages/{id}/clone',
      list: defaultApiHost + '/content/api/v2/pages',
      buffer: defaultApiHost + '/content/api/v2/pages/{id}/buffer',
      bufferedChanges: defaultApiHost + '/content/api/v2/pages/{id}/has-buffered-changes',
      publishAction: defaultApiHost + '/content/api/v2/pages/{id}/publish-action',
      pushBufferLive: defaultApiHost + '/content/api/v2/pages/{id}/push-buffer-live',
      restoreDeleted: defaultApiHost + '/content/api/v2/pages/{id}/restore-deleted',
      validateBuffer: defaultApiHost + '/content/api/v2/pages/{id}/validate-buffer',
      versions: defaultApiHost + '/content/api/v2/pages/{id}/versions',
      restoreVersion: defaultApiHost + '/content/api/v2/pages/{id}/versions/restore'
    },
    deals: {
      recentlyCreated: defaultApiHost + '/deals/v1/deal/recent/created',
      getAll: defaultApiHost + '/deals/v1/deal/paged',
      byId: defaultApiHost + '/deals/v1/deal/{id}',
      create: defaultApiHost + '/deals/v1/deal',
      update: defaultApiHost + '/deals/v1/deal/{id}',
      batchUpdate: defaultApiHost + '/deals/v1/batch-async/update'
    },
    products: {
      getAll: defaultApiHost + '/crm-objects/v1/objects/products/paged',
      batchDelete: defaultApiHost + '/crm-objects/v1/objects/products/batch-delete',
      createProducts: defaultApiHost + '/crm-objects/v1/objects/products/batch-create',
      createProduct: defaultApiHost + '/crm-objects/v1/objects/products',
      updateProducts: defaultApiHost + '/crm-objects/v1/objects/products/batch-update'

    },
    emailEvents: {
      campaignsWithRecentActivity: defaultApiHost + '/email/public/v1/campaigns',
      campaign: defaultApiHost + '/email/public/v1/campaigns/{campaignId}'
    },
    emailSubscriptions: {
      updateStatus: defaultApiHost + '/email/public/v1/subscriptions/{email}',
      getStatus: defaultApiHost + '/email/public/v1/subscriptions/{email}'
    },
    forms: {
      submissions: defaultApiHost + '/form-integrations/v1/submissions/forms/{formId}',
      submitForm: 'https://forms.hubspot.com/uploads/form/v2/{portalId}/{formId}',
      formFields: defaultApiHost + '/forms/v2/fields/{formId}',
      submitFormV3: 'https://api.hsforms.com/submissions/v3/integration/submit/{portalId}/{formId}'
    },
    social: {
      channels: defaultApiHost + '/broadcast/v1/channels/setting/publish/current',
      createBroadcastMessage: defaultApiHost + '/broadcast/v1/broadcasts'
    },
    domains: {
      getAll: defaultApiHost + '/content/api/v4/domains',
      byId: defaultApiHost + '/content/api/v4/domains/{id}'
    },
    layouts: {
      getAll: defaultApiHost + '/content/api/v2/layouts',
      byId: defaultApiHost + '/content/api/v2/layouts/{id}',
      getBuffer: defaultApiHost + '/content/api/v2/layouts/{id}/buffer',
      hasBufferedChanges: defaultApiHost + '/content/api/v2/layouts/{id}/has-buffered-changes',
      getPreviousVersions: defaultApiHost + '/content/api/v2/layouts/{id}/versions',
      getPreviousVersion: defaultApiHost + '/content/api/v2/layouts/{id}/versions/{versionId}'
    },
    email: {
      getSubscriptions: defaultApiHost + '/email/public/v1/subscriptions'
    },
    blog: {
      authors: defaultApiHost + '/blogs/v3/blog-authors',
      authorById: defaultApiHost + '/blogs/v3/blog-authors/{id}',
      authorSearch: defaultApiHost + '/blogs/v3/blog-authors/search',
      comments: defaultApiHost + '/comments/v3/comments',
      commentById: defaultApiHost + '/comments/v3/comments/{id}',
      restoreDeletedComment: defaultApiHost + '/comments/v3/comments/{id}/restore',
      getAll: defaultApiHost + '/content/api/v2/blogs',
      byId: defaultApiHost + '/content/api/v2/blogs/{id}',
      getVersions: defaultApiHost + '/content/api/v2/blogs/{blog_id}/versions',
      getVersion: defaultApiHost + '/content/api/v2/blogs/{blog_id}/versions/{revision_id}',
      posts: defaultApiHost + '/content/api/v2/blog-posts',
      postById: defaultApiHost + '/content/api/v2/blog-posts/{id}',
      clonePostById: defaultApiHost + '/content/api/v2/blog-posts/{id}/clone',
      restorePostById: defaultApiHost + '/content/api/v2/blog-posts/{id}/restore-deleted',
      publishOrSchedulePost: defaultApiHost + '/content/api/v2/blog-posts/{id}/publish-action',
      postAutoSaveBuffer: defaultApiHost + '/content/api/v2/blog-posts/{id}/buffer',
      validatePostAutoSaveBuffer: defaultApiHost + '/content/api/v2/blog-posts/{id}/validate-buffer',
      postAutoSaveBufferStatus: defaultApiHost + '/content/api/v2/blog-posts/{id}/has-buffered-changes',
      postVersions: defaultApiHost + '/content/api/v2/blog-posts/{id}/versions',
      restorePostVersion: defaultApiHost + '/content/api/v2/blog-posts/{id}/versions/restore',
      postVersionById: defaultApiHost + '/content/api/v2/blog-posts/{id}/versions/{version_id}',
      pushPostAutosaveBufferToLive: defaultApiHost + '/content/api/v2/blog-posts/{id}/push-buffer-live',
      topics: defaultApiHost + '/blogs/v3/topics',
      groupTopics: defaultApiHost + '/blogs/v3/topics/group-topics',
      topic: defaultApiHost + '/blogs/v3/topics/{id}',
      topicSearch: defaultApiHost + '/blogs/v3/topics/search'
    },
    calendar: {
      events: defaultApiHost + '/calendar/v1/events',
      createTask: defaultApiHost + '/calendar/v1/events/task',
      taskById: defaultApiHost + '/calendar/v1/events/task/{taskId}'
    },
    contacts: {
      getAll: defaultApiHost + '/contacts/v1/lists/all/contacts/all',
      deleteById: defaultApiHost + '/contacts/v1/contact/vid/{vid}',
      byId: defaultApiHost + '/contacts/v1/contact/vid/{vid}/profile',
      byIds: defaultApiHost + '/contacts/v1/contact/vids/batch/',
      byEmail: defaultApiHost + '/contacts/v1/contact/email/{email}/profile',
      byUtk: defaultApiHost + '/contacts/v1/contact/utk/{utk}/profile',
      createContact: defaultApiHost + '/contacts/v1/contact/createOrUpdate/email/{email}/',
      batchUpdateContacts: defaultApiHost + '/contacts/v1/contact/batch/',
      getRecentlyModified: defaultApiHost + '/contacts/v1/lists/recently_updated/contacts/recent',
      search: defaultApiHost + '/contacts/v1/search/query'
    },
    contactsList: {
      byId: defaultApiHost + '/contacts/v1/lists/{listId}',
      contactsByListId: defaultApiHost + '/contacts/v1/lists/{listId}/contacts/all'
    },
    contactsProperties: {
      getAllContactsProperties: defaultApiHost + '/properties/v1/contacts/properties'
    },
    company: {
      getAll: defaultApiHost + '/companies/v2/companies/paged',
      create: defaultApiHost + '/companies/v2/companies/',
      batchUpdate: defaultApiHost + '/companies/v1/batch-async/update',
      byId: defaultApiHost + '/companies/v2/companies/{companyId}',
      contacts: defaultApiHost + '/companies/v2/companies/{companyId}/contacts',
      byDomain: defaultApiHost + '/companies/v2/domains/{domain}/companies'
    },
    owners: {
      byId: defaultApiHost + '/owners/v2/owners/{ownerId}'
    },
    workflows: {
      eventLogs: defaultApiHost + '/automation/v3/logevents/workflows/{workflowId}/filter',
      enrollments: defaultApiHost + '/automation/v2/workflows/enrollments/contacts/{id}',
      enrollContact: defaultApiHost + '/automation/v2/workflows/{workflowId}/enrollments/contacts/{email}',
      create: defaultApiHost + '/automation/v3/workflows',
      getAll: defaultApiHost + '/automation/v3/workflows',
      byId: defaultApiHost + '/automation/v3/workflows/{id}'
    },
    hubdb: {
      tables: defaultApiHost + '/hubdb/api/v2/tables',
      rows: defaultApiHost + '/hubdb/api/v2/tables/{tableId}/rows',
      table: defaultApiHost + '/hubdb/api/v2/tables/{tableId}',
      row: defaultApiHost + '/hubdb/api/v2/tables/{tableId}/rows/{id}',
      cell: defaultApiHost + '/hubdb/api/v2/tables/{tableId}/rows/{rowId}/cells/{cellId}',
      cloneTable: defaultApiHost + '/hubdb/api/v2/tables/{tableId}/clone',
      cloneRow: defaultApiHost + '/hubdb/api/v2/tables/{tableId}/rows/{rowId}/clone',
      importCsv: defaultApiHost + '/hubdb/api/v2/tables/{tableId}/import',
      publishTable: defaultApiHost + '/hubdb/api/v2/tables/{tableId}/publish'
    },
    engagements: {
      create: defaultApiHost + '/engagements/v1/engagements'
    },
    oauth: {
      tokenInfo: defaultApiHost + '/oauth/v1/access-tokens/{token}'
    },
    urlMappings: {
      getAll: defaultApiHost + '/url-mappings/v3/url-mappings',
      byId: defaultApiHost + '/url-mappings/v3/url-mappings/{id}',
      create: defaultApiHost + '/url-mappings/v3/url-mappings',
      update: defaultApiHost + '/url-mappings/v3/url-mappings/{id}',
      delete: defaultApiHost + '/url-mappings/v3/url-mappings/{id}'
    },
    associations: {
      byId: defaultApiHost + '/crm-associations/v1/associations/{objectId}/HUBSPOT_DEFINED/{definitionId}'
    },
    objects: {
      getLineItemByIds: defaultApiHost + '/crm-objects/v1/objects/line_items/batch-read'
    }
  }
};

var _this = undefined;

var debug = require('debug')('hubspot-api:tests'); // eslint-disable-line

var defaults = {};
var _baseOptions = void 0;

var getAccountDetails = function () {
  var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var mergedProps, accountDetails;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

            requiresAuthentication(_baseOptions);
            mergedProps = Object.assign({}, defaults, _baseOptions);
            _context.next = 5;
            return createRequest(constants.api.account.details, {}, mergedProps);

          case 5:
            accountDetails = _context.sent;
            return _context.abrupt('return', Promise.resolve(accountDetails));

          case 9:
            _context.prev = 9;
            _context.t0 = _context['catch'](0);
            return _context.abrupt('return', Promise.reject(_context.t0));

          case 12:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this, [[0, 9]]);
  }));

  return function getAccountDetails() {
    return _ref.apply(this, arguments);
  };
}();

var getDailyLimit = function () {
  var _ref2 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
    var mergedProps, dailyLimit;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;

            requiresAuthentication(_baseOptions);
            mergedProps = Object.assign({}, defaults, _baseOptions);
            _context2.next = 5;
            return createRequest(constants.api.account.dailyLimit, {}, mergedProps);

          case 5:
            dailyLimit = _context2.sent;
            return _context2.abrupt('return', Promise.resolve(dailyLimit));

          case 9:
            _context2.prev = 9;
            _context2.t0 = _context2['catch'](0);
            return _context2.abrupt('return', Promise.reject(_context2.t0));

          case 12:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, _this, [[0, 9]]);
  }));

  return function getDailyLimit() {
    return _ref2.apply(this, arguments);
  };
}();

function accounts(baseOptions) {
  _baseOptions = baseOptions;
  // API
  return {
    /**
     * Get account info
     * @async
     * @memberof hs/account
     * @method getAccountDetails
     * @example
     * const hs = new HubspotClient(props);
     * const accountDetails = await hs.account.getAccountDetails();
     * @returns {Promise}
     */
    getAccountDetails: getAccountDetails,
    /**
     * Check to see how many API calls have been made for a portal for the current day as well as the time that the limit will reset
     * @async
     * @memberof hs/account
     * @method getDailyLimit
     * @example
     * const hs = new HubspotClient(props);
     * const dailyLimit = await hs.account.getDailyLimit();
     * @returns {Promise}
     */
    getDailyLimit: getDailyLimit
  };
}

var _this$1 = undefined;

var debug$1 = require('debug')('hubspot-api:tests'); // eslint-disable-line

var defaults$2 = {
  propertyMode: 'value_only',
  formSubmissionMode: 'none'
};
var _baseOptions$1 = void 0;

var getById = function () {
  var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(vid) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var mergedProps, contact;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

            requiresAuthentication(_baseOptions$1);
            mergedProps = Object.assign({}, defaults$2, _baseOptions$1, options);
            _context.next = 5;
            return createRequest(constants.api.contacts.byId, { vid: vid }, mergedProps);

          case 5:
            contact = _context.sent;
            return _context.abrupt('return', Promise.resolve(contact));

          case 9:
            _context.prev = 9;
            _context.t0 = _context['catch'](0);
            return _context.abrupt('return', Promise.reject(_context.t0));

          case 12:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this$1, [[0, 9]]);
  }));

  return function getById(_x) {
    return _ref.apply(this, arguments);
  };
}();

var getByIds = function () {
  var _ref2 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(ids) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var mergedProps, allContacts;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;

            requiresAuthentication(_baseOptions$1);

            mergedProps = Object.assign({}, defaults$2, _baseOptions$1, options);

            mergedProps.vid = ids;

            _context2.next = 6;
            return createRequest(constants.api.contacts.byIds, {}, mergedProps);

          case 6:
            allContacts = _context2.sent;
            return _context2.abrupt('return', Promise.resolve(allContacts));

          case 10:
            _context2.prev = 10;
            _context2.t0 = _context2['catch'](0);
            return _context2.abrupt('return', Promise.reject(_context2.t0));

          case 13:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, _this$1, [[0, 10]]);
  }));

  return function getByIds(_x3) {
    return _ref2.apply(this, arguments);
  };
}();

var getByEmail = function () {
  var _ref3 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(email, options) {
    var mergedProps, contact;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;

            requiresAuthentication(_baseOptions$1);
            mergedProps = Object.assign({}, defaults$2, _baseOptions$1, options);
            _context3.next = 5;
            return createRequest(constants.api.contacts.byEmail, { email: email }, mergedProps);

          case 5:
            contact = _context3.sent;
            return _context3.abrupt('return', Promise.resolve(contact));

          case 9:
            _context3.prev = 9;
            _context3.t0 = _context3['catch'](0);
            return _context3.abrupt('return', Promise.reject(_context3.t0));

          case 12:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, _this$1, [[0, 9]]);
  }));

  return function getByEmail(_x5, _x6) {
    return _ref3.apply(this, arguments);
  };
}();

var getByUtk = function () {
  var _ref4 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(utk, options) {
    var mergedProps, contact;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.prev = 0;

            requiresAuthentication(_baseOptions$1);
            mergedProps = Object.assign({}, defaults$2, _baseOptions$1, options);
            _context4.next = 5;
            return createRequest(constants.api.contacts.byUtk, { utk: utk }, mergedProps);

          case 5:
            contact = _context4.sent;
            return _context4.abrupt('return', Promise.resolve(contact));

          case 9:
            _context4.prev = 9;
            _context4.t0 = _context4['catch'](0);
            return _context4.abrupt('return', Promise.reject(_context4.t0));

          case 12:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, _this$1, [[0, 9]]);
  }));

  return function getByUtk(_x7, _x8) {
    return _ref4.apply(this, arguments);
  };
}();

// NOTE: Not recommended to use this, only for offline contacts.
var createOrUpdateContact = function () {
  var _ref5 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(obj) {
    var method, email, body;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.prev = 0;

            requiresAuthentication(_baseOptions$1);
            method = 'POST';
            email = obj.email;

            if (email) {
              _context5.next = 6;
              break;
            }

            throw new Error('Property "email" is required for creating contacts with this method.');

          case 6:
            body = {
              properties: Object.keys(obj).map(function (key) {
                return {
                  property: key,
                  value: obj[key]
                };
              })
            };
            _context5.next = 9;
            return createRequest(constants.api.contacts.createContact, { method: method, body: body, email: email }, _baseOptions$1);

          case 9:
            return _context5.abrupt('return', Promise.resolve({
              msg: 'Successfully updated contact details for ' + email
            }));

          case 12:
            _context5.prev = 12;
            _context5.t0 = _context5['catch'](0);
            return _context5.abrupt('return', Promise.reject(_context5.t0));

          case 15:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, _this$1, [[0, 12]]);
  }));

  return function createOrUpdateContact(_x9) {
    return _ref5.apply(this, arguments);
  };
}();

var updateContactByVid = function () {
  var _ref6 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(vid, properties) {
    var method, body;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.prev = 0;

            requiresAuthentication(_baseOptions$1);
            method = 'POST';

            if (vid) {
              _context6.next = 5;
              break;
            }

            throw new Error('`vid` is a required field');

          case 5:
            body = {
              properties: Object.keys(properties).map(function (key) {
                return {
                  property: key,
                  value: properties[key]
                };
              })
            };

            debug$1('updateContactByVid', JSON.stringify(body));

            _context6.next = 9;
            return createRequest(constants.api.contacts.byId, { method: method, body: body, vid: vid }, _baseOptions$1);

          case 9:
            return _context6.abrupt('return', {
              msg: 'Successfully updated contact details for ' + vid
            });

          case 12:
            _context6.prev = 12;
            _context6.t0 = _context6['catch'](0);
            return _context6.abrupt('return', Promise.reject(_context6.t0));

          case 15:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, _this$1, [[0, 12]]);
  }));

  return function updateContactByVid(_x10, _x11) {
    return _ref6.apply(this, arguments);
  };
}();

var batchUpdateContacts = function () {
  var _ref7 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(contactsToUpdate) {
    var method, body;
    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.prev = 0;

            requiresAuthentication(_baseOptions$1);
            method = 'POST';
            body = contactsToUpdate.map(function (contact) {
              var _ref8;

              var contactType = /@/i.test(contact.id) ? 'email' : 'vid';
              var properties = Object.keys(contact.updates).map(function (i) {
                return {
                  property: i,
                  value: contact.updates[i]
                };
              });
              return _ref8 = {}, defineProperty(_ref8, '' + contactType, contact.id), defineProperty(_ref8, 'properties', properties), _ref8;
            });
            _context7.next = 6;
            return createRequest(constants.api.contacts.batchUpdateContacts, { method: method, body: body }, _baseOptions$1);

          case 6:
            return _context7.abrupt('return', Promise.resolve({
              msg: 'Successfully updated contact properties'
            }));

          case 9:
            _context7.prev = 9;
            _context7.t0 = _context7['catch'](0);
            return _context7.abrupt('return', Promise.reject(_context7.t0));

          case 12:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, _this$1, [[0, 9]]);
  }));

  return function batchUpdateContacts(_x12) {
    return _ref7.apply(this, arguments);
  };
}();

var deleteContact = function () {
  var _ref9 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(vid) {
    var method;
    return regeneratorRuntime.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.prev = 0;

            requiresAuthentication(_baseOptions$1);
            method = 'DELETE';
            _context8.next = 5;
            return createRequest(constants.api.contacts.deleteById, { method: method, vid: vid }, _baseOptions$1);

          case 5:
            return _context8.abrupt('return', Promise.resolve({
              msg: 'Successfully delete contact details for ' + vid
            }));

          case 8:
            _context8.prev = 8;
            _context8.t0 = _context8['catch'](0);
            return _context8.abrupt('return', Promise.reject(_context8.t0));

          case 11:
          case 'end':
            return _context8.stop();
        }
      }
    }, _callee8, _this$1, [[0, 8]]);
  }));

  return function deleteContact(_x13) {
    return _ref9.apply(this, arguments);
  };
}();

var getContacts = function () {
  var _ref10 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(options) {
    var mergedProps, allContacts;
    return regeneratorRuntime.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            _context9.prev = 0;

            requiresAuthentication(_baseOptions$1);
            mergedProps = Object.assign({}, defaults$2, _baseOptions$1, options);
            _context9.next = 5;
            return createRequest(constants.api.contacts.getAll, {}, mergedProps);

          case 5:
            allContacts = _context9.sent;
            return _context9.abrupt('return', Promise.resolve(allContacts));

          case 9:
            _context9.prev = 9;
            _context9.t0 = _context9['catch'](0);
            return _context9.abrupt('return', Promise.reject(_context9.t0));

          case 12:
          case 'end':
            return _context9.stop();
        }
      }
    }, _callee9, _this$1, [[0, 9]]);
  }));

  return function getContacts(_x14) {
    return _ref10.apply(this, arguments);
  };
}();

var getRecentlyModified = function () {
  var _ref11 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(options) {
    var mergedProps, recentlyModifiedContacts;
    return regeneratorRuntime.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            _context10.prev = 0;

            requiresAuthentication(_baseOptions$1);
            mergedProps = Object.assign({}, defaults$2, _baseOptions$1, options);
            _context10.next = 5;
            return createRequest(constants.api.contacts.getRecentlyModified, {}, mergedProps);

          case 5:
            recentlyModifiedContacts = _context10.sent;
            return _context10.abrupt('return', Promise.resolve(recentlyModifiedContacts));

          case 9:
            _context10.prev = 9;
            _context10.t0 = _context10['catch'](0);
            return _context10.abrupt('return', Promise.reject(_context10.t0.message));

          case 12:
          case 'end':
            return _context10.stop();
        }
      }
    }, _callee10, _this$1, [[0, 9]]);
  }));

  return function getRecentlyModified(_x15) {
    return _ref11.apply(this, arguments);
  };
}();

var search = function () {
  var _ref12 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee11(q, options) {
    var mergedProps, searchResults;
    return regeneratorRuntime.wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            _context11.prev = 0;

            requiresAuthentication(_baseOptions$1);
            mergedProps = Object.assign({ q: q }, defaults$2, _baseOptions$1, options);
            _context11.next = 5;
            return createRequest(constants.api.contacts.search, {}, mergedProps);

          case 5:
            searchResults = _context11.sent;
            return _context11.abrupt('return', searchResults);

          case 9:
            _context11.prev = 9;
            _context11.t0 = _context11['catch'](0);
            return _context11.abrupt('return', null);

          case 12:
          case 'end':
            return _context11.stop();
        }
      }
    }, _callee11, _this$1, [[0, 9]]);
  }));

  return function search(_x16, _x17) {
    return _ref12.apply(this, arguments);
  };
}();

//
// const mergeContacts = async (primary, secondary) => {
//   // FIXME: Implement this
// };

function contacts(baseOptions) {
  _baseOptions$1 = baseOptions;
  // API
  return {
    /**
     * Get contact by ID
     * @async
     * @memberof hs/contacts
     * @method getById
     * @param {int} vid The vid of the contact to retrieve
     * @param {object} properties Optional extra properties to add to the request - see {@link https://developers.hubspot.com/docs/methods/contacts/get_contact|developer docs}
     * @example
     * const hs = new HubspotClient(props);
     * hs.contacts.getById(123412313).then(response => console.log(response))
     * @returns {Promise}
     */
    getById: getById,

    /**
     * Get contacts by IDs
     * @async
     * @memberof hs/contacts
     * @method getByIds
     * @param {array} vid The vids of the contacts to retrieve
     * @param {object} properties Optional extra properties to add to the request - see {@link https://developers.hubspot.com/docs/methods/contacts/get_contact|developer docs}
     * @example
     * const hs = new HubspotClient(props);
     * hs.contacts.getByIds([123412313, 156729313]).then(response => console.log(response))
     * @returns {Promise}
     */
    getByIds: getByIds,
    /**
     * Get contact by email
     * @async
     * @memberof hs/contacts
     * @method getByEmail
     * @param {string} email The email address of the contact
     * @param {object} properties Optional extra properties to add to the request - see {@link https://developers.hubspot.com/docs/methods/contacts/get_contact|developer docs}
     * @example
     * const hs = new HubspotClient(props);
     * hs.contacts.getByEmail('foo@bar.com').then(response => console.log(response))
     * @returns {Promise}
     */
    getByEmail: getByEmail,
    /**
     * Get contact by UTK (user token)
     * @async
     * @memberof hs/contacts
     * @method getByUtk
     * @param {string} utk The utk (User token) of the contact
     * @param {object} properties Optional extra properties to add to the request - see {@link https://developers.hubspot.com/docs/methods/contacts/get_contact|developer docs}
     * @example
     * const hs = new HubspotClient(props);
     * hs.contacts.getByUtk('jdalksjd82739jaskdksadjhkds').then(response => console.log(response))
     * @returns {Promise}
     */
    getByUtk: getByUtk,
    /**
     * Create or update a contact
     * @async
     * @memberof hs/contacts
     * @method createOrUpdateContact
     * @param {object} properties Key/value pair of properties to update. Note: `email` is a required key.
     * @example
     * const hs = new HubspotClient(props);
     * hs.contacts.createOrUpdateContact({
     *  email: 'foo@bar.com',
     *  first_name: 'Foo',
     *  last_name: 'Bar'
     * }).then(response => console.log(response));
     * @returns {Promise}
     */
    createOrUpdateContact: createOrUpdateContact,
    /**
     * Update contact properties, by VID
     * @async
     * @memberof hs/contacts
     * @method updateContactByVid
     * @param {number} vid VID of contact to update
     * @param {object} properties Key/value pair of properties to update.
     * @example
     * const hs = new HubspotClient(props);
     * hs.contacts.updateContactByVid(123456, {
     *  first_name: 'Foo',
     *  last_name: 'Bar'
     * }).then(response => console.log(response));
     * @returns {Promise}
     */
    updateContactByVid: updateContactByVid,
    /**
     * Batch update a set of contacts
     * @async
     * @memberof hs/contacts
     * @method batchUpdateContacts
     * @param {array} contactsToUpdate Array of contact updates, see example below
     * @example
     * const hs = new HubspotClient(props);
     * hs.contacts.batchUpdateContacts([{
         id: 129838129313,
         updates: {
           email: 'sdjfhksdjf@boo.com',
           phone_no: '9128301982312'
         }
       },
       {
         id: 2319082301823,
         updates: {
           email: 'skdjflkjsfdsfs@boo.com',
           phone_no: '1293801293801923'
         }
       },
       {
         id: 271263871623,
         updates: {
           email: 'mxcxmncvmxc@boo.com',
           phone_no: '01823981023'
         }
       },
       {
         id: 127361287312,
         updates: {
           email: 'yqeuyiqwuyeiquwey@boo.com',
           phone_no: '127398172398123'
         }
       }
       // .....
     ]).then(response => console.log(response))
     * @returns {Promise}
     */
    batchUpdateContacts: batchUpdateContacts,
    /**
     * Remove a contact
     * @async
     * @memberof hs/contacts
     * @method deleteContact
     * @param {number} id Id of contact to remove
     * @example
     * const hs = new HubspotClient(props);
     * hs.contacts.deleteContact(82739182731).then(response => console.log(response));
     * @returns {Promise}
     */
    deleteContact: deleteContact,
    /**
     * Get all contacts
     * @async
     * @memberof hs/contacts
     * @method getContacts
     * @param {object} options Additional options & filters to apply
     * @example
     * const hs = new HubspotClient(props);
     * hs.contacts.getContacts({ limit: 25 }).then(response => console.log(response));
     * @returns {Promise}
     */
    getContacts: getContacts,
    /**
     * Get recently modified contacts
     * @async
     * @memberof hs/contacts
     * @method getRecentlyModified
     * @param {object} options Additional options and paging criteria
     * @example
     * const hs = new HubspotClient(props);
     * hs.contacts.getRecentlyModified({count: 5}).then(response => console.log(response))
     * @property {number} [options.count] - Specifies the number of contacts to be returned.
     * @property {number} [options.timeOffset] - This is used along with `vidOffset` to get the next page of results. Each request will return a `time-offset` and `vid-offset` in the response, and you'd use those offsets in the URL of your next request to get the next page of results.
     * @property {number} [options.vidOffset] - This is used along with `timeOffset` to get the next page of results.
     * @returns {Promise}
     */
    getRecentlyModified: getRecentlyModified,
    /**
     * Search contacts
     * @async
     * @memberof hs/contacts
     * @method search
     * @param {string} q The search term (see https://developers.hubspot.com/docs/methods/contacts/search_contacts)
     * @param {object} options Additional options and paging criteria
     * @example
     * const hs = new HubspotClient(props);
     * const contacts = await hs.contacts.search('john', { count: 5 })
     * @property {number} [options.count] - Specifies the number of contacts to be returned.
     * @property {number} [options.offset] - This parameter is used to page through the results. Every call to this endpoint will return an offset value. This value is used in the offset= parameter of the next call to get the next page of contacts.
     * @property {array} [options.property] - The properties in the "contact" object in the returned data will only include the property or properties that you request.
     * @returns {Promise}
     */
    search: search
    // mergeContacts // Unimplemented
  };
}

var _this$2 = undefined;

var debug$2 = require('debug')('hubspot-api:tests'); // eslint-disable-line

var defaults$3 = {};
var _baseOptions$2 = void 0;

var getAllContactsProperties = function () {
  var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var mergedProps, _contactsProperties;

    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

            requiresAuthentication(_baseOptions$2);
            mergedProps = Object.assign({}, defaults$3, _baseOptions$2);
            _context.next = 5;
            return createRequest(constants.api.contactsProperties.getAllContactsProperties, {}, mergedProps);

          case 5:
            _contactsProperties = _context.sent;
            return _context.abrupt('return', Promise.resolve(_contactsProperties));

          case 9:
            _context.prev = 9;
            _context.t0 = _context['catch'](0);
            return _context.abrupt('return', Promise.reject(_context.t0));

          case 12:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this$2, [[0, 9]]);
  }));

  return function getAllContactsProperties() {
    return _ref.apply(this, arguments);
  };
}();

function contactsProperties(baseOptions) {
  _baseOptions$2 = baseOptions;
  // API
  return {
    /**
     * Get all contact properties
     * @async
     * @memberof hs/contactsProperties
     * @method getAllContactsProperties
     * @example
     * const hs = new HubspotClient(props);
     * hs.contactsProperties.getAllContactsProperties().then(response => console.log(response))
     * @returns {Promise}
     */
    getAllContactsProperties: getAllContactsProperties
  };
}

var _this$3 = undefined;

// NOTE: FULLY_IMPLEMENTED
// NOTE: REQUIRES_TESTS

var defaults$4 = {};
var _baseOptions$3 = void 0;

// await hs.company.create({ name: 'Hubspot', no_of_employees: 1000 })

var getAll = function () {
  var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var limit, offset, properties, propertiesWithHistory, allowedProps, mergedProps, allCompanies;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

            requiresAuthentication(_baseOptions$3);
            limit = opts.limit, offset = opts.offset, properties = opts.properties, propertiesWithHistory = opts.propertiesWithHistory;
            allowedProps = { limit: limit, offset: offset, properties: properties, propertiesWithHistory: propertiesWithHistory };
            mergedProps = Object.assign({}, defaults$4, _baseOptions$3, allowedProps);
            _context.next = 7;
            return createRequest(constants.api.company.getAll, {}, mergedProps);

          case 7:
            allCompanies = _context.sent;
            return _context.abrupt('return', Promise.resolve(allCompanies));

          case 11:
            _context.prev = 11;
            _context.t0 = _context['catch'](0);
            return _context.abrupt('return', Promise.reject(_context.t0.message));

          case 14:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this$3, [[0, 11]]);
  }));

  return function getAll() {
    return _ref.apply(this, arguments);
  };
}();

var create = function () {
  var _ref2 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(properties) {
    var method, body, response;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;

            requiresAuthentication(_baseOptions$3);
            method = 'POST';
            body = {
              properties: Object.keys(properties).map(function (key) {
                return {
                  name: key,
                  value: properties[key]
                };
              })
            };
            _context2.next = 6;
            return createRequest(constants.api.company.create, { method: method, body: body }, _baseOptions$3);

          case 6:
            response = _context2.sent;
            return _context2.abrupt('return', Promise.resolve(response));

          case 10:
            _context2.prev = 10;
            _context2.t0 = _context2['catch'](0);
            return _context2.abrupt('return', Promise.reject(_context2.t0.message));

          case 13:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, _this$3, [[0, 10]]);
  }));

  return function create(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

var update = function () {
  var _ref3 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(companyId, properties) {
    var method, body, response;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;

            requiresAuthentication(_baseOptions$3);

            if (companyId) {
              _context3.next = 4;
              break;
            }

            throw new Error('Field "companyId" is required.');

          case 4:
            method = 'PUT';
            body = {
              properties: Object.keys(properties).map(function (key) {
                return {
                  name: key,
                  value: properties[key]
                };
              })
            };
            _context3.next = 8;
            return createRequest(constants.api.company.byId, { method: method, body: body, companyId: companyId }, _baseOptions$3);

          case 8:
            response = _context3.sent;
            return _context3.abrupt('return', Promise.resolve(response));

          case 12:
            _context3.prev = 12;
            _context3.t0 = _context3['catch'](0);
            return _context3.abrupt('return', Promise.reject(_context3.t0.message));

          case 15:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, _this$3, [[0, 12]]);
  }));

  return function update(_x3, _x4) {
    return _ref3.apply(this, arguments);
  };
}();

var batchUpdate = function () {
  var _ref4 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(options) {
    var method, body;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.prev = 0;

            requiresAuthentication(_baseOptions$3);
            method = 'POST';
            body = options.map(function (option) {
              var properties = Object.keys(option.updates).map(function (i) {
                return {
                  name: i,
                  value: option.updates[i]
                };
              });
              return {
                objectId: option.id,
                properties: properties
              };
            });
            _context4.next = 6;
            return createRequest(constants.api.company.batchUpdate, { method: method, body: body }, _baseOptions$3);

          case 6:
            return _context4.abrupt('return', Promise.resolve({ msg: 'Successfully updated company properties' }));

          case 9:
            _context4.prev = 9;
            _context4.t0 = _context4['catch'](0);
            return _context4.abrupt('return', Promise.reject(_context4.t0));

          case 12:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, _this$3, [[0, 9]]);
  }));

  return function batchUpdate(_x5) {
    return _ref4.apply(this, arguments);
  };
}();

var deleteCompany = function () {
  var _ref5 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(companyId) {
    var method, response;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.prev = 0;

            requiresAuthentication(_baseOptions$3);
            method = 'DELETE';
            _context5.next = 5;
            return createRequest(constants.api.company.byId, { method: method, companyId: companyId }, _baseOptions$3);

          case 5:
            response = _context5.sent;
            return _context5.abrupt('return', Promise.resolve(response));

          case 9:
            _context5.prev = 9;
            _context5.t0 = _context5['catch'](0);
            return _context5.abrupt('return', Promise.reject(_context5.t0.message));

          case 12:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, _this$3, [[0, 9]]);
  }));

  return function deleteCompany(_x6) {
    return _ref5.apply(this, arguments);
  };
}();

var getRecentlyModified$1 = function () {
  var _ref6 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(props) {
    var method, passedProps, offset, count, mergedProps, companies;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.prev = 0;

            requiresAuthentication(_baseOptions$3);
            method = 'GET';
            passedProps = props || {};
            offset = passedProps.offset, count = passedProps.count;
            mergedProps = Object.assign({}, defaults$4, _baseOptions$3, {
              offset: offset,
              count: count
            });

            mergedProps = sanitizeObject(mergedProps);
            _context6.next = 9;
            return createRequest(constants.api.company.byId, { method: method, companyId: 'recent/modified' }, mergedProps);

          case 9:
            companies = _context6.sent;
            return _context6.abrupt('return', Promise.resolve(companies));

          case 13:
            _context6.prev = 13;
            _context6.t0 = _context6['catch'](0);
            return _context6.abrupt('return', Promise.reject(_context6.t0.message));

          case 16:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, _this$3, [[0, 13]]);
  }));

  return function getRecentlyModified(_x7) {
    return _ref6.apply(this, arguments);
  };
}();

var getRecentlyCreated = function () {
  var _ref7 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(props) {
    var method, passedProps, offset, count, mergedProps, companies;
    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.prev = 0;

            requiresAuthentication(_baseOptions$3);
            method = 'GET';
            passedProps = props || {};
            offset = passedProps.offset, count = passedProps.count;
            mergedProps = Object.assign({}, defaults$4, _baseOptions$3, {
              offset: offset,
              count: count
            });

            mergedProps = sanitizeObject(mergedProps);
            _context7.next = 9;
            return createRequest(constants.api.company.byId, { method: method, companyId: 'recent/created' }, mergedProps);

          case 9:
            companies = _context7.sent;
            return _context7.abrupt('return', Promise.resolve(companies));

          case 13:
            _context7.prev = 13;
            _context7.t0 = _context7['catch'](0);
            return _context7.abrupt('return', Promise.reject(_context7.t0.message));

          case 16:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, _this$3, [[0, 13]]);
  }));

  return function getRecentlyCreated(_x8) {
    return _ref7.apply(this, arguments);
  };
}();

var byId = function () {
  var _ref8 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(companyId) {
    var method, mergedProps, companies;
    return regeneratorRuntime.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.prev = 0;

            requiresAuthentication(_baseOptions$3);
            method = 'GET';
            mergedProps = Object.assign({}, defaults$4, _baseOptions$3, {});

            mergedProps = sanitizeObject(mergedProps);
            _context8.next = 7;
            return createRequest(constants.api.company.byId, { method: method, companyId: companyId }, mergedProps);

          case 7:
            companies = _context8.sent;
            return _context8.abrupt('return', Promise.resolve(companies));

          case 11:
            _context8.prev = 11;
            _context8.t0 = _context8['catch'](0);
            return _context8.abrupt('return', Promise.reject(_context8.t0.message));

          case 14:
          case 'end':
            return _context8.stop();
        }
      }
    }, _callee8, _this$3, [[0, 11]]);
  }));

  return function byId(_x9) {
    return _ref8.apply(this, arguments);
  };
}();

var getContacts$1 = function () {
  var _ref9 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(companyId) {
    var count = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 100;
    var vidOffset = arguments[2];
    var method, mergedProps, companies;
    return regeneratorRuntime.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            _context9.prev = 0;

            requiresAuthentication(_baseOptions$3);
            method = 'GET';
            mergedProps = Object.assign({}, defaults$4, _baseOptions$3, {
              count: count,
              vidOffset: vidOffset
            });


            mergedProps = sanitizeObject(mergedProps);
            _context9.next = 7;
            return createRequest(constants.api.company.contacts, { method: method, companyId: companyId }, mergedProps);

          case 7:
            companies = _context9.sent;
            return _context9.abrupt('return', Promise.resolve(companies));

          case 11:
            _context9.prev = 11;
            _context9.t0 = _context9['catch'](0);
            return _context9.abrupt('return', Promise.reject(_context9.t0.message));

          case 14:
          case 'end':
            return _context9.stop();
        }
      }
    }, _callee9, _this$3, [[0, 11]]);
  }));

  return function getContacts(_x10) {
    return _ref9.apply(this, arguments);
  };
}();

var byDomain = function () {
  var _ref10 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(domain, props) {
    var method, passedProps, limit, properties, offset, body, mergedProps, companies;
    return regeneratorRuntime.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            _context10.prev = 0;

            requiresAuthentication(_baseOptions$3);
            method = 'POST';
            passedProps = props || {};
            limit = passedProps.limit;
            properties = passedProps.properties, offset = passedProps.offset;

            if (!properties) {
              properties = ['domain', 'createdate', 'name', 'hs_lastmodifieddate'];
            }
            if (!offset) {
              offset = 0;
            }

            body = {
              limit: limit,
              requestOptions: { properties: properties },
              offset: {
                isPrimary: true,
                companyId: offset
              }
            };

            body = sanitizeObject(body);
            mergedProps = Object.assign({}, defaults$4, _baseOptions$3);

            mergedProps = sanitizeObject(mergedProps);
            // return Promise.resolve(JSON.stringify(body));
            _context10.next = 14;
            return createRequest(constants.api.company.byDomain, { method: method, domain: domain, body: body }, mergedProps);

          case 14:
            companies = _context10.sent;
            return _context10.abrupt('return', Promise.resolve(companies));

          case 18:
            _context10.prev = 18;
            _context10.t0 = _context10['catch'](0);
            return _context10.abrupt('return', Promise.reject(_context10.t0.message));

          case 21:
          case 'end':
            return _context10.stop();
        }
      }
    }, _callee10, _this$3, [[0, 18]]);
  }));

  return function byDomain(_x12, _x13) {
    return _ref10.apply(this, arguments);
  };
}();

function company(baseOptions) {
  _baseOptions$3 = baseOptions;

  return {
    /**
     * Create a company with properties - see {@link https://developers.hubspot.com/docs/methods/companies/create_company|developer docs} for an example of the properties object.
     * @async
     * @memberof hs/company
     * @method create
     * @param {object} companyProperties An object containing company properties in key/value format. At least 1 property is required
     * @example
     * const hs = new HubspotClient(props);
     * hs.company.create({ name: 'Foobar' }).then(response => console.log(response))
     * @returns {Promise}
     */
    create: create,
    /**
     * Update a company with properties - see {@link https://developers.hubspot.com/docs/methods/companies/create_company|developer docs} for an example of the properties object.
     * @async
     * @memberof hs/company
     * @method update
     * @param {number} companyId The ID of the company you wih to update
     * @param {object} companyProperties An object containing company properties in key/value format. At least 1 property is required
     * @example
     * const hs = new HubspotClient(props);
     * hs.company.update(companyId, companyProperties).then(response => console.log(response))
     * @returns {Promise}
     */
    update: update,
    /**
     * Update multiple companies with properties - see {@link https://developers.hubspot.com/docs/methods/companies/create_company|developer docs} for an example of the properties object.
     * @async
     * @memberof hs/company
     * @method batchUpdate
     * @param {array} updates Updates to be actioned (see example below)
     * @example
     * const hs = new HubspotClient(props);
     * const updates = [{
     *    id: 1234,
     *    updates: { name: 'Something else' }
     *  },
     * {
     *    id: 5678,
     *    updates: { name: 'Blah blah', ownerId: 12341231 }
     * }];
     * hs.company.batchUpdate(updates).then(response => console.log(response))
     * @returns {Promise}
     */
    batchUpdate: batchUpdate,
    /**
     * Delete company
     * @async
     * @memberof hs/company
     * @method delete
     * @param {number} companyId Id of company to delete
     * @example
     * const hs = new HubspotClient(props);
     * hs.company.delete(companyId).then(response => console.log(response));
     * @returns {Promise}
     */
    delete: deleteCompany,
    /**
     * Retrieve all companies (max 250 at a time)
     * @async
     * @memberof hs/company
     * @method getAll
     * @param {object} pagingProperties Paging criteria for the current request
     * @example
     * const hs = new HubspotClient(props);
     * hs.company.getAll(pagingProperties).then(response => console.log(response))
     * @property {number} [pagingProperties.limit] - The number of records to return. Defaults to 100, has a maximum value of 250.
     * @property {number} [pagingProperties.offset] - Used to page through the results. If there are more records in your portal than the limit= parameter, you will need to use the offset returned in the first request to get the next set of results.
     * @property {array} [pagingProperties.properties] - Used to include specific company properties in the results.  By default, the results will only include the company ID, and will not include the values for any properties for your companies. Including this parameter will include the data for the specified property in the results.
     * @property {array} [pagingProperties.propertiesWithHistory] - Works similarly to pagingProperties.properties, but this parameter will include the history for the specified property, instead of just including the current value. Use this parameter when you need the full history of changes to a property's value.
     * @returns {Promise}
     */
    getAll: getAll,
    /**
     * This endpoint will only return records modified in the last 30 days, or the 10k most recently modified records.
     * @async
     * @memberof hs/company
     * @method getRecentlyModified
     * @param {object} pagingProperties Paging criteria for the current request
     * @example
     * const hs = new HubspotClient(props);
     * hs.company.getRecentlyModified({count: 5}).then(response => console.log(response))
     * @property {number} [pagingProperties.count] - Specifies the number of companies to be returned.
     * @property {number} [pagingProperties.offset] - This is used to get the next page of results. Each request will return an offset in the response, and you'd use that offset in the URL of your next request to get the next page of results.
     * @returns {Promise}
     */
    getRecentlyModified: getRecentlyModified$1,
    /**
     * This endpoint will only return records created in the last 30 days, or the 10k most recently created records.
     * @async
     * @memberof hs/company
     * @method getRecentlyCreated
     * @param {object} pagingProperties Paging criteria for the current request
     * @example
     * const hs = new HubspotClient(props);
     * hs.company.getRecentlyCreated({count: 5}).then(response => console.log(response))
     * @property {number} [pagingProperties.count] - Specifies the number of companies to be returned.
     * @property {number} [pagingProperties.offset] - This is used to get the next page of results. Each request will return an offset in the response, and you'd use that offset in the URL of your next request to get the next page of results.
     * @returns {Promise}
     */
    getRecentlyCreated: getRecentlyCreated,
    /**
     * Search for companies by domain name.
     * @async
     * @memberof hs/company
     * @method byDomain
     * @param {string} domain Domain name to search for
     * @param {object} pagingProperties Paging & property criteria for the current request
     * @example
     * const hs = new HubspotClient(props);
     * hs.company.byDomain('www.hubspot.com', {limit: 5, properties: ['name', 'createdate']}).then(response => console.log(response))
     * @property {number} [pagingProperties.limit] - The number of records to return in a single request. Supports values up to 100.
     * @property {number} [pagingProperties.offset=0] - Each response will include a hasMore value and an offset object. If hasMore is true, then you would use the offset object in the next request to get the next set of results.
     * @property {array} [pagingProperties.properties=["domain", "createdate", "name", "hs_lastmodifieddate"]] - An array of properties that will be included for the returned companies. By default, no properties will be included in the response, so you must specify any properties that you want.
     * @returns {Promise}
     */
    byDomain: byDomain,
    /**
     * Search for companies by ID.
     * @async
     * @memberof hs/company
     * @method byId
     * @param {int} id VID of company to search for
     * @example
     * const hs = new HubspotClient(props);
     * const companyInfo = await hs.company.byId(1234);
     * @returns {Promise}
     */
    byId: byId,
    /**
     * Get contacts at a company
     * @async
     * @memberof hs/company
     * @method getContacts
     * @param {int} id VID of company
     * @example
     * const hs = new HubspotClient(props);
     * const companyInfo = await hs.company.getContacts(1234);
     * @returns {Promise}
     */
    getContacts: getContacts$1
  };
}

var _this$4 = undefined;

// NOTE: FULLY_IMPLEMENTED
// NOTE: REQUIRES_TESTS

var defaults$5 = {};
var _baseOptions$4 = void 0;

var events = function () {
  var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(_ref2) {
    var startDate = _ref2.startDate,
        endDate = _ref2.endDate,
        limit = _ref2.limit,
        contentCategory = _ref2.contentCategory,
        campaignGuid = _ref2.campaignGuid,
        includeNoCampaigns = _ref2.includeNoCampaigns,
        type = _ref2.type;
    var mergedProps, filteredEvents;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

            requiresAuthentication(_baseOptions$4);

            if (!(!startDate || !endDate)) {
              _context.next = 4;
              break;
            }

            throw new Error('Both "startDate" and "endDate" in ms are required fields');

          case 4:
            mergedProps = Object.assign({}, defaults$5, _baseOptions$4, {
              startDate: startDate,
              endDate: endDate,
              limit: limit,
              contentCategory: contentCategory,
              campaignGuid: campaignGuid,
              includeNoCampaigns: includeNoCampaigns
            });

            if (type) {
              Object.assign(mergedProps, { type: type });
            }
            _context.next = 8;
            return createRequest(constants.api.calendar.events, {}, mergedProps);

          case 8:
            filteredEvents = _context.sent;
            return _context.abrupt('return', Promise.resolve(filteredEvents));

          case 12:
            _context.prev = 12;
            _context.t0 = _context['catch'](0);
            return _context.abrupt('return', Promise.reject(_context.t0.message));

          case 15:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this$4, [[0, 12]]);
  }));

  return function events(_x) {
    return _ref.apply(this, arguments);
  };
}();

var getTask = function () {
  var _ref3 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(taskId) {
    var mergedProps, task;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;

            requiresAuthentication(_baseOptions$4);
            mergedProps = Object.assign({}, defaults$5, _baseOptions$4);
            _context2.next = 5;
            return createRequest(constants.api.calendar.taskById, { taskId: taskId }, mergedProps);

          case 5:
            task = _context2.sent;
            return _context2.abrupt('return', Promise.resolve(task));

          case 9:
            _context2.prev = 9;
            _context2.t0 = _context2['catch'](0);
            return _context2.abrupt('return', Promise.reject(_context2.t0.message));

          case 12:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, _this$4, [[0, 9]]);
  }));

  return function getTask(_x2) {
    return _ref3.apply(this, arguments);
  };
}();

var deleteTask = function () {
  var _ref4 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(taskId) {
    var mergedProps, method;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;

            requiresAuthentication(_baseOptions$4);
            mergedProps = Object.assign({}, defaults$5, _baseOptions$4);
            method = 'DELETE';
            _context3.next = 6;
            return createRequest(constants.api.calendar.taskById, { method: method, taskId: taskId }, mergedProps);

          case 6:
            return _context3.abrupt('return', Promise.resolve({ msg: 'Task ' + taskId + ' removed' }));

          case 9:
            _context3.prev = 9;
            _context3.t0 = _context3['catch'](0);
            return _context3.abrupt('return', Promise.reject(_context3.t0.message));

          case 12:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, _this$4, [[0, 9]]);
  }));

  return function deleteTask(_x3) {
    return _ref4.apply(this, arguments);
  };
}();

var updateTask = function () {
  var _ref5 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(taskId, _ref6) {
    var eventDate = _ref6.eventDate,
        eventType = _ref6.eventType,
        category = _ref6.category,
        state = _ref6.state,
        campaignGuid = _ref6.campaignGuid,
        topicIds = _ref6.topicIds,
        name = _ref6.name,
        description = _ref6.description,
        ownerId = _ref6.ownerId;
    var mergedProps, method, body, updatedTask;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.prev = 0;

            requiresAuthentication(_baseOptions$4);
            mergedProps = Object.assign({}, defaults$5, _baseOptions$4);
            method = 'PUT';
            body = {
              eventDate: eventDate,
              eventType: eventType,
              category: category,
              state: state,
              campaignGuid: campaignGuid,
              topicIds: topicIds,
              name: name,
              description: description,
              ownerId: ownerId
            };

            body = sanitizeObject(body);
            _context4.next = 8;
            return createRequest(constants.api.calendar.taskById, { body: body, method: method, taskId: taskId }, mergedProps);

          case 8:
            updatedTask = _context4.sent;
            return _context4.abrupt('return', Promise.resolve(updatedTask));

          case 12:
            _context4.prev = 12;
            _context4.t0 = _context4['catch'](0);
            return _context4.abrupt('return', Promise.reject(_context4.t0.message));

          case 15:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, _this$4, [[0, 12]]);
  }));

  return function updateTask(_x4, _x5) {
    return _ref5.apply(this, arguments);
  };
}();

var createTask = function () {
  var _ref7 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(_ref8) {
    var eventDate = _ref8.eventDate,
        eventType = _ref8.eventType,
        category = _ref8.category,
        state = _ref8.state,
        campaignGuid = _ref8.campaignGuid,
        contentGroupId = _ref8.contentGroupId,
        topicIds = _ref8.topicIds,
        templatePath = _ref8.templatePath,
        name = _ref8.name,
        description = _ref8.description,
        ownerId = _ref8.ownerId;
    var mergedProps, method, body, filteredEvents;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.prev = 0;

            requiresAuthentication(_baseOptions$4);
            mergedProps = Object.assign({}, defaults$5, _baseOptions$4);
            method = 'POST';
            body = {
              eventDate: eventDate,
              eventType: eventType,
              category: category,
              state: state,
              campaignGuid: campaignGuid,
              contentGroupId: contentGroupId,
              topicIds: topicIds,
              templatePath: templatePath,
              name: name,
              description: description,
              ownerId: ownerId
            };

            // Set defaults if not set.

            if (!state) {
              Object.assign(body, { state: 'TODO' });
            }
            if (!eventType) {
              Object.assign(body, { eventType: 'PUBLISHING_TASK' });
            }
            body = sanitizeObject(body);

            _context5.next = 10;
            return createRequest(constants.api.calendar.createTask, { body: body, method: method }, mergedProps);

          case 10:
            filteredEvents = _context5.sent;
            return _context5.abrupt('return', Promise.resolve(filteredEvents));

          case 14:
            _context5.prev = 14;
            _context5.t0 = _context5['catch'](0);
            return _context5.abrupt('return', Promise.reject(_context5.t0.message));

          case 17:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, _this$4, [[0, 14]]);
  }));

  return function createTask(_x6) {
    return _ref7.apply(this, arguments);
  };
}();

var contentEvents = function contentEvents(_ref9) {
  var startDate = _ref9.startDate,
      endDate = _ref9.endDate,
      limit = _ref9.limit,
      contentCategory = _ref9.contentCategory,
      campaignGuid = _ref9.campaignGuid,
      includeNoCampaigns = _ref9.includeNoCampaigns;
  return events({
    startDate: startDate,
    endDate: endDate,
    limit: limit,
    contentCategory: contentCategory,
    campaignGuid: campaignGuid,
    includeNoCampaigns: includeNoCampaigns,
    type: 'CONTENT'
  });
};

var socialEvents = function socialEvents(_ref10) {
  var startDate = _ref10.startDate,
      endDate = _ref10.endDate,
      limit = _ref10.limit,
      contentCategory = _ref10.contentCategory,
      campaignGuid = _ref10.campaignGuid,
      includeNoCampaigns = _ref10.includeNoCampaigns;
  return events({
    startDate: startDate,
    endDate: endDate,
    limit: limit,
    contentCategory: contentCategory,
    campaignGuid: campaignGuid,
    includeNoCampaigns: includeNoCampaigns,
    type: 'SOCIAL'
  });
};

var taskEvents = function taskEvents(_ref11) {
  var startDate = _ref11.startDate,
      endDate = _ref11.endDate,
      limit = _ref11.limit,
      contentCategory = _ref11.contentCategory,
      campaignGuid = _ref11.campaignGuid,
      includeNoCampaigns = _ref11.includeNoCampaigns;
  return events({
    startDate: startDate,
    endDate: endDate,
    limit: limit,
    contentCategory: contentCategory,
    campaignGuid: campaignGuid,
    includeNoCampaigns: includeNoCampaigns,
    type: 'PUBLISHING_TASK'
  });
};

function calendar(baseOptions) {
  _baseOptions$4 = baseOptions;

  return {
    /**
     * Retrieve all event types
     * @async
     * @memberof hs/calendar
     * @method events
     * @param {object} eventProperties An object containing event properties to search for
     * @example
     * const hs = new HubspotClient(props);
     * hs.calendar.events(eventProperties).then(response => console.log(response))
     * @property {number} eventProperties.startDate
     * @property {number} eventProperties.endDate
     * @property {number} [eventProperties.limit]
     * @returns {Promise}
     */
    events: events,
    /**
     * Retrieve all events of type 'content'
     * @async
     * @memberof hs/calendar
     * @method contentEvents
     * @param {object} eventProperties An object containing event properties to search for
     * @example
     * const hs = new HubspotClient(props);
     * hs.calendar.contentEvents(eventProperties).then(response => console.log(response))
     * @property {number} eventProperties.startDate
     * @property {number} eventProperties.endDate
     * @property {number} [eventProperties.limit]
     * @returns {Promise}
     */
    contentEvents: contentEvents,
    /**
     * Retrieve all events of type 'social'
     * @async
     * @memberof hs/calendar
     * @method socialEvents
     * @param {object} eventProperties An object containing event properties to search for
     * @example
     * const hs = new HubspotClient(props);
     * hs.calendar.socialEvents(eventProperties).then(response => console.log(response))
     * @property {number} eventProperties.startDate
     * @property {number} eventProperties.endDate
     * @property {number} [eventProperties.limit]
     * @returns {Promise}
     */
    socialEvents: socialEvents,
    /**
     * Retrieve all events of type 'task'
     * @async
     * @memberof hs/calendar
     * @method taskEvents
     * @param {object} eventProperties An object containing event properties to search for
     * @example
     * const hs = new HubspotClient(props);
     * hs.calendar.taskEvents(eventProperties).then(response => console.log(response))
     * @property {number} eventProperties.startDate
     * @property {number} eventProperties.endDate
     * @property {number} [eventProperties.limit]
     * @returns {Promise}
     */
    taskEvents: taskEvents,
    /**
     * Create new task
     * @async
     * @memberof hs/calendar
     * @method createTask
     * @param {object} taskProperties An object containing task properties to create
     * @example
     * const hs = new HubspotClient(props);
     * hs.calendar.createTask(taskProperties).then(response => console.log(response))
     * @property {number} taskProperties.eventDate
     * @property {number} [taskProperties.eventType=PUBLISHING_TASK]
     * @property {number} taskProperties.category
     * @property {number} [taskProperties.state=TODO]
     * @property {number} [taskProperties.campaignGuid]
     * @property {number} [taskProperties.contentGroupId] - Required if category=BLOG_POST
     * @property {number} [taskProperties.topicIds]
     * @property {number} [taskProperties.templatePath]
     * @property {number} [taskProperties.name]
     * @property {number} [taskProperties.description]
     * @property {number} [taskProperties.ownerId]
     * @returns {Promise}
     */
    createTask: createTask,
    /**
     * Get Task By ID
     * @async
     * @memberof hs/calendar
     * @method getTask
     * @param {number} taskId ID of task to retrieve
     * @example
     * const hs = new HubspotClient(props);
     * hs.calendar.getTask(taskId).then(response => console.log(response))
     * @returns {Promise}
     */
    getTask: getTask,
    /**
     * Update existing task
     * @async
     * @memberof hs/calendar
     * @method updateTask
     * @param {number} taskId ID of task to update
     * @param {object} taskProperties An object containing task properties to update
     * @example
     * const hs = new HubspotClient(props);
     * hs.calendar.updateTask(taskProperties).then(response => console.log(response))
     * @property {number} [taskProperties.eventDate]
     * @property {number} [taskProperties.eventType]
     * @property {number} [taskProperties.category]
     * @property {number} [taskProperties.state]
     * @property {number} [taskProperties.campaignGuid]
     * @property {number} [taskProperties.topicIds]
     * @property {number} [taskProperties.name]
     * @property {number} [taskProperties.description]
     * @property {number} [taskProperties.ownerId]
     * @returns {Promise}
     */
    updateTask: updateTask,
    /**
     * Delete Task By ID
     * @async
     * @memberof hs/calendar
     * @method deleteTask
     * @param {number} taskId ID of task to delete
     * @example
     * const hs = new HubspotClient(props);
     * hs.calendar.deleteTask(taskId).then(response => console.log(response))
     * @returns {Promise}
     */
    deleteTask: deleteTask
  };
}

var _this$5 = undefined;

var allowablePublishActions = ['schedule-publish', 'cancel-publish'];
var defaults$6 = {};
var _baseOptions$5 = void 0;

var getAllBlogs = function () {
  var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var name, limit, offset, created, deleted_at, additionalOpts, mergedProps, blogPosts;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

            requiresAuthentication(_baseOptions$5);
            name = opts.name, limit = opts.limit, offset = opts.offset, created = opts.created, deleted_at = opts.deleted_at;
            additionalOpts = {
              limit: limit,
              offset: offset
            };
            // Extract additional dynamic querystring params and values.

            additionalOpts = queryStringParamInterpolator({ name: name, created: created, deleted_at: deleted_at }, additionalOpts);

            mergedProps = Object.assign({}, defaults$6, _baseOptions$5, additionalOpts);
            _context.next = 8;
            return createRequest(constants.api.blog.getAll, {}, mergedProps);

          case 8:
            blogPosts = _context.sent;
            return _context.abrupt('return', Promise.resolve(blogPosts));

          case 12:
            _context.prev = 12;
            _context.t0 = _context['catch'](0);
            return _context.abrupt('return', Promise.reject(_context.t0.message));

          case 15:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this$5, [[0, 12]]);
  }));

  return function getAllBlogs() {
    return _ref.apply(this, arguments);
  };
}();

var createOrUpdateAuthor = function () {
  var _ref2 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var id, email, fullName, userId, username, bio, website, twitter, linkedin, facebook, googlePlus, avatar, mergedProps, method, body, url, options, author;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;

            requiresAuthentication(_baseOptions$5);
            id = opts.id, email = opts.email, fullName = opts.fullName, userId = opts.userId, username = opts.username, bio = opts.bio, website = opts.website, twitter = opts.twitter, linkedin = opts.linkedin, facebook = opts.facebook, googlePlus = opts.googlePlus, avatar = opts.avatar;
            mergedProps = Object.assign({}, defaults$6, _baseOptions$5);
            method = 'POST';
            body = {
              email: email,
              fullName: fullName,
              userId: userId,
              username: username,
              bio: bio,
              website: website,
              twitter: twitter,
              linkedin: linkedin,
              facebook: facebook,
              googlePlus: googlePlus,
              avatar: avatar
            };
            url = constants.api.blog.authors;
            options = { method: method, body: body };


            if (id) {
              method = 'PUT';
              url = constants.api.blog.authorById;
              Object.assign(options, { method: method, id: id });
            }

            _context2.next = 11;
            return createRequest(url, options, mergedProps);

          case 11:
            author = _context2.sent;
            return _context2.abrupt('return', Promise.resolve(author));

          case 15:
            _context2.prev = 15;
            _context2.t0 = _context2['catch'](0);
            return _context2.abrupt('return', Promise.reject(_context2.t0.message));

          case 18:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, _this$5, [[0, 15]]);
  }));

  return function createOrUpdateAuthor() {
    return _ref2.apply(this, arguments);
  };
}();

var getAuthors = function () {
  var _ref3 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var email, limit, offset, id, fullName, slug, created, updated, additionalOpts, mergedProps, authors;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;

            requiresAuthentication(_baseOptions$5);
            email = opts.email, limit = opts.limit, offset = opts.offset, id = opts.id, fullName = opts.fullName, slug = opts.slug, created = opts.created, updated = opts.updated;
            additionalOpts = {
              email: email,
              limit: limit,
              offset: offset
            };
            // Extract additional dynamic querystring params and values.

            additionalOpts = queryStringParamInterpolator({
              id: id,
              fullName: fullName,
              slug: slug,
              created: created,
              updated: updated
            }, additionalOpts);

            mergedProps = Object.assign({}, defaults$6, _baseOptions$5, additionalOpts);
            _context3.next = 8;
            return createRequest(constants.api.blog.authors, {}, mergedProps);

          case 8:
            authors = _context3.sent;
            return _context3.abrupt('return', Promise.resolve(authors));

          case 12:
            _context3.prev = 12;
            _context3.t0 = _context3['catch'](0);
            return _context3.abrupt('return', Promise.reject(_context3.t0.message));

          case 15:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, _this$5, [[0, 12]]);
  }));

  return function getAuthors() {
    return _ref3.apply(this, arguments);
  };
}();

var getAuthor = function () {
  var _ref4 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(id) {
    var mergedProps, author;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.prev = 0;

            requiresAuthentication(_baseOptions$5);
            mergedProps = Object.assign({}, defaults$6, _baseOptions$5);
            _context4.next = 5;
            return createRequest(constants.api.blog.authorById, { id: id }, mergedProps);

          case 5:
            author = _context4.sent;
            return _context4.abrupt('return', Promise.resolve(author));

          case 9:
            _context4.prev = 9;
            _context4.t0 = _context4['catch'](0);
            return _context4.abrupt('return', Promise.reject(_context4.t0.message));

          case 12:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, _this$5, [[0, 9]]);
  }));

  return function getAuthor(_x4) {
    return _ref4.apply(this, arguments);
  };
}();

var deleteAuthor = function () {
  var _ref5 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(id) {
    var mergedProps;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.prev = 0;

            requiresAuthentication(_baseOptions$5);
            mergedProps = Object.assign({}, defaults$6, _baseOptions$5);
            _context5.next = 5;
            return createRequest(constants.api.blog.authorById, { id: id, method: 'DELETE' }, mergedProps);

          case 5:
            return _context5.abrupt('return', Promise.resolve({ deleted: true }));

          case 8:
            _context5.prev = 8;
            _context5.t0 = _context5['catch'](0);
            return _context5.abrupt('return', Promise.reject(_context5.t0.message));

          case 11:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, _this$5, [[0, 8]]);
  }));

  return function deleteAuthor(_x5) {
    return _ref5.apply(this, arguments);
  };
}();

var searchAuthors = function () {
  var _ref6 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var order, limit, offset, q, active, _blog, mergedProps, authors;

    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.prev = 0;

            requiresAuthentication(_baseOptions$5);
            order = opts.order, limit = opts.limit, offset = opts.offset, q = opts.q, active = opts.active, _blog = opts.blog; //eslint-disable-line

            mergedProps = Object.assign({}, defaults$6, _baseOptions$5, {
              order: order,
              limit: limit,
              offset: offset,
              q: q,
              active: active,
              blog: _blog
            });
            _context6.next = 6;
            return createRequest(constants.api.blog.authorSearch, {}, mergedProps);

          case 6:
            authors = _context6.sent;
            return _context6.abrupt('return', Promise.resolve(authors));

          case 10:
            _context6.prev = 10;
            _context6.t0 = _context6['catch'](0);
            return _context6.abrupt('return', Promise.reject(_context6.t0.message));

          case 13:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, _this$5, [[0, 10]]);
  }));

  return function searchAuthors() {
    return _ref6.apply(this, arguments);
  };
}();

var getComments = function () {
  var _ref7 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var limit, offset, portalId, state, contentId, reverse, query, mergedProps, comments;
    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.prev = 0;

            requiresAuthentication(_baseOptions$5);
            limit = opts.limit, offset = opts.offset, portalId = opts.portalId, state = opts.state, contentId = opts.contentId, reverse = opts.reverse, query = opts.query;
            mergedProps = Object.assign({}, defaults$6, _baseOptions$5, {
              limit: limit,
              offset: offset,
              portalId: portalId,
              state: state,
              contentId: contentId,
              reverse: reverse,
              query: query
            });
            _context7.next = 6;
            return createRequest(constants.api.blog.comments, {}, mergedProps);

          case 6:
            comments = _context7.sent;
            return _context7.abrupt('return', Promise.resolve(comments));

          case 10:
            _context7.prev = 10;
            _context7.t0 = _context7['catch'](0);
            return _context7.abrupt('return', Promise.reject(_context7.t0.message));

          case 13:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, _this$5, [[0, 10]]);
  }));

  return function getComments() {
    return _ref7.apply(this, arguments);
  };
}();

var createComment = function () {
  var _ref8 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var comment, contentId, collectionId, contentAuthorEmail, contentAuthorName, contentPermalink, contentTitle, userEmail, userName, userUrl, method, body, mergedProps, comments;
    return regeneratorRuntime.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.prev = 0;

            requiresAuthentication(_baseOptions$5);
            comment = opts.comment, contentId = opts.contentId, collectionId = opts.collectionId, contentAuthorEmail = opts.contentAuthorEmail, contentAuthorName = opts.contentAuthorName, contentPermalink = opts.contentPermalink, contentTitle = opts.contentTitle, userEmail = opts.userEmail, userName = opts.userName, userUrl = opts.userUrl;
            method = 'POST';
            body = {
              comment: comment,
              contentId: contentId,
              collectionId: collectionId,
              contentAuthorEmail: contentAuthorEmail,
              contentAuthorName: contentAuthorName,
              contentPermalink: contentPermalink,
              contentTitle: contentTitle,
              userEmail: userEmail,
              userName: userName,
              userUrl: userUrl
            };
            mergedProps = Object.assign({}, defaults$6, _baseOptions$5);
            _context8.next = 8;
            return createRequest(constants.api.blog.comments, { method: method, body: body }, mergedProps);

          case 8:
            comments = _context8.sent;
            return _context8.abrupt('return', Promise.resolve(comments));

          case 12:
            _context8.prev = 12;
            _context8.t0 = _context8['catch'](0);
            return _context8.abrupt('return', Promise.reject(_context8.t0.message));

          case 15:
          case 'end':
            return _context8.stop();
        }
      }
    }, _callee8, _this$5, [[0, 12]]);
  }));

  return function createComment() {
    return _ref8.apply(this, arguments);
  };
}();

var getTopics = function () {
  var _ref9 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var id, name, created, slug, limit, offset, additionalOpts, mergedProps, topics;
    return regeneratorRuntime.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            _context9.prev = 0;

            requiresAuthentication(_baseOptions$5);
            id = opts.id, name = opts.name, created = opts.created, slug = opts.slug, limit = opts.limit, offset = opts.offset;
            additionalOpts = {
              limit: limit,
              offset: offset,
              slug: slug
            };
            // Extract additional dynamic querystring params and values.

            additionalOpts = queryStringParamInterpolator({ id: id, name: name, created: created }, additionalOpts);

            mergedProps = Object.assign({}, defaults$6, _baseOptions$5, additionalOpts);
            _context9.next = 8;
            return createRequest(constants.api.blog.topics, {}, mergedProps);

          case 8:
            topics = _context9.sent;
            return _context9.abrupt('return', Promise.resolve(topics));

          case 12:
            _context9.prev = 12;
            _context9.t0 = _context9['catch'](0);
            return _context9.abrupt('return', Promise.reject(_context9.t0.message));

          case 15:
          case 'end':
            return _context9.stop();
        }
      }
    }, _callee9, _this$5, [[0, 12]]);
  }));

  return function getTopics() {
    return _ref9.apply(this, arguments);
  };
}();

var getTopic = function () {
  var _ref10 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(id) {
    var mergedProps, topic;
    return regeneratorRuntime.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            _context10.prev = 0;

            requiresAuthentication(_baseOptions$5);
            mergedProps = Object.assign({}, defaults$6, _baseOptions$5);
            _context10.next = 5;
            return createRequest(constants.api.blog.topic, { id: id }, mergedProps);

          case 5:
            topic = _context10.sent;
            return _context10.abrupt('return', Promise.resolve(topic));

          case 9:
            _context10.prev = 9;
            _context10.t0 = _context10['catch'](0);
            return _context10.abrupt('return', Promise.reject(_context10.t0.message));

          case 12:
          case 'end':
            return _context10.stop();
        }
      }
    }, _callee10, _this$5, [[0, 9]]);
  }));

  return function getTopic(_x10) {
    return _ref10.apply(this, arguments);
  };
}();

var searchTopics = function () {
  var _ref11 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee11() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var id, name, created, slug, limit, offset, q, active, _blog2, additionalOpts, mergedProps, topics;

    return regeneratorRuntime.wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            _context11.prev = 0;

            requiresAuthentication(_baseOptions$5);
            id = opts.id, name = opts.name, created = opts.created, slug = opts.slug, limit = opts.limit, offset = opts.offset, q = opts.q, active = opts.active, _blog2 = opts.blog;
            additionalOpts = {
              limit: limit,
              offset: offset,
              slug: slug,
              q: q,
              active: active,
              blog: _blog2
            };
            // Extract additional dynamic querystring params and values.

            additionalOpts = queryStringParamInterpolator({ id: id, name: name, created: created }, additionalOpts);

            mergedProps = Object.assign({}, defaults$6, _baseOptions$5, additionalOpts);
            _context11.next = 8;
            return createRequest(constants.api.blog.topicSearch, {}, mergedProps);

          case 8:
            topics = _context11.sent;
            return _context11.abrupt('return', Promise.resolve(topics));

          case 12:
            _context11.prev = 12;
            _context11.t0 = _context11['catch'](0);
            return _context11.abrupt('return', Promise.reject(_context11.t0.message));

          case 15:
          case 'end':
            return _context11.stop();
        }
      }
    }, _callee11, _this$5, [[0, 12]]);
  }));

  return function searchTopics() {
    return _ref11.apply(this, arguments);
  };
}();

var createOrUpdateTopic = function () {
  var _ref12 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee12() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var mergedProps, id, name, description, body, method, url, options, update;
    return regeneratorRuntime.wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            _context12.prev = 0;

            requiresAuthentication(_baseOptions$5);
            mergedProps = Object.assign({}, defaults$6, _baseOptions$5);
            id = opts.id, name = opts.name, description = opts.description;
            body = {
              name: name,
              description: description
            };
            method = 'POST';
            url = constants.api.blog.topics;
            options = { method: method, body: body };

            if (id) {
              method = 'PUT';
              url = constants.api.blog.topic;
              Object.assign(options, { method: method, id: id });
            }

            _context12.next = 11;
            return createRequest(url, options, mergedProps);

          case 11:
            update = _context12.sent;
            return _context12.abrupt('return', Promise.resolve(update));

          case 15:
            _context12.prev = 15;
            _context12.t0 = _context12['catch'](0);
            return _context12.abrupt('return', Promise.reject(_context12.t0.message));

          case 18:
          case 'end':
            return _context12.stop();
        }
      }
    }, _callee12, _this$5, [[0, 15]]);
  }));

  return function createOrUpdateTopic() {
    return _ref12.apply(this, arguments);
  };
}();

var getComment = function () {
  var _ref13 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee13(id) {
    var mergedProps, comment;
    return regeneratorRuntime.wrap(function _callee13$(_context13) {
      while (1) {
        switch (_context13.prev = _context13.next) {
          case 0:
            _context13.prev = 0;

            requiresAuthentication(_baseOptions$5);
            mergedProps = Object.assign({}, defaults$6, _baseOptions$5);
            _context13.next = 5;
            return createRequest(constants.api.blog.commentById, { id: id }, mergedProps);

          case 5:
            comment = _context13.sent;
            return _context13.abrupt('return', Promise.resolve(comment));

          case 9:
            _context13.prev = 9;
            _context13.t0 = _context13['catch'](0);
            return _context13.abrupt('return', Promise.reject(_context13.t0.message));

          case 12:
          case 'end':
            return _context13.stop();
        }
      }
    }, _callee13, _this$5, [[0, 9]]);
  }));

  return function getComment(_x13) {
    return _ref13.apply(this, arguments);
  };
}();

var deleteComment = function () {
  var _ref14 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee14(id) {
    var mergedProps;
    return regeneratorRuntime.wrap(function _callee14$(_context14) {
      while (1) {
        switch (_context14.prev = _context14.next) {
          case 0:
            _context14.prev = 0;

            requiresAuthentication(_baseOptions$5);
            mergedProps = Object.assign({}, defaults$6, _baseOptions$5);
            _context14.next = 5;
            return createRequest(constants.api.blog.commentById, { id: id, method: 'DELETE' }, mergedProps);

          case 5:
            return _context14.abrupt('return', Promise.resolve({ deleted: true }));

          case 8:
            _context14.prev = 8;
            _context14.t0 = _context14['catch'](0);
            return _context14.abrupt('return', Promise.reject(_context14.t0.message));

          case 11:
          case 'end':
            return _context14.stop();
        }
      }
    }, _callee14, _this$5, [[0, 8]]);
  }));

  return function deleteComment(_x14) {
    return _ref14.apply(this, arguments);
  };
}();

var restoreDeletedComment = function () {
  var _ref15 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee15(id) {
    var mergedProps;
    return regeneratorRuntime.wrap(function _callee15$(_context15) {
      while (1) {
        switch (_context15.prev = _context15.next) {
          case 0:
            _context15.prev = 0;

            requiresAuthentication(_baseOptions$5);
            mergedProps = Object.assign({}, defaults$6, _baseOptions$5);
            _context15.next = 5;
            return createRequest(constants.api.blog.restoreDeletedComment, { id: id, method: 'POST' }, mergedProps);

          case 5:
            return _context15.abrupt('return', Promise.resolve({ restored: true }));

          case 8:
            _context15.prev = 8;
            _context15.t0 = _context15['catch'](0);
            return _context15.abrupt('return', Promise.reject(_context15.t0.message));

          case 11:
          case 'end':
            return _context15.stop();
        }
      }
    }, _callee15, _this$5, [[0, 8]]);
  }));

  return function restoreDeletedComment(_x15) {
    return _ref15.apply(this, arguments);
  };
}();

var getBlogById = function () {
  var _ref16 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee16(id) {
    var mergedProps, blogInfo;
    return regeneratorRuntime.wrap(function _callee16$(_context16) {
      while (1) {
        switch (_context16.prev = _context16.next) {
          case 0:
            _context16.prev = 0;

            requiresAuthentication(_baseOptions$5);
            mergedProps = Object.assign({}, defaults$6, _baseOptions$5);
            _context16.next = 5;
            return createRequest(constants.api.blog.byId, { id: id }, mergedProps);

          case 5:
            blogInfo = _context16.sent;
            return _context16.abrupt('return', Promise.resolve(blogInfo));

          case 9:
            _context16.prev = 9;
            _context16.t0 = _context16['catch'](0);
            return _context16.abrupt('return', Promise.reject(_context16.t0.message));

          case 12:
          case 'end':
            return _context16.stop();
        }
      }
    }, _callee16, _this$5, [[0, 9]]);
  }));

  return function getBlogById(_x16) {
    return _ref16.apply(this, arguments);
  };
}();

var getPosts = function () {
  var _ref17 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee17() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var limit, offset, archived, blog_author_id, campaign, content_group_id, slug, state, order_by, created, deleted_at, name, updated, additionalOpts, mergedProps, blogPosts;
    return regeneratorRuntime.wrap(function _callee17$(_context17) {
      while (1) {
        switch (_context17.prev = _context17.next) {
          case 0:
            _context17.prev = 0;

            requiresAuthentication(_baseOptions$5);
            limit = opts.limit, offset = opts.offset, archived = opts.archived, blog_author_id = opts.blog_author_id, campaign = opts.campaign, content_group_id = opts.content_group_id, slug = opts.slug, state = opts.state, order_by = opts.order_by, created = opts.created, deleted_at = opts.deleted_at, name = opts.name, updated = opts.updated;
            additionalOpts = {
              limit: limit,
              offset: offset,
              archived: archived,
              blog_author_id: blog_author_id,
              campaign: campaign,
              content_group_id: content_group_id,
              state: state,
              order_by: order_by
            };

            // Extract additional dynamic querystring params and values.

            additionalOpts = queryStringParamInterpolator({
              created: created,
              deleted_at: deleted_at,
              name: name,
              updated: updated,
              slug: slug
            }, additionalOpts);

            mergedProps = Object.assign({}, defaults$6, _baseOptions$5, additionalOpts);
            _context17.next = 8;
            return createRequest(constants.api.blog.posts, {}, mergedProps);

          case 8:
            blogPosts = _context17.sent;
            return _context17.abrupt('return', Promise.resolve(blogPosts));

          case 12:
            _context17.prev = 12;
            _context17.t0 = _context17['catch'](0);
            return _context17.abrupt('return', Promise.reject(_context17.t0.message));

          case 15:
          case 'end':
            return _context17.stop();
        }
      }
    }, _callee17, _this$5, [[0, 12]]);
  }));

  return function getPosts() {
    return _ref17.apply(this, arguments);
  };
}();

var getPostById = function () {
  var _ref18 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee18(id) {
    var mergedProps, blogPosts;
    return regeneratorRuntime.wrap(function _callee18$(_context18) {
      while (1) {
        switch (_context18.prev = _context18.next) {
          case 0:
            _context18.prev = 0;

            requiresAuthentication(_baseOptions$5);
            mergedProps = Object.assign({}, defaults$6, _baseOptions$5);
            _context18.next = 5;
            return createRequest(constants.api.blog.postById, { id: id }, mergedProps);

          case 5:
            blogPosts = _context18.sent;
            return _context18.abrupt('return', Promise.resolve(blogPosts));

          case 9:
            _context18.prev = 9;
            _context18.t0 = _context18['catch'](0);
            return _context18.abrupt('return', Promise.reject(_context18.t0.message));

          case 12:
          case 'end':
            return _context18.stop();
        }
      }
    }, _callee18, _this$5, [[0, 9]]);
  }));

  return function getPostById(_x18) {
    return _ref18.apply(this, arguments);
  };
}();

var deletePost = function () {
  var _ref19 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee19(id) {
    var mergedProps;
    return regeneratorRuntime.wrap(function _callee19$(_context19) {
      while (1) {
        switch (_context19.prev = _context19.next) {
          case 0:
            _context19.prev = 0;

            requiresAuthentication(_baseOptions$5);
            mergedProps = Object.assign({}, defaults$6, _baseOptions$5);
            _context19.next = 5;
            return createRequest(constants.api.blog.postById, { id: id, method: 'DELETE' }, mergedProps);

          case 5:
            return _context19.abrupt('return', Promise.resolve({ deleted: true }));

          case 8:
            _context19.prev = 8;
            _context19.t0 = _context19['catch'](0);
            return _context19.abrupt('return', Promise.reject(_context19.t0.message));

          case 11:
          case 'end':
            return _context19.stop();
        }
      }
    }, _callee19, _this$5, [[0, 8]]);
  }));

  return function deletePost(_x19) {
    return _ref19.apply(this, arguments);
  };
}();

var clonePost = function () {
  var _ref20 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee20() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var mergedProps, id, name, body, method;
    return regeneratorRuntime.wrap(function _callee20$(_context20) {
      while (1) {
        switch (_context20.prev = _context20.next) {
          case 0:
            _context20.prev = 0;

            requiresAuthentication(_baseOptions$5);
            mergedProps = Object.assign({}, defaults$6, _baseOptions$5);
            id = opts.id, name = opts.name;
            body = { name: name };
            method = 'POST';
            _context20.next = 8;
            return createRequest(constants.api.blog.clonePostById, { id: id, body: body, method: method }, mergedProps);

          case 8:
            return _context20.abrupt('return', Promise.resolve({ cloned: true }));

          case 11:
            _context20.prev = 11;
            _context20.t0 = _context20['catch'](0);
            return _context20.abrupt('return', Promise.reject(_context20.t0.message));

          case 14:
          case 'end':
            return _context20.stop();
        }
      }
    }, _callee20, _this$5, [[0, 11]]);
  }));

  return function clonePost() {
    return _ref20.apply(this, arguments);
  };
}();

var publishOrSchedulePost = function () {
  var _ref21 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee21(id, action) {
    var mergedProps, body, method;
    return regeneratorRuntime.wrap(function _callee21$(_context21) {
      while (1) {
        switch (_context21.prev = _context21.next) {
          case 0:
            _context21.prev = 0;

            requiresAuthentication(_baseOptions$5);
            mergedProps = Object.assign({}, defaults$6, _baseOptions$5);

            if (~allowablePublishActions.indexOf(action)) {
              _context21.next = 5;
              break;
            }

            throw new Error('Unrecognized publish action: ' + action);

          case 5:
            body = { action: action };
            method = 'POST';
            _context21.next = 9;
            return createRequest(constants.api.blog.publishOrSchedulePost, { id: id, body: body, method: method }, mergedProps);

          case 9:
            return _context21.abrupt('return', Promise.resolve({ scheduleChanged: true }));

          case 12:
            _context21.prev = 12;
            _context21.t0 = _context21['catch'](0);
            return _context21.abrupt('return', Promise.reject(_context21.t0.message));

          case 15:
          case 'end':
            return _context21.stop();
        }
      }
    }, _callee21, _this$5, [[0, 12]]);
  }));

  return function publishOrSchedulePost(_x21, _x22) {
    return _ref21.apply(this, arguments);
  };
}();

var deleteTopic = function () {
  var _ref22 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee22(id) {
    var mergedProps;
    return regeneratorRuntime.wrap(function _callee22$(_context22) {
      while (1) {
        switch (_context22.prev = _context22.next) {
          case 0:
            _context22.prev = 0;

            requiresAuthentication(_baseOptions$5);
            mergedProps = Object.assign({}, defaults$6, _baseOptions$5);
            _context22.next = 5;
            return createRequest(constants.api.blog.topic, { id: id, method: 'DELETE' }, mergedProps);

          case 5:
            return _context22.abrupt('return', Promise.resolve({ deleted: true }));

          case 8:
            _context22.prev = 8;
            _context22.t0 = _context22['catch'](0);
            return _context22.abrupt('return', Promise.reject(_context22.t0.message));

          case 11:
          case 'end':
            return _context22.stop();
        }
      }
    }, _callee22, _this$5, [[0, 8]]);
  }));

  return function deleteTopic(_x23) {
    return _ref22.apply(this, arguments);
  };
}();

var getPostAutosaveBuffer = function () {
  var _ref23 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee23(id) {
    var mergedProps, buffer;
    return regeneratorRuntime.wrap(function _callee23$(_context23) {
      while (1) {
        switch (_context23.prev = _context23.next) {
          case 0:
            _context23.prev = 0;

            requiresAuthentication(_baseOptions$5);
            mergedProps = Object.assign({}, defaults$6, _baseOptions$5);
            _context23.next = 5;
            return createRequest(constants.api.blog.postAutoSaveBuffer, { id: id }, mergedProps);

          case 5:
            buffer = _context23.sent;
            return _context23.abrupt('return', Promise.resolve(buffer));

          case 9:
            _context23.prev = 9;
            _context23.t0 = _context23['catch'](0);
            return _context23.abrupt('return', Promise.reject(_context23.t0.message));

          case 12:
          case 'end':
            return _context23.stop();
        }
      }
    }, _callee23, _this$5, [[0, 9]]);
  }));

  return function getPostAutosaveBuffer(_x24) {
    return _ref23.apply(this, arguments);
  };
}();

var getPostAutosaveBufferStatus = function () {
  var _ref24 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee24(id) {
    var mergedProps, bufferStatus;
    return regeneratorRuntime.wrap(function _callee24$(_context24) {
      while (1) {
        switch (_context24.prev = _context24.next) {
          case 0:
            _context24.prev = 0;

            requiresAuthentication(_baseOptions$5);
            mergedProps = Object.assign({}, defaults$6, _baseOptions$5);
            _context24.next = 5;
            return createRequest(constants.api.blog.postAutoSaveBufferStatus, { id: id }, mergedProps);

          case 5:
            bufferStatus = _context24.sent;
            return _context24.abrupt('return', Promise.resolve(bufferStatus));

          case 9:
            _context24.prev = 9;
            _context24.t0 = _context24['catch'](0);
            return _context24.abrupt('return', Promise.reject(_context24.t0.message));

          case 12:
          case 'end':
            return _context24.stop();
        }
      }
    }, _callee24, _this$5, [[0, 9]]);
  }));

  return function getPostAutosaveBufferStatus(_x25) {
    return _ref24.apply(this, arguments);
  };
}();

var getPostVersions = function () {
  var _ref25 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee25(id) {
    var mergedProps, versions;
    return regeneratorRuntime.wrap(function _callee25$(_context25) {
      while (1) {
        switch (_context25.prev = _context25.next) {
          case 0:
            _context25.prev = 0;

            requiresAuthentication(_baseOptions$5);
            mergedProps = Object.assign({}, defaults$6, _baseOptions$5);
            _context25.next = 5;
            return createRequest(constants.api.blog.postVersions, { id: id }, mergedProps);

          case 5:
            versions = _context25.sent;
            return _context25.abrupt('return', Promise.resolve(versions));

          case 9:
            _context25.prev = 9;
            _context25.t0 = _context25['catch'](0);
            return _context25.abrupt('return', Promise.reject(_context25.t0.message));

          case 12:
          case 'end':
            return _context25.stop();
        }
      }
    }, _callee25, _this$5, [[0, 9]]);
  }));

  return function getPostVersions(_x26) {
    return _ref25.apply(this, arguments);
  };
}();

var getPostVersionById = function () {
  var _ref26 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee26(id, version_id) {
    var mergedProps, version;
    return regeneratorRuntime.wrap(function _callee26$(_context26) {
      while (1) {
        switch (_context26.prev = _context26.next) {
          case 0:
            _context26.prev = 0;

            requiresAuthentication(_baseOptions$5);
            mergedProps = Object.assign({}, defaults$6, _baseOptions$5);
            _context26.next = 5;
            return createRequest(constants.api.blog.postVersions, { id: id, version_id: version_id }, mergedProps);

          case 5:
            version = _context26.sent;
            return _context26.abrupt('return', Promise.resolve(version));

          case 9:
            _context26.prev = 9;
            _context26.t0 = _context26['catch'](0);
            return _context26.abrupt('return', Promise.reject(_context26.t0.message));

          case 12:
          case 'end':
            return _context26.stop();
        }
      }
    }, _callee26, _this$5, [[0, 9]]);
  }));

  return function getPostVersionById(_x27, _x28) {
    return _ref26.apply(this, arguments);
  };
}();

var restorePostVersionById = function () {
  var _ref27 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee27(id, version_id) {
    var mergedProps, body, method, version;
    return regeneratorRuntime.wrap(function _callee27$(_context27) {
      while (1) {
        switch (_context27.prev = _context27.next) {
          case 0:
            _context27.prev = 0;

            requiresAuthentication(_baseOptions$5);
            mergedProps = Object.assign({}, defaults$6, _baseOptions$5);
            body = { version_id: version_id };
            method = 'POST';
            _context27.next = 7;
            return createRequest(constants.api.blog.postVersions, { id: id, body: body, method: method }, mergedProps);

          case 7:
            version = _context27.sent;
            return _context27.abrupt('return', Promise.resolve(version));

          case 11:
            _context27.prev = 11;
            _context27.t0 = _context27['catch'](0);
            return _context27.abrupt('return', Promise.reject(_context27.t0.message));

          case 14:
          case 'end':
            return _context27.stop();
        }
      }
    }, _callee27, _this$5, [[0, 11]]);
  }));

  return function restorePostVersionById(_x29, _x30) {
    return _ref27.apply(this, arguments);
  };
}();

var validatePostAutosaveBufferStatus = function () {
  var _ref28 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee28(id) {
    var mergedProps, bufferStatus;
    return regeneratorRuntime.wrap(function _callee28$(_context28) {
      while (1) {
        switch (_context28.prev = _context28.next) {
          case 0:
            _context28.prev = 0;

            requiresAuthentication(_baseOptions$5);
            mergedProps = Object.assign({}, defaults$6, _baseOptions$5);
            _context28.next = 5;
            return createRequest(constants.api.blog.validatePostAutoSaveBuffer, { id: id, method: 'POST' }, mergedProps);

          case 5:
            bufferStatus = _context28.sent;
            return _context28.abrupt('return', Promise.resolve(bufferStatus));

          case 9:
            _context28.prev = 9;
            _context28.t0 = _context28['catch'](0);
            return _context28.abrupt('return', Promise.reject(_context28.t0.message));

          case 12:
          case 'end':
            return _context28.stop();
        }
      }
    }, _callee28, _this$5, [[0, 9]]);
  }));

  return function validatePostAutosaveBufferStatus(_x31) {
    return _ref28.apply(this, arguments);
  };
}();

var restoredDeletedPost = function () {
  var _ref29 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee29(id) {
    var mergedProps, postStatus;
    return regeneratorRuntime.wrap(function _callee29$(_context29) {
      while (1) {
        switch (_context29.prev = _context29.next) {
          case 0:
            _context29.prev = 0;

            requiresAuthentication(_baseOptions$5);
            mergedProps = Object.assign({}, defaults$6, _baseOptions$5);
            _context29.next = 5;
            return createRequest(constants.api.blog.restorePostById, { id: id, method: 'POST' }, mergedProps);

          case 5:
            postStatus = _context29.sent;
            return _context29.abrupt('return', Promise.resolve(postStatus));

          case 9:
            _context29.prev = 9;
            _context29.t0 = _context29['catch'](0);
            return _context29.abrupt('return', Promise.reject(_context29.t0.message));

          case 12:
          case 'end':
            return _context29.stop();
        }
      }
    }, _callee29, _this$5, [[0, 9]]);
  }));

  return function restoredDeletedPost(_x32) {
    return _ref29.apply(this, arguments);
  };
}();

var pushPostAutosaveBufferLive = function () {
  var _ref30 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee30(id) {
    var mergedProps, bufferStatus;
    return regeneratorRuntime.wrap(function _callee30$(_context30) {
      while (1) {
        switch (_context30.prev = _context30.next) {
          case 0:
            _context30.prev = 0;

            requiresAuthentication(_baseOptions$5);
            mergedProps = Object.assign({}, defaults$6, _baseOptions$5);
            _context30.next = 5;
            return createRequest(constants.api.blog.pushPostAutosaveBufferToLive, { id: id, method: 'POST' }, mergedProps);

          case 5:
            bufferStatus = _context30.sent;
            return _context30.abrupt('return', Promise.resolve(bufferStatus));

          case 9:
            _context30.prev = 9;
            _context30.t0 = _context30['catch'](0);
            return _context30.abrupt('return', Promise.reject(_context30.t0.message));

          case 12:
          case 'end':
            return _context30.stop();
        }
      }
    }, _callee30, _this$5, [[0, 9]]);
  }));

  return function pushPostAutosaveBufferLive(_x33) {
    return _ref30.apply(this, arguments);
  };
}();

var updateAutosaveBuffer = function () {
  var _ref31 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee31() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var id, blog_author_id, campaign, campaign_name, content_group_id, featured_image, footer_html, head_html, keywords, meta_description, name, post_body, post_summary, publish_date, publish_immediately, slug, topic_ids, use_featured_image, widgets, mergedProps, body, method, buffer;
    return regeneratorRuntime.wrap(function _callee31$(_context31) {
      while (1) {
        switch (_context31.prev = _context31.next) {
          case 0:
            _context31.prev = 0;

            requiresAuthentication(_baseOptions$5);
            id = opts.id, blog_author_id = opts.blog_author_id, campaign = opts.campaign, campaign_name = opts.campaign_name, content_group_id = opts.content_group_id, featured_image = opts.featured_image, footer_html = opts.footer_html, head_html = opts.head_html, keywords = opts.keywords, meta_description = opts.meta_description, name = opts.name, post_body = opts.post_body, post_summary = opts.post_summary, publish_date = opts.publish_date, publish_immediately = opts.publish_immediately, slug = opts.slug, topic_ids = opts.topic_ids, use_featured_image = opts.use_featured_image, widgets = opts.widgets;

            if (id) {
              _context31.next = 5;
              break;
            }

            throw new Error('No post ID specified');

          case 5:
            mergedProps = Object.assign({}, defaults$6, _baseOptions$5);
            body = {
              blog_author_id: blog_author_id,
              campaign: campaign,
              campaign_name: campaign_name,
              content_group_id: content_group_id,
              featured_image: featured_image,
              footer_html: footer_html,
              head_html: head_html,
              keywords: keywords,
              meta_description: meta_description,
              name: name,
              post_body: post_body,
              post_summary: post_summary,
              publish_date: publish_date,
              publish_immediately: publish_immediately,
              slug: slug,
              topic_ids: topic_ids,
              use_featured_image: use_featured_image,
              widgets: widgets
            };
            method = 'PUT';
            _context31.next = 10;
            return createRequest(constants.api.blog.postAutoSaveBuffer, { id: id, method: method, body: body }, mergedProps);

          case 10:
            buffer = _context31.sent;
            return _context31.abrupt('return', Promise.resolve(buffer));

          case 14:
            _context31.prev = 14;
            _context31.t0 = _context31['catch'](0);
            return _context31.abrupt('return', Promise.reject(_context31.t0.message));

          case 17:
          case 'end':
            return _context31.stop();
        }
      }
    }, _callee31, _this$5, [[0, 14]]);
  }));

  return function updateAutosaveBuffer() {
    return _ref31.apply(this, arguments);
  };
}();

var createOrUpdatePost = function () {
  var _ref32 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee32() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var mergedProps, id, blog_author_id, campaign, campaign_name, content_group_id, featured_image, footer_html, head_html, keywords, meta_description, name, post_body, post_summary, publish_date, publish_immediately, slug, topic_ids, use_featured_image, widgets, body, method, url, options, update;
    return regeneratorRuntime.wrap(function _callee32$(_context32) {
      while (1) {
        switch (_context32.prev = _context32.next) {
          case 0:
            _context32.prev = 0;

            requiresAuthentication(_baseOptions$5);
            mergedProps = Object.assign({}, defaults$6, _baseOptions$5);
            id = opts.id, blog_author_id = opts.blog_author_id, campaign = opts.campaign, campaign_name = opts.campaign_name, content_group_id = opts.content_group_id, featured_image = opts.featured_image, footer_html = opts.footer_html, head_html = opts.head_html, keywords = opts.keywords, meta_description = opts.meta_description, name = opts.name, post_body = opts.post_body, post_summary = opts.post_summary, publish_date = opts.publish_date, publish_immediately = opts.publish_immediately, slug = opts.slug, topic_ids = opts.topic_ids, use_featured_image = opts.use_featured_image, widgets = opts.widgets;
            body = {
              blog_author_id: blog_author_id,
              campaign: campaign,
              campaign_name: campaign_name,
              content_group_id: content_group_id,
              featured_image: featured_image,
              footer_html: footer_html,
              head_html: head_html,
              keywords: keywords,
              meta_description: meta_description,
              name: name,
              post_body: post_body,
              post_summary: post_summary,
              publish_date: publish_date,
              publish_immediately: publish_immediately,
              slug: slug,
              topic_ids: topic_ids,
              use_featured_image: use_featured_image,
              widgets: widgets
            };
            method = 'POST';
            url = constants.api.blog.posts;
            options = { method: method, body: body };

            if (id) {
              method = 'PUT';
              url = constants.api.blog.postById;
              Object.assign(options, { method: method, id: id });
            }

            _context32.next = 11;
            return createRequest(url, options, mergedProps);

          case 11:
            update = _context32.sent;
            return _context32.abrupt('return', Promise.resolve(update));

          case 15:
            _context32.prev = 15;
            _context32.t0 = _context32['catch'](0);
            return _context32.abrupt('return', Promise.reject(_context32.t0.message));

          case 18:
          case 'end':
            return _context32.stop();
        }
      }
    }, _callee32, _this$5, [[0, 15]]);
  }));

  return function createOrUpdatePost() {
    return _ref32.apply(this, arguments);
  };
}();

var groupTopics = function () {
  var _ref33 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee33() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var mergedProps, groupedTopicName, topicIds, body, method, update;
    return regeneratorRuntime.wrap(function _callee33$(_context33) {
      while (1) {
        switch (_context33.prev = _context33.next) {
          case 0:
            _context33.prev = 0;

            requiresAuthentication(_baseOptions$5);
            mergedProps = Object.assign({}, defaults$6, _baseOptions$5);
            groupedTopicName = opts.groupedTopicName, topicIds = opts.topicIds;
            body = {
              groupedTopicName: groupedTopicName,
              topicIds: topicIds
            };
            method = 'POST';
            _context33.next = 8;
            return createRequest(constants.api.blog.groupTopics, { method: method, body: body }, mergedProps);

          case 8:
            update = _context33.sent;
            return _context33.abrupt('return', Promise.resolve(update));

          case 12:
            _context33.prev = 12;
            _context33.t0 = _context33['catch'](0);
            return _context33.abrupt('return', Promise.reject(_context33.t0.message));

          case 15:
          case 'end':
            return _context33.stop();
        }
      }
    }, _callee33, _this$5, [[0, 12]]);
  }));

  return function groupTopics() {
    return _ref33.apply(this, arguments);
  };
}();

function blog(baseOptions) {
  _baseOptions$5 = baseOptions;

  return {
    /**
     * Merge multiple topics by ID into a single topic group.
     * @async
     * @memberof hs/blog
     * @method groupTopics
     * @param {object} opts
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.groupTopics(opts).then(response => console.log(response))
     * @property {string} opts.groupedTopicName
     * @property {array<int>} opts.topicIds
     * @returns {Promise}
     */
    groupTopics: groupTopics,
    /**
     * Create a new comment.
     * @async
     * @memberof hs/blog
     * @method createComment
     * @param {object} opts
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.createComment(opts).then(response => console.log(response))
     * @property {string} opts.comment
     * @property {int} opts.contentId
     * @property {int} opts.collectionId
     * @property {string} opts.contentAuthorEmail
     * @property {string} opts.contentAuthorName
     * @property {string} opts.contentPermalink
     * @property {string} opts.contentTitle
     * @property {string} opts.userEmail
     * @property {string} opts.userName
     * @property {string} opts.userUrl
     * @returns {Promise}
     */
    createComment: createComment,
    /**
     * Create or update a blog post.
     * @async
     * @memberof hs/blog
     * @method createOrUpdatePost
     * @param {object} opts
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.createOrUpdatePost(opts).then(response => console.log(response))
     * @property {int} opts.id
     * @property {int} opts.blog_author_id
     * @property {string} opts.campaign
     * @property {string} opts.campaign_name
     * @property {int} opts.content_group_id
     * @property {string} opts.featured_image
     * @property {string} opts.footer_html
     * @property {string} opts.head_html
     * @property {string} opts.keywords
     * @property {string} opts.meta_description
     * @property {string} opts.name
     * @property {string} opts.post_body
     * @property {string} opts.post_summary
     * @property {int} opts.publish_date
     * @property {boolean} opts.publish_immediately
     * @property {string} opts.slug
     * @property {array} opts.topic_ids
     * @property {boolean} opts.use_featured_image
     * @property {string} opts.widgets
     * @returns {Promise}
     */
    createOrUpdatePost: createOrUpdatePost,
    /**
     * Restore a deleted comment
     * @async
     * @memberof hs/blog
     * @method restoreDeletedComment
     * @param {int} id
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.restoreDeletedComment(opts).then(response => console.log(response))
     * @returns {Promise}
     */
    restoreDeletedComment: restoreDeletedComment,
    /**
     * Create or update a blog author info.
     * @async
     * @memberof hs/blog
     * @method createOrUpdateAuthor
     * @param {object} opts
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.createOrUpdateAuthor(opts).then(response => console.log(response))
     * @property {int} opts.id
     * @property {string} opts.email
     * @property {string} opts.fullName
     * @property {string} opts.userId
     * @property {string} opts.username
     * @property {string} opts.bio
     * @property {string} opts.website
     * @property {string} opts.twitter
     * @property {string} opts.linkedin
     * @property {string} opts.facebook
     * @property {string} opts.googlePlus
     * @property {string} opts.avatar
     * @returns {Promise}
     */
    createOrUpdateAuthor: createOrUpdateAuthor,
    /**
     * Create or update a blog topic.
     * @async
     * @memberof hs/blog
     * @method createOrUpdateTopic
     * @param {object} opts
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.createOrUpdateTopic(opts).then(response => console.log(response))
     * @property {int} opts.id
     * @property {string} opts.name
     * @property {string} opts.description
     * @returns {Promise}
     */
    createOrUpdateTopic: createOrUpdateTopic,
    /**
     * Clones a blog post
     * @async
     * @memberof hs/blog
     * @method clonePost
     * @param {object} opts
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.clonePost(opts).then(response => console.log(response))
     * @property {int} opts.id
     * @property {string} opts.name
     * @returns {Promise}
     */
    clonePost: clonePost,
    /**
     * Remove a blog author
     * @async
     * @memberof hs/blog
     * @method deleteAuthor
     * @param {int} id
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.deleteAuthor(id).then(response => console.log(response))
     * @returns {Promise}
     */
    deleteAuthor: deleteAuthor,
    /**
     * Remove a blog comment
     * @async
     * @memberof hs/blog
     * @method deleteComment
     * @param {int} id
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.deleteComment(id).then(response => console.log(response))
     * @returns {Promise}
     */
    deleteComment: deleteComment,
    /**
     * Remove a blog post
     * @async
     * @memberof hs/blog
     * @method deletePost
     * @param {int} id
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.deletePost(id).then(response => console.log(response))
     * @returns {Promise}
     */
    deletePost: deletePost,
    /**
     * Remove a blog topic
     * @async
     * @memberof hs/blog
     * @method deleteTopic
     * @param {int} id
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.deleteTopic(id).then(response => console.log(response))
     * @returns {Promise}
     */
    deleteTopic: deleteTopic,
    /**
     * Retrieve blog author details
     * @async
     * @memberof hs/blog
     * @method getAuthor
     * @param {int} id
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.getAuthor(id).then(response => console.log(response))
     * @returns {Promise}
     */
    getAuthor: getAuthor,
    /**
     * Retrieve all blog authors
     * @async
     * @memberof hs/blog
     * @method getAuthors
     * @param {object} opts
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.getAuthors(id).then(response => console.log(response))
     * @property {string} opts.email
     * @property {int} opts.limit
     * @property {int} opts.offset
     * @property {int} opts.id
     * @property {string} opts.fullName
     * @property {string} opts.slug
     * @property {int} opts.created
     * @property {int} opts.updated
     * @returns {Promise}
     */
    getAuthors: getAuthors,
    /**
     * Retrieve blog info for specific blog
     * @async
     * @memberof hs/blog
     * @method getBlogById
     * @param {int} id
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.getBlogById(id).then(response => console.log(response))
     * @returns {Promise}
     */
    getBlogById: getBlogById,
    /**
     * Retrieve blog topic info
     * @async
     * @memberof hs/blog
     * @method getTopic
     * @param {int} id
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.getTopic(id).then(response => console.log(response))
     * @returns {Promise}
     */
    getTopic: getTopic,
    /**
     * Retrieve blog topic info
     * @async
     * @memberof hs/blog
     * @method getTopics
     * @param {object} opts
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.getTopics(opts).then(response => console.log(response))
     * @property {int} opts.id
     * @property {string} opts.name
     * @property {int} opts.created
     * @property {string} opts.slug
     * @property {int} opts.limit
     * @property {int} opts.offset
     * @returns {Promise}
     */
    getTopics: getTopics,
    /**
     * Retrieve blog post info by ID
     * @async
     * @memberof hs/blog
     * @method getPostById
     * @param {int} id
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.getPostById(id).then(response => console.log(response))
     * @returns {Promise}
     */
    getPostById: getPostById,
    /**
     * Retrieve blog post versions by post ID
     * @async
     * @memberof hs/blog
     * @method getPostVersions
     * @param {int} postId
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.getPostVersions(postId).then(response => console.log(response))
     * @returns {Promise}
     */
    getPostVersions: getPostVersions,
    /**
     * Retrieve blog post version
     * @async
     * @memberof hs/blog
     * @method getPostVersionById
     * @param {int} versionId
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.getPostVersionById(versionId).then(response => console.log(response))
     * @returns {Promise}
     */
    getPostVersionById: getPostVersionById,
    /**
     * Retrieve blog post autosave buffer contents
     * @async
     * @memberof hs/blog
     * @method getPostAutosaveBuffer
     * @param {int} postId
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.getPostAutosaveBuffer(postId).then(response => console.log(response))
     * @returns {Promise}
     */
    getPostAutosaveBuffer: getPostAutosaveBuffer,
    /**
     * Retrieve blog post autosave buffer status
     * @async
     * @memberof hs/blog
     * @method getPostAutosaveBufferStatus
     * @param {int} postId
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.getPostAutosaveBufferStatus(postId).then(response => console.log(response))
     * @returns {Promise}
     */
    getPostAutosaveBufferStatus: getPostAutosaveBufferStatus,
    /**
     * Update the autosave buffer for a post
     * @async
     * @memberof hs/blog
     * @method updateAutosaveBuffer
     * @param {object} opts
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.updateAutosaveBuffer(opts).then(response => console.log(response))
     * @property {int} opts.id
     * @property {int} opts.blog_author_id
     * @property {string} opts.campaign
     * @property {string} opts.campaign_name
     * @property {int} opts.content_group_id
     * @property {string} opts.featured_image
     * @property {string} opts.footer_html
     * @property {string} opts.head_html
     * @property {string} opts.keywords
     * @property {string} opts.meta_description
     * @property {string} opts.name
     * @property {string} opts.post_body
     * @property {string} opts.post_summary
     * @property {int} opts.publish_date
     * @property {boolean} opts.publish_immediately
     * @property {string} opts.slug
     * @property {array} opts.topic_ids
     * @property {boolean} opts.use_featured_image
     * @property {string} opts.widgets
     * @returns {Promise}
     */
    updateAutosaveBuffer: updateAutosaveBuffer,
    /**
     * Push the autosave buffer for a post to live.
     * @async
     * @memberof hs/blog
     * @method pushPostAutosaveBufferLive
     * @param {int} postId
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.pushPostAutosaveBufferLive(postId).then(response => console.log(response))
     * @returns {Promise}
     */
    pushPostAutosaveBufferLive: pushPostAutosaveBufferLive,
    /**
     * Get info for all blogs on a particular portal
     * @async
     * @memberof hs/blog
     * @method getAllBlogs
     * @param {object} opts
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.getAllBlogs(opts).then(response => console.log(response))
     * @property {string} opts.name
     * @property {int} opts.limit
     * @property {int} opts.offset
     * @property {int} opts.created
     * @property {int} opts.deleted_at
     * @returns {Promise}
     */
    getAllBlogs: getAllBlogs,
    /**
     * Get all blog posts for specified blog
     * @async
     * @memberof hs/blog
     * @method getPosts
     * @param {object} opts
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.getPosts(opts).then(response => console.log(response))
     * @property {int} opts.limit
     * @property {int} opts.offset
     * @property {boolean} opts.archived
     * @property {int} opts.blog_author_id
     * @property {string} opts.campaign
     * @property {int} opts.content_group_id
     * @property {string} opts.slug
     * @property {string} opts.state
     * @property {string} opts.order_by
     * @property {int} opts.created
     * @property {int} opts.deleted_at
     * @property {string} opts.name
     * @property {boolean} opts.updated
     * @returns {Promise}
     */
    getPosts: getPosts,
    /**
     * Get all comments for specific content
     * @async
     * @memberof hs/blog
     * @method getComments
     * @param {object} opts
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.getComments(opts).then(response => console.log(response))
     * @property {int} opts.limit
     * @property {int} opts.offset
     * @property {int} opts.portalId
     * @property {string} opts.state
     * @property {int} opts.contentId
     * @property {boolean} opts.reverse
     * @property {string} opts.query
     * @returns {Promise}
     */
    getComments: getComments,
    /**
     * Get specific comment
     * @async
     * @memberof hs/blog
     * @method getComment
     * @param {int} commentId
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.getComment(commentId).then(response => console.log(response))
     * @returns {Promise}
     */
    getComment: getComment,
    /**
     * Publish, unpublish, or schedule a post
     * @async
     * @memberof hs/blog
     * @method publishOrSchedulePost
     * @param {int} postId
     * @param {string} publishAction One of `schedule-publish` or `cancel-publish`
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.publishOrSchedulePost(postId, publishAction).then(response => console.log(response))
     * @returns {Promise}
     */
    publishOrSchedulePost: publishOrSchedulePost,
    /**
     * Restore a previously deleted post
     * @async
     * @memberof hs/blog
     * @method restoredDeletedPost
     * @param {int} postId
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.restoredDeletedPost(postId).then(response => console.log(response))
     * @returns {Promise}
     */
    restoredDeletedPost: restoredDeletedPost,
    /**
     * Restore a post version to a specific ID.
     * @async
     * @memberof hs/blog
     * @method restorePostVersionById
     * @param {int} postId
     * @param {int} versionId
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.restorePostVersionById(postId, versionId).then(response => console.log(response))
     * @returns {Promise}
     */
    restorePostVersionById: restorePostVersionById,
    /**
     * Search blog authors
     * @async
     * @memberof hs/blog
     * @method searchAuthors
     * @param {object} opts
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.searchAuthors(opts).then(response => console.log(response))
     * @property {int} opts.order
     * @property {int} opts.limit
     * @property {int} opts.offset
     * @property {string} opts.q Free text search parameter
     * @property {boolean} opts.active
     * @property {int} opts.blog
     * @returns {Promise}
     */
    searchAuthors: searchAuthors,
    /**
     * Search blog topics
     * @async
     * @memberof hs/blog
     * @method searchTopics
     * @param {object} opts
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.searchTopics(opts).then(response => console.log(response))
     * @property {int} opts.id
     * @property {string} opts.name
     * @property {int} opts.created
     * @property {string} opts.slug
     * @property {int} opts.limit
     * @property {int} opts.offset
     * @property {string} opts.q Free text search parameter
     * @property {boolean} opts.active
     * @property {int} opts.blog
     * @returns {Promise}
     */
    searchTopics: searchTopics,
    /**
     * Validate the autosave buffer on a post.
     * @async
     * @memberof hs/blog
     * @method validatePostAutosaveBufferStatus
     * @param {int} postId
     * @example
     * const hs = new HubspotClient(props);
     * hs.blog.validatePostAutosaveBufferStatus(postId).then(response => console.log(response))
     * @returns {Promise}
     */
    validatePostAutosaveBufferStatus: validatePostAutosaveBufferStatus
  };
}

var _this$6 = undefined;

var defaults$7 = {};
var _baseOptions$6 = void 0;

var createWorkflow = function () {
  var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var type, name, actions, description, enabled, portalId, isSegmentBased, listening, nurtureTimeRange, onlyExecOnBizDays, insertedAt, updatedAt, recurringSetting, enrollOnCriteriaUpdate, onlyEnrollsManually, creationSource, updateSource, allowContactToTriggerMultipleTimes, unenrollmentSetting, segmentCriteria, goalCriteria, reEnrollmentTriggerSets, triggerSets, suppressionListIds, lastUpdatedBy, metaData, body, mergedProps, method, workflowInfo;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

            requiresAuthentication(_baseOptions$6);
            type = opts.type, name = opts.name, actions = opts.actions, description = opts.description, enabled = opts.enabled, portalId = opts.portalId, isSegmentBased = opts.isSegmentBased, listening = opts.listening, nurtureTimeRange = opts.nurtureTimeRange, onlyExecOnBizDays = opts.onlyExecOnBizDays, insertedAt = opts.insertedAt, updatedAt = opts.updatedAt, recurringSetting = opts.recurringSetting, enrollOnCriteriaUpdate = opts.enrollOnCriteriaUpdate, onlyEnrollsManually = opts.onlyEnrollsManually, creationSource = opts.creationSource, updateSource = opts.updateSource, allowContactToTriggerMultipleTimes = opts.allowContactToTriggerMultipleTimes, unenrollmentSetting = opts.unenrollmentSetting, segmentCriteria = opts.segmentCriteria, goalCriteria = opts.goalCriteria, reEnrollmentTriggerSets = opts.reEnrollmentTriggerSets, triggerSets = opts.triggerSets, suppressionListIds = opts.suppressionListIds, lastUpdatedBy = opts.lastUpdatedBy, metaData = opts.metaData;
            body = {
              type: type,
              name: name,
              actions: actions,
              description: description,
              enabled: enabled,
              portalId: portalId,
              isSegmentBased: isSegmentBased,
              listening: listening,
              nurtureTimeRange: nurtureTimeRange,
              onlyExecOnBizDays: onlyExecOnBizDays,
              insertedAt: insertedAt,
              updatedAt: updatedAt,
              recurringSetting: recurringSetting,
              enrollOnCriteriaUpdate: enrollOnCriteriaUpdate,
              onlyEnrollsManually: onlyEnrollsManually,
              creationSource: creationSource,
              updateSource: updateSource,
              allowContactToTriggerMultipleTimes: allowContactToTriggerMultipleTimes,
              unenrollmentSetting: unenrollmentSetting,
              segmentCriteria: segmentCriteria,
              goalCriteria: goalCriteria,
              reEnrollmentTriggerSets: reEnrollmentTriggerSets,
              triggerSets: triggerSets,
              suppressionListIds: suppressionListIds,
              lastUpdatedBy: lastUpdatedBy,
              metaData: metaData
            };
            mergedProps = Object.assign({}, defaults$7, _baseOptions$6);
            method = 'POST';
            _context.next = 8;
            return createRequest(constants.api.workflows.create, {
              method: method,
              body: body
            }, mergedProps);

          case 8:
            workflowInfo = _context.sent;
            return _context.abrupt('return', Promise.resolve(workflowInfo));

          case 12:
            _context.prev = 12;
            _context.t0 = _context['catch'](0);
            return _context.abrupt('return', Promise.reject(_context.t0.message));

          case 15:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this$6, [[0, 12]]);
  }));

  return function createWorkflow() {
    return _ref.apply(this, arguments);
  };
}();

var getWorkflow = function () {
  var _ref2 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(id) {
    var mergedProps, workflowInfo;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;

            requiresAuthentication(_baseOptions$6);
            mergedProps = Object.assign({}, defaults$7, _baseOptions$6);

            if (id) {
              _context2.next = 5;
              break;
            }

            throw new Error('getWorkflow requires an `id` argument');

          case 5:
            _context2.next = 7;
            return createRequest(constants.api.workflows.byId, {
              id: id
            }, mergedProps);

          case 7:
            workflowInfo = _context2.sent;
            return _context2.abrupt('return', Promise.resolve(workflowInfo));

          case 11:
            _context2.prev = 11;
            _context2.t0 = _context2['catch'](0);
            return _context2.abrupt('return', Promise.reject(_context2.t0.message));

          case 14:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, _this$6, [[0, 11]]);
  }));

  return function getWorkflow(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

var deleteWorkflow = function () {
  var _ref3 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(id) {
    var mergedProps;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;

            requiresAuthentication(_baseOptions$6);
            mergedProps = Object.assign({}, defaults$7, _baseOptions$6);

            if (id) {
              _context3.next = 5;
              break;
            }

            throw new Error('deleteWorkflow requires an `id` argument');

          case 5:
            _context3.next = 7;
            return createRequest(constants.api.workflows.byId, {
              method: 'DELETE',
              id: id
            }, mergedProps);

          case 7:
            return _context3.abrupt('return', Promise.resolve({ deleted: true }));

          case 10:
            _context3.prev = 10;
            _context3.t0 = _context3['catch'](0);
            return _context3.abrupt('return', Promise.reject(_context3.t0.message));

          case 13:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, _this$6, [[0, 10]]);
  }));

  return function deleteWorkflow(_x3) {
    return _ref3.apply(this, arguments);
  };
}();

var updateWorkflow = function () {
  var _ref4 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var mergedProps, body, method, id, portalId, workflowInfo;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.prev = 0;

            requiresAuthentication(_baseOptions$6);
            mergedProps = Object.assign({}, defaults$7, _baseOptions$6);
            body = Object.assign({}, opts);
            method = 'PUT';
            id = opts.id, portalId = opts.portalId;

            if (!(!id || !portalId)) {
              _context4.next = 8;
              break;
            }

            throw new Error('Workflow payload requires an `id` and `portalId` property');

          case 8:
            _context4.next = 10;
            return createRequest(constants.api.workflows.byId, {
              method: method,
              body: body,
              id: id
            }, mergedProps);

          case 10:
            workflowInfo = _context4.sent;
            return _context4.abrupt('return', Promise.resolve(workflowInfo));

          case 14:
            _context4.prev = 14;
            _context4.t0 = _context4['catch'](0);
            return _context4.abrupt('return', Promise.reject(_context4.t0.message));

          case 17:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, _this$6, [[0, 14]]);
  }));

  return function updateWorkflow() {
    return _ref4.apply(this, arguments);
  };
}();

var getAll$1 = function () {
  var _ref5 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
    var mergedProps, allWorkflows;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.prev = 0;

            requiresAuthentication(_baseOptions$6);
            mergedProps = Object.assign({}, defaults$7, _baseOptions$6);
            _context5.next = 5;
            return createRequest(constants.api.workflows.getAll, {}, mergedProps);

          case 5:
            allWorkflows = _context5.sent;
            return _context5.abrupt('return', Promise.resolve(allWorkflows));

          case 9:
            _context5.prev = 9;
            _context5.t0 = _context5['catch'](0);
            return _context5.abrupt('return', Promise.reject(_context5.t0.message));

          case 12:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, _this$6, [[0, 9]]);
  }));

  return function getAll() {
    return _ref5.apply(this, arguments);
  };
}();

var enrollContact = function () {
  var _ref6 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var workflowId, email, method, mergedProps;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.prev = 0;

            requiresAuthentication(_baseOptions$6);
            workflowId = opts.workflowId, email = opts.email;
            method = 'POST';
            mergedProps = Object.assign({}, defaults$7, _baseOptions$6);
            _context6.next = 7;
            return createRequest(constants.api.workflows.enrollContact, {
              method: method,
              workflowId: workflowId,
              email: email
            }, mergedProps);

          case 7:
            return _context6.abrupt('return', Promise.resolve({ enrolled: true }));

          case 10:
            _context6.prev = 10;
            _context6.t0 = _context6['catch'](0);
            return _context6.abrupt('return', Promise.reject(_context6.t0.message));

          case 13:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, _this$6, [[0, 10]]);
  }));

  return function enrollContact() {
    return _ref6.apply(this, arguments);
  };
}();

var unenrollContact = function () {
  var _ref7 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var workflowId, email, method, mergedProps;
    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.prev = 0;

            requiresAuthentication(_baseOptions$6);
            workflowId = opts.workflowId, email = opts.email;
            method = 'DELETE';
            mergedProps = Object.assign({}, defaults$7, _baseOptions$6);
            _context7.next = 7;
            return createRequest(constants.api.workflows.enrollContact, {
              method: method,
              workflowId: workflowId,
              email: email
            }, mergedProps);

          case 7:
            return _context7.abrupt('return', Promise.resolve({ unenrolled: true }));

          case 10:
            _context7.prev = 10;
            _context7.t0 = _context7['catch'](0);
            return _context7.abrupt('return', Promise.reject(_context7.t0.message));

          case 13:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, _this$6, [[0, 10]]);
  }));

  return function unenrollContact() {
    return _ref7.apply(this, arguments);
  };
}();

var getEnrollments = function () {
  var _ref8 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(id) {
    var mergedProps, enrollments;
    return regeneratorRuntime.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.prev = 0;

            requiresAuthentication(_baseOptions$6);
            mergedProps = Object.assign({}, defaults$7, _baseOptions$6);
            _context8.next = 5;
            return createRequest(constants.api.workflows.enrollments, {
              id: id
            }, mergedProps);

          case 5:
            enrollments = _context8.sent;
            return _context8.abrupt('return', Promise.resolve(enrollments));

          case 9:
            _context8.prev = 9;
            _context8.t0 = _context8['catch'](0);
            return _context8.abrupt('return', Promise.reject(_context8.t0.message));

          case 12:
          case 'end':
            return _context8.stop();
        }
      }
    }, _callee8, _this$6, [[0, 9]]);
  }));

  return function getEnrollments(_x7) {
    return _ref8.apply(this, arguments);
  };
}();

var getWorkflowEventLog = function () {
  var _ref9 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var vid, types, workflowId, body, method, mergedProps, eventLogs;
    return regeneratorRuntime.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            _context9.prev = 0;

            requiresAuthentication(_baseOptions$6);
            vid = opts.vid, types = opts.types, workflowId = opts.workflowId;
            body = {
              vid: vid,
              types: types
            };
            method = 'PUT';
            mergedProps = Object.assign({}, defaults$7, _baseOptions$6);
            _context9.next = 8;
            return createRequest(constants.api.workflows.eventLogs, {
              method: method,
              body: body,
              workflowId: workflowId
            }, mergedProps);

          case 8:
            eventLogs = _context9.sent;
            return _context9.abrupt('return', Promise.resolve(eventLogs));

          case 12:
            _context9.prev = 12;
            _context9.t0 = _context9['catch'](0);
            return _context9.abrupt('return', Promise.reject(_context9.t0.message));

          case 15:
          case 'end':
            return _context9.stop();
        }
      }
    }, _callee9, _this$6, [[0, 12]]);
  }));

  return function getWorkflowEventLog() {
    return _ref9.apply(this, arguments);
  };
}();

function workflows(baseOptions) {
  _baseOptions$6 = baseOptions;

  return {
    /**
     * Get workflow by ID
     * @async
     * @memberof hs/workflows
     * @method getWorkflow
     * @param {int} workflowId
     * @example
     * const hs = new HubspotClient(props);
     * hs.workflows.getWorkflow(workflowId).then(response => console.log(response));
     * @returns {Promise}
     */
    getWorkflow: getWorkflow,
    /**
     * Create a new workflow
     * @async
     * @memberof hs/workflows
     * @method createWorkflow
     * @param {object} workflowBody See {@link https://developers.hubspot.com/docs/methods/workflows/v3/create_workflow|developer docs} for examples of workflow JSON
     * @example
     * const hs = new HubspotClient(props);
     * hs.workflows.createWorkflow(workflowBody).then(response => console.log(response));
     * @returns {Promise}
     */
    createWorkflow: createWorkflow,
    /**
     * Update an existing workflow
     * @async
     * @memberof hs/workflows
     * @method updateWorkflow
     * @param {object} workflowBody See {@link https://developers.hubspot.com/docs/methods/workflows/v3/create_workflow|developer docs} for examples of workflow JSON
     * @example
     * const hs = new HubspotClient(props);
     * hs.workflows.updateWorkflow(workflowBody).then(response => console.log(response));
     * @property {int} opts.id The ID of the workflow you want to update.
     * @property {int} opts.portalId The ID of the portal that the workflow resides on
     * @returns {Promise}
     */
    updateWorkflow: updateWorkflow,
    /**
     * Delete an existing workflow
     * @async
     * @memberof hs/workflows
     * @method deleteWorkflow
     * @param {int} id The ID of the workflow you wish to delete
     * @example
     * const hs = new HubspotClient(props);
     * hs.workflows.deleteWorkflow(workflowBody).then(response => console.log(response));
     * @returns {Promise}
     */
    deleteWorkflow: deleteWorkflow,
    /**
     * Get all workflows
     * @async
     * @memberof hs/workflows
     * @method getAll
     * @example
     * const hs = new HubspotClient(props);
     * hs.workflows.getAll().then(response => console.log(response));
     * @returns {Promise}
     */
    getAll: getAll$1,
    /**
     * Enroll a contact in a workflow
     * @async
     * @memberof hs/workflows
     * @method enrollContact
     * @param {object} opts Contact & workflow options
     * @example
     * const hs = new HubspotClient(props);
     * hs.workflows.enrollContact(opts).then(response => console.log(response));
     * @property {int} opts.workflowId The ID of the workflow you want to enroll the contact to.
     * @property {int} opts.email The email address of the contact you wish to enroll.
     * @returns {Promise}
     */
    enrollContact: enrollContact,
    /**
     * Unenroll a contact from a workflow
     * @async
     * @memberof hs/workflows
     * @method unenrollContact
     * @param {object} opts Contact & workflow options
     * @example
     * const hs = new HubspotClient(props);
     * hs.workflows.unenrollContact(opts).then(response => console.log(response));
     * @property {int} opts.workflowId The ID of the workflow you want to unenroll the contact from.
     * @property {int} opts.email The email address of the contact you wish to unenroll.
     * @returns {Promise}
     */
    unenrollContact: unenrollContact,
    /**
     * Get workflow enrollments for the specified contact ID
     * @async
     * @memberof hs/workflows
     * @method getEnrollments
     * @param {int} id Contact id to retrieve enrollments for
     * @example
     * const hs = new HubspotClient(props);
     * hs.workflows.getEnrollments(id).then(response => console.log(response));
     * @returns {Promise}
     */
    getEnrollments: getEnrollments,
    /**
     * Get a list of log events for a contact by workflow. For more information, checkout the {@link https://developers.hubspot.com/docs/methods/workflows/log_events|developer docs}.
     * @async
     * @memberof hs/workflows
     * @method getWorkflowEventLog
     * @param {object} opts Filtering options
     * @example
     * const hs = new HubspotClient(props);
     * hs.workflows.getWorkflowEventLog({
        vid: 1283719823
        workflowId: 123239681612,
        types: ['ENROLLED']
      }).then(response => console.log(response));
     * @property {int} opts.vid The contact ID to filter on
     * @property {int} opts.workflowId The ID of the workflow you want to get log events for
     * @property {int} opts.types An array of event types
     * @returns {Promise}
     */
    getWorkflowEventLog: getWorkflowEventLog
  };
}

var _this$7 = undefined;

var defaults$8 = {};
var _baseOptions$7 = void 0;

var getFilesInFolder = function () {
  var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(folder_id) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var limit, offset, mergedProps, files;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

            requiresAuthentication(_baseOptions$7);
            limit = opts.limit, offset = opts.offset;

            limit = limit || 100;
            offset = offset || 0;

            mergedProps = Object.assign({}, defaults$8, _baseOptions$7, {
              folder_id: folder_id,
              limit: limit,
              offset: offset
            });
            _context.next = 8;
            return createRequest(constants.api.files.getFilesInFolder, {}, mergedProps);

          case 8:
            files = _context.sent;
            return _context.abrupt('return', Promise.resolve(files));

          case 12:
            _context.prev = 12;
            _context.t0 = _context['catch'](0);
            return _context.abrupt('return', Promise.reject(_context.t0.message));

          case 15:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this$7, [[0, 12]]);
  }));

  return function getFilesInFolder(_x) {
    return _ref.apply(this, arguments);
  };
}();

var uploadFile = function () {
  var _ref2 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var overwrite, hidden, files, folder_paths, fileOptions, method, data, mergedProps, author;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;
            overwrite = opts.overwrite, hidden = opts.hidden, files = opts.files, folder_paths = opts.folder_paths;
            fileOptions = {
              access: 'PUBLIC_NOT_INDEXABLE',
              overwrite: true,
              duplicateValidationStrategy: 'NONE',
              duplicateValidationScope: 'EXACT_FOLDER'
            };
            method = 'POST';
            data = new FormData();

            data.append('options', JSON.stringify(fileOptions));
            data.append('folderPath', folder_paths);

            data.append('file', fs.createReadStream(files), {
              knownLength: fs.statSync(files).size,
              name: files
            });

            mergedProps = Object.assign({}, defaults$8, _baseOptions$7, {
              overwrite: overwrite,
              hidden: hidden
            });
            _context2.next = 11;
            return createRequest(constants.api.files.upload, {
              method: method,
              data: data,
              headers: _extends({}, data.getHeaders(), {
                'Content-Length': data.getLengthSync()
              })
            }, mergedProps);

          case 11:
            author = _context2.sent;
            return _context2.abrupt('return', Promise.resolve(author));

          case 15:
            _context2.prev = 15;
            _context2.t0 = _context2['catch'](0);
            return _context2.abrupt('return', Promise.reject(_context2.t0));

          case 18:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, _this$7, [[0, 15]]);
  }));

  return function uploadFile() {
    return _ref2.apply(this, arguments);
  };
}();

function filesApi(baseOptions) {
  _baseOptions$7 = baseOptions;

  return {
    uploadFile: uploadFile,
    getFilesInFolder: getFilesInFolder
  };
}

var _this$8 = undefined;

var defaults$9 = {};
var _baseOptions$8 = void 0;

var getDomains = function () {
  var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var limit, offset, id, domain, is_resolving, created, primary_site_page, additionalOpts, mergedProps, domains;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

            requiresAuthentication(_baseOptions$8);
            limit = opts.limit, offset = opts.offset, id = opts.id, domain = opts.domain, is_resolving = opts.is_resolving, created = opts.created, primary_site_page = opts.primary_site_page;
            additionalOpts = {
              domain: domain,
              limit: limit,
              offset: offset,
              is_resolving: is_resolving,
              primary_site_page: primary_site_page,
              id: id
            };
            // Extract additional dynamic querystring params and values.

            additionalOpts = queryStringParamInterpolator({
              created: created
            }, additionalOpts);

            mergedProps = Object.assign({}, defaults$9, _baseOptions$8, additionalOpts);
            _context.next = 8;
            return createRequest(constants.api.domains.getAll, {}, mergedProps);

          case 8:
            domains = _context.sent;
            return _context.abrupt('return', Promise.resolve(domains));

          case 12:
            _context.prev = 12;
            _context.t0 = _context['catch'](0);
            return _context.abrupt('return', Promise.reject(_context.t0.message));

          case 15:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this$8, [[0, 12]]);
  }));

  return function getDomains() {
    return _ref.apply(this, arguments);
  };
}();

var getDomain = function () {
  var _ref2 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(id) {
    var mergedProps, domainInfo;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;

            requiresAuthentication(_baseOptions$8);

            if (id) {
              _context2.next = 4;
              break;
            }

            throw new Error('getDomain requires an `id` argument');

          case 4:
            mergedProps = Object.assign({}, defaults$9, _baseOptions$8);
            _context2.next = 7;
            return createRequest(constants.api.domains.byId, { id: id }, mergedProps);

          case 7:
            domainInfo = _context2.sent;
            return _context2.abrupt('return', Promise.resolve(domainInfo));

          case 11:
            _context2.prev = 11;
            _context2.t0 = _context2['catch'](0);
            return _context2.abrupt('return', Promise.reject(_context2.t0.message));

          case 14:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, _this$8, [[0, 11]]);
  }));

  return function getDomain(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

function domainsApi(baseOptions) {
  _baseOptions$8 = baseOptions;

  return {
    /**
     * Get all domains for a portal
     * @async
     * @memberof hs/domains
     * @method getDomains
     * @param {object} opts
     * @example
     * const hs = new HubspotClient(props);
     * hs.domains.getDomains(opts).then(response => console.log(response));
     * @property {int} opts.limit
     * @property {int} opts.offset
     * @property {int} opts.id
     * @property {string} opts.domain
     * @property {boolean} opts.is_resolving
     * @property {int} opts.created
     * @property {string} opts.primary_site_page
     * @returns {Promise}
     */
    getDomains: getDomains,
    /**
     * Get domain by ID
     * @async
     * @memberof hs/domains
     * @method getDomain
     * @param {int} domainId
     * @example
     * const hs = new HubspotClient(props);
     * hs.domains.getDomain(domainId).then(response => console.log(response));
     * @returns {Promise}
     */
    getDomain: getDomain
  };
}

var _this$9 = undefined;

var defaults$10 = {};
var _baseOptions$9 = void 0;

var getLayouts = function () {
  var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var limit, offset, category_id, created, deleted_at, id, label, path, custom_head, include_default_custom_css, enable_domain_stylesheet, attached_stylesheets, additionalOpts, mergedProps, layouts;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

            requiresAuthentication(_baseOptions$9);
            limit = opts.limit, offset = opts.offset, category_id = opts.category_id, created = opts.created, deleted_at = opts.deleted_at, id = opts.id, label = opts.label, path = opts.path, custom_head = opts.custom_head, include_default_custom_css = opts.include_default_custom_css, enable_domain_stylesheet = opts.enable_domain_stylesheet, attached_stylesheets = opts.attached_stylesheets;
            additionalOpts = {
              limit: limit,
              offset: offset,
              category_id: category_id,
              created: created,
              deleted_at: deleted_at,
              id: id,
              label: label,
              path: path,
              custom_head: custom_head,
              include_default_custom_css: include_default_custom_css,
              enable_domain_stylesheet: enable_domain_stylesheet,
              attached_stylesheets: attached_stylesheets
            };
            // Extract additional dynamic querystring params and values.

            additionalOpts = queryStringParamInterpolator({
              created: created
            }, additionalOpts);

            mergedProps = Object.assign({}, defaults$10, _baseOptions$9, additionalOpts);
            _context.next = 8;
            return createRequest(constants.api.layouts.getAll, {}, mergedProps);

          case 8:
            layouts = _context.sent;
            return _context.abrupt('return', Promise.resolve(layouts));

          case 12:
            _context.prev = 12;
            _context.t0 = _context['catch'](0);
            return _context.abrupt('return', Promise.reject(_context.t0.message));

          case 15:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this$9, [[0, 12]]);
  }));

  return function getLayouts() {
    return _ref.apply(this, arguments);
  };
}();

var getLayout = function () {
  var _ref2 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(id) {
    var mergedProps, layoutInfo;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;

            requiresAuthentication(_baseOptions$9);

            if (id) {
              _context2.next = 4;
              break;
            }

            throw new Error('getLayout requires an `id` argument');

          case 4:
            mergedProps = Object.assign({}, defaults$10, _baseOptions$9);
            _context2.next = 7;
            return createRequest(constants.api.layouts.byId, { id: id }, mergedProps);

          case 7:
            layoutInfo = _context2.sent;
            return _context2.abrupt('return', Promise.resolve(layoutInfo));

          case 11:
            _context2.prev = 11;
            _context2.t0 = _context2['catch'](0);
            return _context2.abrupt('return', Promise.reject(_context2.t0.message));

          case 14:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, _this$9, [[0, 11]]);
  }));

  return function getLayout(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

var getLayoutBuffer = function () {
  var _ref3 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(id) {
    var mergedProps, layoutBuffer;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;

            requiresAuthentication(_baseOptions$9);

            if (id) {
              _context3.next = 4;
              break;
            }

            throw new Error('getLayoutBuffer requires an `id` argument');

          case 4:
            mergedProps = Object.assign({}, defaults$10, _baseOptions$9);
            _context3.next = 7;
            return createRequest(constants.api.layouts.getBuffer, { id: id }, mergedProps);

          case 7:
            layoutBuffer = _context3.sent;
            return _context3.abrupt('return', Promise.resolve(layoutBuffer));

          case 11:
            _context3.prev = 11;
            _context3.t0 = _context3['catch'](0);
            return _context3.abrupt('return', Promise.reject(_context3.t0.message));

          case 14:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, _this$9, [[0, 11]]);
  }));

  return function getLayoutBuffer(_x3) {
    return _ref3.apply(this, arguments);
  };
}();

var hasBufferedChanges = function () {
  var _ref4 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(id) {
    var mergedProps, result;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.prev = 0;

            requiresAuthentication(_baseOptions$9);

            if (id) {
              _context4.next = 4;
              break;
            }

            throw new Error('hasBufferedChanges requires an `id` argument');

          case 4:
            mergedProps = Object.assign({}, defaults$10, _baseOptions$9);
            _context4.next = 7;
            return createRequest(constants.api.layouts.hasBufferedChanges, { id: id }, mergedProps);

          case 7:
            result = _context4.sent;
            return _context4.abrupt('return', Promise.resolve(result));

          case 11:
            _context4.prev = 11;
            _context4.t0 = _context4['catch'](0);
            return _context4.abrupt('return', Promise.reject(_context4.t0.message));

          case 14:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, _this$9, [[0, 11]]);
  }));

  return function hasBufferedChanges(_x4) {
    return _ref4.apply(this, arguments);
  };
}();

var getPreviousLayoutVersions = function () {
  var _ref5 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(id) {
    var mergedProps, previousVersions;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.prev = 0;

            requiresAuthentication(_baseOptions$9);

            if (id) {
              _context5.next = 4;
              break;
            }

            throw new Error('getPreviousLayoutVersions requires an `id` argument');

          case 4:
            mergedProps = Object.assign({}, defaults$10, _baseOptions$9);
            _context5.next = 7;
            return createRequest(constants.api.layouts.getPreviousVersions, { id: id }, mergedProps);

          case 7:
            previousVersions = _context5.sent;
            return _context5.abrupt('return', Promise.resolve(previousVersions));

          case 11:
            _context5.prev = 11;
            _context5.t0 = _context5['catch'](0);
            return _context5.abrupt('return', Promise.reject(_context5.t0.message));

          case 14:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, _this$9, [[0, 11]]);
  }));

  return function getPreviousLayoutVersions(_x5) {
    return _ref5.apply(this, arguments);
  };
}();

var getPreviousLayoutVersion = function () {
  var _ref6 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(_ref7) {
    var id = _ref7.id,
        versionId = _ref7.versionId;
    var mergedProps, previousVersions;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.prev = 0;

            requiresAuthentication(_baseOptions$9);

            if (!(!id || !versionId)) {
              _context6.next = 4;
              break;
            }

            throw new Error('getPreviousLayoutVersion requires the first argument to contain both keys for `id` & `versionId`');

          case 4:
            mergedProps = Object.assign({}, defaults$10, _baseOptions$9);
            _context6.next = 7;
            return createRequest(constants.api.layouts.getPreviousVersions, { id: id, versionId: versionId }, mergedProps);

          case 7:
            previousVersions = _context6.sent;
            return _context6.abrupt('return', Promise.resolve(previousVersions));

          case 11:
            _context6.prev = 11;
            _context6.t0 = _context6['catch'](0);
            return _context6.abrupt('return', Promise.reject(_context6.t0.message));

          case 14:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, _this$9, [[0, 11]]);
  }));

  return function getPreviousLayoutVersion(_x6) {
    return _ref6.apply(this, arguments);
  };
}();

function layoutsApi(baseOptions) {
  _baseOptions$9 = baseOptions;

  return {
    /**
     * Get all layouts for a portal
     * @async
     * @memberof hs/layouts
     * @method getLayouts
     * @param {object} opts
     * @example
     * const hs = new HubspotClient(props);
     * hs.layouts.getLayouts(opts).then(response => console.log(response));
     * @property {int} opts.limit
     * @property {int} opts.offset
     * @property {int} opts.category_id
     * @property {int} opts.created
     * @property {int} opts.deleted_at
     * @property {int} opts.id
     * @property {string} opts.label Find layouts matching this label.
     * @property {string} opts.path
     * @property {string} opts.custom_head
     * @property {boolean} opts.include_default_custom_css
     * @property {boolean} opts.enable_domain_stylesheet
     * @property {string} opts.attached_stylesheets
     * @returns {Promise}
     */
    getLayouts: getLayouts,
    /**
     * Get layout info by ID
     * @async
     * @memberof hs/layouts
     * @method getLayout
     * @param {int} layoutId
     * @example
     * const hs = new HubspotClient(props);
     * hs.layouts.getLayout(layoutId).then(response => console.log(response));
     * @returns {Promise}
     */
    getLayout: getLayout,
    /**
     * Gets the current contents of the auto-save buffer
     * @async
     * @memberof hs/layouts
     * @method getLayoutBuffer
     * @param {int} layoutId
     * @example
     * const hs = new HubspotClient(props);
     * hs.layout.getLayoutBuffer(layoutId).then(response => console.log(response));
     * @return {Promise}
     */
    getLayoutBuffer: getLayoutBuffer,
    /**
     * Returns a dictionary: {"has_changes": false/true} depending on if the buffer is different from the live object.
     * @async
     * @memberof hs/layouts
     * @method hasBufferedChanges
     * @param {int} layoutId
     * @example
     * const hs = new HubspotClient(props);
     * hs.layout.hasBufferedChanges(layoutId).then(response => console.log(response));
     * @return {Promise}
     */
    hasBufferedChanges: hasBufferedChanges,
    /**
     * Get the previous revisions for a specific layout, specified by ID.
     * @async
     * @memberof hs/layouts
     * @method getPreviousLayoutVersions
     * @param {int} layoutId
     * @example
     * const hs = new HubspotClient(props);
     * hs.layout.getPreviousLayoutVersions(layoutId).then(response => console.log(response));
     * @return {Promise}
     */
    getPreviousLayoutVersions: getPreviousLayoutVersions,
    /**
     * Get a specific revision of a specific layout. Version id is the id of the version from the list previous versions endpoint
     * @async
     * @memberof hs/layouts
     * @method getPreviousLayoutVersion
     * @param {object} opts
     * @param {int} opts.id - layoutId
     * @param {int} opts.versionId - id of the versionm from the list previous versions endpoint
     * @example
     * const hs = new HubspotClient(props);
     * hs.layout.getPreviousLayoutVersion({ id , versionId }).then(response => console.log(response));
     * @return {Promise}
     */
    getPreviousLayoutVersion: getPreviousLayoutVersion
  };
}

var _this$10 = undefined;

var defaults$11 = {};
var _baseOptions$10 = void 0;

var submitFormV3 = function () {
  var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(portalId, formId) {
    var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var method, response;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            method = 'POST';
            _context.next = 4;
            return createRequest(constants.api.forms.submitFormV3, {
              formId: formId,
              portalId: portalId,
              method: method,
              body: _extends({}, opts)
            });

          case 4:
            response = _context.sent;
            return _context.abrupt('return', Promise.resolve(response));

          case 8:
            _context.prev = 8;
            _context.t0 = _context['catch'](0);
            return _context.abrupt('return', Promise.reject(_context.t0));

          case 11:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this$10, [[0, 8]]);
  }));

  return function submitFormV3(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

var submitForm = function () {
  var _ref2 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(portalId, formId) {
    var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var hutk, ipAddress, pageUrl, pageName, redirectUrl, method, hs_context, mergedProps;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;

            // hs-context params
            hutk = opts.hutk, ipAddress = opts.ipAddress, pageUrl = opts.pageUrl, pageName = opts.pageName, redirectUrl = opts.redirectUrl;
            method = 'POST';
            hs_context = JSON.stringify({
              hutk: hutk,
              ipAddress: ipAddress,
              pageUrl: pageUrl,
              pageName: pageName,
              redirectUrl: redirectUrl
            });
            mergedProps = Object.assign({
              hs_context: hs_context
            }, defaults$11, _baseOptions$10,
            // Property values. This is essentially the entire payload minus the formId, portalId and hs_context params.
            omit(opts, ['hutk', 'ipAddress', 'pageUrl', 'pageName', 'redirectUrl']));

            // Remove the hapikey from these requests

            if (mergedProps.hapikey) {
              delete mergedProps.hapikey;
            }

            _context2.next = 8;
            return createRequest(constants.api.forms.submitForm, {
              formId: formId,
              portalId: portalId,
              method: method
            }, mergedProps);

          case 8:
            return _context2.abrupt('return', Promise.resolve({ submitted: true }));

          case 11:
            _context2.prev = 11;
            _context2.t0 = _context2['catch'](0);
            return _context2.abrupt('return', Promise.reject(_context2.t0.message));

          case 14:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, _this$10, [[0, 11]]);
  }));

  return function submitForm(_x4, _x5) {
    return _ref2.apply(this, arguments);
  };
}();

var getFormFields = function () {
  var _ref3 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(formId) {
    var mergedProps, formFields;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;

            requiresAuthentication(_baseOptions$10);
            mergedProps = Object.assign({}, defaults$11, _baseOptions$10);
            _context3.next = 5;
            return createRequest(constants.api.forms.formFields, { formId: formId }, mergedProps);

          case 5:
            formFields = _context3.sent;
            return _context3.abrupt('return', Promise.resolve(formFields));

          case 9:
            _context3.prev = 9;
            _context3.t0 = _context3['catch'](0);
            return _context3.abrupt('return', Promise.reject(_context3.t0));

          case 12:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, _this$10, [[0, 9]]);
  }));

  return function getFormFields(_x7) {
    return _ref3.apply(this, arguments);
  };
}();

var getSubmissions = function () {
  var _ref4 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(formId) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var mergedProps, submissions;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.prev = 0;

            requiresAuthentication(_baseOptions$10);
            mergedProps = Object.assign({}, defaults$11, _baseOptions$10, opts);
            _context4.next = 5;
            return createRequest(constants.api.forms.submissions, { formId: formId }, mergedProps);

          case 5:
            submissions = _context4.sent;
            return _context4.abrupt('return', Promise.resolve(submissions));

          case 9:
            _context4.prev = 9;
            _context4.t0 = _context4['catch'](0);
            return _context4.abrupt('return', Promise.reject(_context4.t0));

          case 12:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, _this$10, [[0, 9]]);
  }));

  return function getSubmissions(_x8) {
    return _ref4.apply(this, arguments);
  };
}();

function formsApi(baseOptions) {
  _baseOptions$10 = baseOptions;

  return {
    /**
     * Submit a form with data See the {@link https://developers.hubspot.com/docs/methods/forms/submit_form|developer docs} for full spec.
     * @async
     * @memberof hs/forms
     * @method submitForm
     * @param {int} portalId Portal ID the form resides on
     * @param {string} formId ID of form to submit.
     * @param {object} formFields Key/value pairs of form fields.
     * @example
     * const hs = new HubspotClient(props);
     * hs.forms.submitForm(portalId, formId, formFields).then(response => console.log(response));
     * @returns {Promise}
     */
    submitForm: submitForm,
    /**
     * Get Form Fields for Specified Form
     * @async
     * @memberof hs/forms
     * @method getFormFields
     * @param {string} formId
     * @example
     * const hs = new HubSpotClient(props);
     * const formFields = await hs.forms.getFormFields(formId)
     */
    getFormFields: getFormFields,
    /**
     * Get form submissions for specific form
     * @async
     * @memberof hs/forms
     * @method getSubmissions
     * @param {string} formId
     * @example
     * const hs = new HubSpotClient(props);
     * const submissions = await hs.forms.getSubmissions(formId)
     */
    getSubmissions: getSubmissions,
    /**
     * Submit a form with data See the {@link https://developers.hubspot.com/docs/methods/forms/submit_form_v3|developer docs} for full spec.
     * @async
     * @memberof hs/forms
     * @method submitFormV3
     * @param {int} portalId Portal ID the form resides on
     * @param {string} formId ID of form to submit.
     * @param {object} submitBody { fields, context, legalConsentOptions } see docs for full spec
     * @example
     * const hs = new HubspotClient(props);
     * hs.forms.submitFormV3(portalId, formId, submitBody).then(response => console.log(response));
     * @returns {Promise}
     */
    submitFormV3: submitFormV3
  };
}

var _this$11 = undefined;

var defaults$12 = {};
var _baseOptions$11 = void 0;

var getPublishingChannels = function () {
  var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var mergedProps, publishingChannels;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

            requiresAuthentication(_baseOptions$11);
            mergedProps = Object.assign({}, defaults$12, _baseOptions$11);
            _context.next = 5;
            return createRequest(constants.api.social.channels, {}, mergedProps);

          case 5:
            publishingChannels = _context.sent;
            return _context.abrupt('return', Promise.resolve(publishingChannels));

          case 9:
            _context.prev = 9;
            _context.t0 = _context['catch'](0);
            return _context.abrupt('return', Promise.reject(_context.t0.message));

          case 12:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this$11, [[0, 9]]);
  }));

  return function getPublishingChannels() {
    return _ref.apply(this, arguments);
  };
}();

var createBroadcastMessage = function () {
  var _ref2 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var channelGuid, status, triggerAt, body, photoUrl, method, requestBody, mergedProps;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;

            requiresAuthentication(_baseOptions$11);
            channelGuid = opts.channelGuid, status = opts.status, triggerAt = opts.triggerAt, body = opts.body, photoUrl = opts.photoUrl;
            method = 'POST';
            requestBody = {
              channelGuid: channelGuid,
              triggerAt: triggerAt,
              content: {
                body: body,
                photoUrl: photoUrl
              },
              status: status
            };
            mergedProps = Object.assign({}, defaults$12, _baseOptions$11);
            _context2.next = 8;
            return createRequest(constants.api.social.createBroadcastMessage, {
              method: method,
              body: requestBody
            }, mergedProps);

          case 8:
            return _context2.abrupt('return', Promise.resolve({ status: status, scheduled: true }));

          case 11:
            _context2.prev = 11;
            _context2.t0 = _context2['catch'](0);
            return _context2.abrupt('return', Promise.reject(_context2.t0.message));

          case 14:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, _this$11, [[0, 11]]);
  }));

  return function createBroadcastMessage() {
    return _ref2.apply(this, arguments);
  };
}();

function socialApi(baseOptions) {
  _baseOptions$11 = baseOptions;

  return {
    /**
     * Get publishing channels for selected portal
     * @async
     * @memberof hs/social
     * @method getPublishingChannels
     * @example
     * const hs = new HubspotClient(props);
     * hs.social.getPublishingChannels().then(response => console.log(response));
     * @returns {Promise}
     */
    getPublishingChannels: getPublishingChannels,
    /**
     * Create a broadcast message
     * @async
     * @memberof hs/social
     * @method createBroadcastMessage
     * @param {object} opts
     * @example
     * const hs = new HubspotClient(props);
     * hs.social.createBroadcastMessage(opts).then(response => console.log(response));
     * @property {string} opts.channelGuid
     * @property {string} opts.status
     * @property {int} opts.triggerAt
     * @property {string} opts.body
     * @property {string} opts.photoUrl
     * @returns {Promise}
     */
    createBroadcastMessage: createBroadcastMessage
  };
}

var _this$12 = undefined;

var defaults$13 = {
  limit: 5
};
var _baseOptions$12 = void 0;

var getCampaignsWithRecentActivity = function () {
  var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var offset, limit, mergedProps, recentCampaigns;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

            requiresAuthentication(_baseOptions$12);
            offset = opts.offset, limit = opts.limit;
            mergedProps = Object.assign({}, defaults$13, _baseOptions$12, {
              offset: offset,
              limit: limit
            });
            _context.next = 6;
            return createRequest(constants.api.emailEvents.campaignsWithRecentActivity, {}, mergedProps);

          case 6:
            recentCampaigns = _context.sent;
            return _context.abrupt('return', Promise.resolve(recentCampaigns));

          case 10:
            _context.prev = 10;
            _context.t0 = _context['catch'](0);
            return _context.abrupt('return', Promise.reject(_context.t0.message));

          case 13:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this$12, [[0, 10]]);
  }));

  return function getCampaignsWithRecentActivity() {
    return _ref.apply(this, arguments);
  };
}();

var getCampaign = function () {
  var _ref2 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(campaignId, appId) {
    var mergedProps, campaignInfo;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;

            requiresAuthentication(_baseOptions$12);
            mergedProps = Object.assign({}, defaults$13, _baseOptions$12, { appId: appId });
            _context2.next = 5;
            return createRequest(constants.api.emailEvents.campaign, {
              campaignId: campaignId
            }, mergedProps);

          case 5:
            campaignInfo = _context2.sent;
            return _context2.abrupt('return', Promise.resolve(campaignInfo));

          case 9:
            _context2.prev = 9;
            _context2.t0 = _context2['catch'](0);
            return _context2.abrupt('return', Promise.reject(_context2.t0.message));

          case 12:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, _this$12, [[0, 9]]);
  }));

  return function getCampaign(_x2, _x3) {
    return _ref2.apply(this, arguments);
  };
}();

function emailEvents(baseOptions) {
  _baseOptions$12 = baseOptions;

  return {
    /**
     * For a given portal, return all campaign IDs sorted by recent activity associated with the portal.
     * @async
     * @memberof hs/emailEvents
     * @method getCampaignsWithRecentActivity
     * @param {object} opts
     * @example
     * const hs = new HubspotClient(props);
     * hs.emailEvents.getCampaignsWithRecentActivity(opts).then(response => console.log(response));
     * @property {int} opts.limit
     * @property {int} opts.offset
     * @returns {Promise}
     */
    getCampaignsWithRecentActivity: getCampaignsWithRecentActivity,
    /**
     * For a given campaign, return data associated with the campaign.
     * @async
     * @memberof hs/emailEvents
     * @method getCampaign
     * @param {int} campaignId Selected campaign id.
     * @param {int} appId The Application Id for the given email. Found in the get_campaigns endpoint.
     * @example
     * const hs = new HubspotClient(props);
     * hs.emailEvents.getCampaign(campaignId, appId).then(response => console.log(response));
     * @returns {Promise}
     */
    getCampaign: getCampaign
  };
}

var _this$13 = undefined;

var defaults$14 = {};
var _baseOptions$13 = void 0;

var getAll$2 = function () {
  var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var limit, offset, properties, propertiesWithHistory, allowedProps, mergedProps, allDeals;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

            requiresAuthentication(_baseOptions$13);
            limit = opts.limit, offset = opts.offset, properties = opts.properties, propertiesWithHistory = opts.propertiesWithHistory;
            allowedProps = { limit: limit, offset: offset, properties: properties, propertiesWithHistory: propertiesWithHistory };
            mergedProps = Object.assign({}, defaults$14, _baseOptions$13, allowedProps);
            _context.next = 7;
            return createRequest(constants.api.deals.getAll, {}, mergedProps);

          case 7:
            allDeals = _context.sent;
            return _context.abrupt('return', Promise.resolve(allDeals));

          case 11:
            _context.prev = 11;
            _context.t0 = _context['catch'](0);
            return _context.abrupt('return', Promise.reject(_context.t0.message));

          case 14:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this$13, [[0, 11]]);
  }));

  return function getAll() {
    return _ref.apply(this, arguments);
  };
}();

var getById$1 = function () {
  var _ref2 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(id) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var mergedProps, contact;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;

            requiresAuthentication(_baseOptions$13);
            mergedProps = Object.assign({}, defaults$14, _baseOptions$13, options);
            _context2.next = 5;
            return createRequest(constants.api.deals.byId, { id: id }, mergedProps);

          case 5:
            contact = _context2.sent;
            return _context2.abrupt('return', Promise.resolve(contact));

          case 9:
            _context2.prev = 9;
            _context2.t0 = _context2['catch'](0);
            return _context2.abrupt('return', Promise.reject(_context2.t0));

          case 12:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, _this$13, [[0, 9]]);
  }));

  return function getById(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

var getRecentlyCreated$1 = function () {
  var _ref3 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var count, offset, since, includePropertyVersions, allowedProps, mergedProps, recentlyCreatedDeals;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;

            requiresAuthentication(_baseOptions$13);
            count = opts.count, offset = opts.offset, since = opts.since, includePropertyVersions = opts.includePropertyVersions;
            allowedProps = { count: count, offset: offset, since: since, includePropertyVersions: includePropertyVersions };
            mergedProps = Object.assign({}, defaults$14, _baseOptions$13, allowedProps);
            _context3.next = 7;
            return createRequest(constants.api.deals.recentlyCreated, {}, mergedProps);

          case 7:
            recentlyCreatedDeals = _context3.sent;
            return _context3.abrupt('return', Promise.resolve(recentlyCreatedDeals));

          case 11:
            _context3.prev = 11;
            _context3.t0 = _context3['catch'](0);
            return _context3.abrupt('return', Promise.reject(_context3.t0.message));

          case 14:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, _this$13, [[0, 11]]);
  }));

  return function getRecentlyCreated() {
    return _ref3.apply(this, arguments);
  };
}();

var createOrUpdate = function () {
  var _ref4 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var mergedProps, id, properties, associations, method, url, body, options, deal;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.prev = 0;

            requiresAuthentication(_baseOptions$13);
            mergedProps = Object.assign({}, defaults$14, _baseOptions$13);
            id = opts.id, properties = opts.properties, associations = opts.associations;
            method = 'POST';
            url = constants.api.deals.create;
            body = { properties: properties, associations: associations };
            options = { method: method, body: body };

            if (id) {
              method = 'PUT';
              url = constants.api.deals.update;
              Object.assign(options, { method: method, id: id });
            }
            _context4.next = 11;
            return createRequest(url, options, mergedProps);

          case 11:
            deal = _context4.sent;
            return _context4.abrupt('return', Promise.resolve(deal));

          case 15:
            _context4.prev = 15;
            _context4.t0 = _context4['catch'](0);
            return _context4.abrupt('return', Promise.reject(_context4.t0.message));

          case 18:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, _this$13, [[0, 15]]);
  }));

  return function createOrUpdate() {
    return _ref4.apply(this, arguments);
  };
}();

var batchUpdate$1 = function () {
  var _ref5 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(updates) {
    var mergedProps, method, url;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.prev = 0;

            requiresAuthentication(_baseOptions$13);
            mergedProps = Object.assign({}, defaults$14, _baseOptions$13);
            method = 'POST';
            url = constants.api.deals.batchUpdate;
            _context5.next = 7;
            return createRequest(url, { method: method, body: updates }, mergedProps);

          case 7:
            return _context5.abrupt('return', Promise.resolve({ updated: true }));

          case 10:
            _context5.prev = 10;
            _context5.t0 = _context5['catch'](0);
            return _context5.abrupt('return', Promise.reject(_context5.t0.message));

          case 13:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, _this$13, [[0, 10]]);
  }));

  return function batchUpdate(_x6) {
    return _ref5.apply(this, arguments);
  };
}();

function deals(baseOptions) {
  _baseOptions$13 = baseOptions;

  return {
    /**
     * Get deal by ID
     * @async
     * @memberof hs/deals
     * @method getById
     * @param {int} id The id of the deal to retrieve
     * @param {object} properties Optional extra properties to add to the request - see {@link https://developers.hubspot.com/docs/methods/deals/get_deal|developer docs}
     * @example
     * const hs = new HubspotClient(props);
     * hs.deals.getById(123412313).then(response => console.log(response))
     * @returns {Promise}
     */
    getById: getById$1,
    /**
     * Get recently created deals
     * @async
     * @memberof hs/deals
     * @method getRecentlyCreated
     * @param {object} opts
     * @example
     * const hs = new HubspotClient(props);
     * hs.deals.getRecentlyCreated({
     *   count: 50,
     *   offset: 5,
     *   includePropertyVersions: true,
     *   since: 1463680280365
     * }).then(response => console.log(response));
     * @property {int} opts.count
     * @property {int} opts.offset
     * @property {int} opts.since
     * @property {boolean} opts.includePropertyVersions
     * @returns {Promise}
     */
    getRecentlyCreated: getRecentlyCreated$1,
    /**
     * Get all deals
     * @async
     * @memberof hs/deals
     * @method getAll
     * @param {object} opts
     * @example
     * const hs = new HubspotClient(props);
     * hs.deals.getRecentlyCreated({
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
    getAll: getAll$2,
    /**
     * Update a group of deals
     * @async
     * @memberof hs/deals
     * @method batchUpdate
     * @param {array} updates Array of objects. objectId corresponds with a dealId. See Example below.
     * @example
     * const hs = new HubspotClient(props);
     * const updates = [{
     *  "objectId": 93630457,
     *  "properties": [
     *    {
     *      "name": "dealname",
     *      "value": "Updated Deal Name"
     *    },
     *    {
     *      "name": "dealname",
     *      "value": "Updated Deal Name"
     *    }
     *  ]},
     *  {
     *  "objectId": 26448234,
     *  "properties": [
     *    {
     *      "name": "amount",
     *      "value": "2000"
     *    }
     *  ]
     * }]);
     * hs.deals.batchUpdate(updates).then(response => console.log(response));
     * @returns {Promise}
     * If successful the promise will resolve with { updated: true }. Otherwise the promise will resolve with an error message.
     */
    batchUpdate: batchUpdate$1,
    /**
     * Create or update a deal
     * @async
     * @memberof hs/deals
     * @method createOrUpdate
     * @param {object} opts
     * @example
     * const hs = new HubspotClient(props);
     * const updatedDealOpts = {
     *   id:93630457,
     *   properties: [
     *   {
     *     value: 'Update Deal Name',
     *     name: 'dealname'
     *   },
     *   {
     *     value: '200000',
     *     name: 'amount'
     *   }
     * ]};
     * hs.deals.createOrUpdate(updatedDealOpts).then(response => console.log(response));
     * const newDealOpts = {
     * associations: {
     *   associatedCompanyIds: 53333385
     * },
     * properties: [
     *   {
     *     value: 'Big Deal',
     *     name: 'dealname'
     *   },
     *   {
     *     value: 'appointmentscheduled',
     *     name: 'dealstage'
     *   },
     *   {
     *     value: 'default',
     *     name: 'pipeline'
     *   },
     *   {
     *     value: 1409443200000,
     *     name: 'closedate'
     *   },
     *   {
     *     value: '60000',
     *     name: 'amount'
     *   },
     *   {
     *     value: 'newbusiness',
     *     name: 'dealtype'
     *   }
     * ]
     *};
     * hs.deals.createOrUpdate(newDealOpts).then(response => console.log(response));
     * @property {int} opts.id
     * @property {array} opts.properties
     * @property {array} opts.associations
     * @property {boolean} opts.includePropertyVersions
     * @returns {Promise}
     */
    createOrUpdate: createOrUpdate
  };
}

var _this$14 = undefined;

var defaults$15 = {};
var _baseOptions$14 = void 0;

var createOrUpdatePage = function () {
  var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var id, archived, campaign, campaign_name, footer_html, head_html, is_draft, meta_description, meta_keywords, name, password, publish_date, publish_immediately, slug, subcategory, widget_containers, widgets, body, method, url, options, mergedProps, update;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

            requiresAuthentication(_baseOptions$14);
            id = opts.id, archived = opts.archived, campaign = opts.campaign, campaign_name = opts.campaign_name, footer_html = opts.footer_html, head_html = opts.head_html, is_draft = opts.is_draft, meta_description = opts.meta_description, meta_keywords = opts.meta_keywords, name = opts.name, password = opts.password, publish_date = opts.publish_date, publish_immediately = opts.publish_immediately, slug = opts.slug, subcategory = opts.subcategory, widget_containers = opts.widget_containers, widgets = opts.widgets;
            body = {
              archived: archived,
              campaign: campaign,
              campaign_name: campaign_name,
              footer_html: footer_html,
              head_html: head_html,
              is_draft: is_draft,
              meta_description: meta_description,
              meta_keywords: meta_keywords,
              name: name,
              password: password,
              publish_date: publish_date,
              publish_immediately: publish_immediately,
              slug: slug,
              subcategory: subcategory,
              widget_containers: widget_containers,
              widgets: widgets
            };
            method = 'POST';
            url = constants.api.pages.create;
            options = { method: method, body: body };

            if (id) {
              method = 'PUT';
              url = constants.api.pages.byId;
              Object.assign(options, { method: method, id: id });
            }

            mergedProps = Object.assign({}, defaults$15, _baseOptions$14);
            _context.next = 11;
            return createRequest(url, options, mergedProps);

          case 11:
            update = _context.sent;
            return _context.abrupt('return', Promise.resolve(update));

          case 15:
            _context.prev = 15;
            _context.t0 = _context['catch'](0);
            return _context.abrupt('return', Promise.reject(_context.t0.message));

          case 18:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this$14, [[0, 15]]);
  }));

  return function createOrUpdatePage() {
    return _ref.apply(this, arguments);
  };
}();

var getPages = function () {
  var _ref2 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var limit, offset, ab_test_id, archived, campaign, created, deleted_at, id, is_draft, name, publish_date, slug, subcategory, updated, additionalOpts, mergedProps, pages;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;

            requiresAuthentication(_baseOptions$14);
            limit = opts.limit, offset = opts.offset, ab_test_id = opts.ab_test_id, archived = opts.archived, campaign = opts.campaign, created = opts.created, deleted_at = opts.deleted_at, id = opts.id, is_draft = opts.is_draft, name = opts.name, publish_date = opts.publish_date, slug = opts.slug, subcategory = opts.subcategory, updated = opts.updated;
            additionalOpts = {
              limit: limit,
              offset: offset,
              ab_test_id: ab_test_id,
              archived: archived,
              campaign: campaign,
              created: created,
              deleted_at: deleted_at,
              id: id,
              is_draft: is_draft,
              name: name,
              publish_date: publish_date,
              slug: slug,
              subcategory: subcategory,
              updated: updated
            };

            // Extract additional dynamic querystring params and values.

            additionalOpts = queryStringParamInterpolator({
              created: created,
              deleted_at: deleted_at,
              name: name,
              publish_date: publish_date,
              updated: updated,
              slug: slug
            }, additionalOpts);

            mergedProps = Object.assign({}, defaults$15, _baseOptions$14, additionalOpts);
            _context2.next = 8;
            return createRequest(constants.api.pages.list, {}, mergedProps);

          case 8:
            pages = _context2.sent;
            return _context2.abrupt('return', Promise.resolve(pages));

          case 12:
            _context2.prev = 12;
            _context2.t0 = _context2['catch'](0);
            return _context2.abrupt('return', Promise.reject(_context2.t0.message));

          case 15:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, _this$14, [[0, 12]]);
  }));

  return function getPages() {
    return _ref2.apply(this, arguments);
  };
}();

var deletePage = function () {
  var _ref3 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(id) {
    var mergedProps;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;

            requiresAuthentication(_baseOptions$14);
            mergedProps = Object.assign({}, defaults$15, _baseOptions$14);
            _context3.next = 5;
            return createRequest(constants.api.pages.byId, { id: id, method: 'DELETE' }, mergedProps);

          case 5:
            return _context3.abrupt('return', Promise.resolve({ deleted: true }));

          case 8:
            _context3.prev = 8;
            _context3.t0 = _context3['catch'](0);
            return _context3.abrupt('return', Promise.reject(_context3.t0.message));

          case 11:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, _this$14, [[0, 8]]);
  }));

  return function deletePage(_x3) {
    return _ref3.apply(this, arguments);
  };
}();

var getPageById = function () {
  var _ref4 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(id) {
    var mergedProps, page;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.prev = 0;

            requiresAuthentication(_baseOptions$14);
            mergedProps = Object.assign({}, defaults$15, _baseOptions$14);
            _context4.next = 5;
            return createRequest(constants.api.pages.byId, { id: id }, mergedProps);

          case 5:
            page = _context4.sent;
            return _context4.abrupt('return', Promise.resolve(page));

          case 9:
            _context4.prev = 9;
            _context4.t0 = _context4['catch'](0);
            return _context4.abrupt('return', Promise.reject(_context4.t0.message));

          case 12:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, _this$14, [[0, 9]]);
  }));

  return function getPageById(_x4) {
    return _ref4.apply(this, arguments);
  };
}();

var updateAutosaveBuffer$1 = function () {
  var _ref5 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var id, campaign, campaign_name, footer_html, head_html, is_draft, meta_description, meta_keywords, name, password, publish_date, publish_immediately, slug, subcategory, widget_containers, widgets, mergedProps, body, method, buffer;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.prev = 0;

            requiresAuthentication(_baseOptions$14);
            id = opts.id, campaign = opts.campaign, campaign_name = opts.campaign_name, footer_html = opts.footer_html, head_html = opts.head_html, is_draft = opts.is_draft, meta_description = opts.meta_description, meta_keywords = opts.meta_keywords, name = opts.name, password = opts.password, publish_date = opts.publish_date, publish_immediately = opts.publish_immediately, slug = opts.slug, subcategory = opts.subcategory, widget_containers = opts.widget_containers, widgets = opts.widgets;

            if (id) {
              _context5.next = 5;
              break;
            }

            throw new Error('No page ID specified');

          case 5:
            mergedProps = Object.assign({}, defaults$15, _baseOptions$14);
            body = {
              campaign: campaign,
              campaign_name: campaign_name,
              footer_html: footer_html,
              head_html: head_html,
              is_draft: is_draft,
              meta_description: meta_description,
              meta_keywords: meta_keywords,
              name: name,
              password: password,
              publish_date: publish_date,
              publish_immediately: publish_immediately,
              slug: slug,
              subcategory: subcategory,
              widget_containers: widget_containers,
              widgets: widgets
            };
            method = 'PUT';
            _context5.next = 10;
            return createRequest(constants.api.pages.buffer, { id: id, method: method, body: body }, mergedProps);

          case 10:
            buffer = _context5.sent;
            return _context5.abrupt('return', Promise.resolve(buffer));

          case 14:
            _context5.prev = 14;
            _context5.t0 = _context5['catch'](0);
            return _context5.abrupt('return', Promise.reject(_context5.t0.message));

          case 17:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, _this$14, [[0, 14]]);
  }));

  return function updateAutosaveBuffer() {
    return _ref5.apply(this, arguments);
  };
}();

var getPageAutosaveBuffer = function () {
  var _ref6 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(id) {
    var mergedProps, buffer;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.prev = 0;

            requiresAuthentication(_baseOptions$14);
            mergedProps = Object.assign({}, defaults$15, _baseOptions$14);
            _context6.next = 5;
            return createRequest(constants.api.pages.buffer, { id: id }, mergedProps);

          case 5:
            buffer = _context6.sent;
            return _context6.abrupt('return', Promise.resolve(buffer));

          case 9:
            _context6.prev = 9;
            _context6.t0 = _context6['catch'](0);
            return _context6.abrupt('return', Promise.reject(_context6.t0.message));

          case 12:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, _this$14, [[0, 9]]);
  }));

  return function getPageAutosaveBuffer(_x6) {
    return _ref6.apply(this, arguments);
  };
}();

var clonePage = function () {
  var _ref7 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(id) {
    var mergedProps, method;
    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.prev = 0;

            requiresAuthentication(_baseOptions$14);
            mergedProps = Object.assign({}, defaults$15, _baseOptions$14);
            method = 'POST';
            _context7.next = 6;
            return createRequest(constants.api.pages.clone, { id: id, method: method }, mergedProps);

          case 6:
            return _context7.abrupt('return', Promise.resolve({ cloned: true }));

          case 9:
            _context7.prev = 9;
            _context7.t0 = _context7['catch'](0);
            return _context7.abrupt('return', Promise.reject(_context7.t0.message));

          case 12:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, _this$14, [[0, 9]]);
  }));

  return function clonePage(_x7) {
    return _ref7.apply(this, arguments);
  };
}();

var hasBufferedChanges$1 = function () {
  var _ref8 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(id) {
    var mergedProps, bufferedChanges;
    return regeneratorRuntime.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.prev = 0;

            requiresAuthentication(_baseOptions$14);
            mergedProps = Object.assign({}, defaults$15, _baseOptions$14);
            _context8.next = 5;
            return createRequest(constants.api.pages.bufferedChanges, { id: id }, mergedProps);

          case 5:
            bufferedChanges = _context8.sent;
            return _context8.abrupt('return', Promise.resolve(bufferedChanges));

          case 9:
            _context8.prev = 9;
            _context8.t0 = _context8['catch'](0);
            return _context8.abrupt('return', Promise.reject(_context8.t0.message));

          case 12:
          case 'end':
            return _context8.stop();
        }
      }
    }, _callee8, _this$14, [[0, 9]]);
  }));

  return function hasBufferedChanges(_x8) {
    return _ref8.apply(this, arguments);
  };
}();

var doPublishAction = function () {
  var _ref9 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(id, action) {
    var mergedProps, body, method;
    return regeneratorRuntime.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            _context9.prev = 0;

            requiresAuthentication(_baseOptions$14);
            mergedProps = Object.assign({}, defaults$15, _baseOptions$14);
            body = { action: action };
            method = 'POST';
            _context9.next = 7;
            return createRequest(constants.api.pages.publishAction, { id: id, method: method, body: body }, mergedProps);

          case 7:
            return _context9.abrupt('return', Promise.resolve({ success: true, action: action }));

          case 10:
            _context9.prev = 10;
            _context9.t0 = _context9['catch'](0);
            return _context9.abrupt('return', Promise.reject(_context9.t0.message));

          case 13:
          case 'end':
            return _context9.stop();
        }
      }
    }, _callee9, _this$14, [[0, 10]]);
  }));

  return function doPublishAction(_x9, _x10) {
    return _ref9.apply(this, arguments);
  };
}();

var pushBufferLive = function () {
  var _ref10 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(id) {
    var mergedProps;
    return regeneratorRuntime.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            _context10.prev = 0;

            requiresAuthentication(_baseOptions$14);
            mergedProps = Object.assign({}, defaults$15, _baseOptions$14);
            _context10.next = 5;
            return createRequest(constants.api.pages.pushBufferLive, { id: id, method: 'POST' }, mergedProps);

          case 5:
            return _context10.abrupt('return', Promise.resolve({ success: true }));

          case 8:
            _context10.prev = 8;
            _context10.t0 = _context10['catch'](0);
            return _context10.abrupt('return', Promise.reject(_context10.t0.message));

          case 11:
          case 'end':
            return _context10.stop();
        }
      }
    }, _callee10, _this$14, [[0, 8]]);
  }));

  return function pushBufferLive(_x11) {
    return _ref10.apply(this, arguments);
  };
}();

var restoreDeleted = function () {
  var _ref11 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee11(id) {
    var mergedProps;
    return regeneratorRuntime.wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            _context11.prev = 0;

            requiresAuthentication(_baseOptions$14);
            mergedProps = Object.assign({}, defaults$15, _baseOptions$14);
            _context11.next = 5;
            return createRequest(constants.api.pages.restoreDeleted, { id: id, method: 'POST' }, mergedProps);

          case 5:
            return _context11.abrupt('return', Promise.resolve({ success: true }));

          case 8:
            _context11.prev = 8;
            _context11.t0 = _context11['catch'](0);
            return _context11.abrupt('return', Promise.reject(_context11.t0.message));

          case 11:
          case 'end':
            return _context11.stop();
        }
      }
    }, _callee11, _this$14, [[0, 8]]);
  }));

  return function restoreDeleted(_x12) {
    return _ref11.apply(this, arguments);
  };
}();

var validatePageAutoSaveBuffer = function () {
  var _ref12 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee12(id) {
    var mergedProps;
    return regeneratorRuntime.wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            _context12.prev = 0;

            requiresAuthentication(_baseOptions$14);
            mergedProps = Object.assign({}, defaults$15, _baseOptions$14);
            _context12.next = 5;
            return createRequest(constants.api.pages.validateBuffer, { id: id, method: 'POST' }, mergedProps);

          case 5:
            return _context12.abrupt('return', Promise.resolve({ success: true }));

          case 8:
            _context12.prev = 8;
            _context12.t0 = _context12['catch'](0);
            return _context12.abrupt('return', Promise.reject(_context12.t0.message));

          case 11:
          case 'end':
            return _context12.stop();
        }
      }
    }, _callee12, _this$14, [[0, 8]]);
  }));

  return function validatePageAutoSaveBuffer(_x13) {
    return _ref12.apply(this, arguments);
  };
}();

var getPageVersions = function () {
  var _ref13 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee13(id) {
    var mergedProps, versions;
    return regeneratorRuntime.wrap(function _callee13$(_context13) {
      while (1) {
        switch (_context13.prev = _context13.next) {
          case 0:
            _context13.prev = 0;

            requiresAuthentication(_baseOptions$14);
            mergedProps = Object.assign({}, defaults$15, _baseOptions$14);
            _context13.next = 5;
            return createRequest(constants.api.pages.versions, { id: id }, mergedProps);

          case 5:
            versions = _context13.sent;
            return _context13.abrupt('return', Promise.resolve(versions));

          case 9:
            _context13.prev = 9;
            _context13.t0 = _context13['catch'](0);
            return _context13.abrupt('return', Promise.reject(_context13.t0.message));

          case 12:
          case 'end':
            return _context13.stop();
        }
      }
    }, _callee13, _this$14, [[0, 9]]);
  }));

  return function getPageVersions(_x14) {
    return _ref13.apply(this, arguments);
  };
}();

var restorePageVersion = function () {
  var _ref14 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee14(id, version_id) {
    var mergedProps, body, method, versions;
    return regeneratorRuntime.wrap(function _callee14$(_context14) {
      while (1) {
        switch (_context14.prev = _context14.next) {
          case 0:
            _context14.prev = 0;

            requiresAuthentication(_baseOptions$14);
            mergedProps = Object.assign({}, defaults$15, _baseOptions$14);
            body = { version_id: version_id };
            method = 'POST';
            _context14.next = 7;
            return createRequest(constants.api.pages.restoreVersion, { id: id, body: body, method: method }, mergedProps);

          case 7:
            versions = _context14.sent;
            return _context14.abrupt('return', Promise.resolve(versions));

          case 11:
            _context14.prev = 11;
            _context14.t0 = _context14['catch'](0);
            return _context14.abrupt('return', Promise.reject(_context14.t0.message));

          case 14:
          case 'end':
            return _context14.stop();
        }
      }
    }, _callee14, _this$14, [[0, 11]]);
  }));

  return function restorePageVersion(_x15, _x16) {
    return _ref14.apply(this, arguments);
  };
}();

function pagesApi(baseOptions) {
  _baseOptions$14 = baseOptions;

  return {
    /**
     * Create a new page or update an existing page
     * @async
     * @memberof hs/pages
     * @method createOrUpdatePage
     * @param {object} opts
     * @example
     * const hs = new HubspotClient(props);
     * hs.pages.createOrUpdatePage(opts).then(response => console.log(response));
     * @property {int} opts.id If set, this will update the page with the corresponding ID.
     * @property {string} opts.campaign
     * @property {string} opts.campaign_name
     * @property {string} opts.footer_html
     * @property {string} opts.head_html
     * @property {string} opts.is_draft
     * @property {string} opts.meta_description
     * @property {string} opts.meta_keywords
     * @property {string} opts.name
     * @property {string} opts.password
     * @property {long} opts.publish_date
     * @property {string} opts.publish_immediately
     * @property {string} opts.slug
     * @property {string} opts.subcategory
     * @property {string} opts.widget_containers
     * @property {string} opts.widgets
     * @returns {Promise}
     */
    createOrUpdatePage: createOrUpdatePage,
    /**
     * Get a collection of pages
     * @async
     * @memberof hs/pages
     * @method getPages
     * @param {object} opts
     * @example
     * const hs = new HubspotClient(props);
     * hs.pages.getPages(opts).then(response => console.log(response));
     * @property {string} opts.limit
     * @property {string} opts.offset
     * @property {string} opts.ab_test_id
     * @property {boolean} opts.archived
     * @property {string} opts.campaign
     * @property {string} opts.created
     * @property {string} opts.deleted_at
     * @property {int} opts.id
     * @property {boolean} opts.is_draft
     * @property {string} opts.name
     * @property {long} opts.publish_date
     * @property {string} opts.slug
     * @property {string} opts.subcategory
     * @property {string} opts.updated
     * @returns {Promise}
     */
    getPages: getPages,
    /**
     * Remove a page
     * @async
     * @memberof hs/pages
     * @method deletePage
     * @param {int} id
     * @example
     * const hs = new HubspotClient(props);
     * hs.pages.deletePage(id).then(response => console.log(response))
     * @returns {Promise}
     */
    deletePage: deletePage,
    /**
     * Retrieve page info by ID
     * @async
     * @memberof hs/pages
     * @method getPageById
     * @param {int} id
     * @example
     * const hs = new HubspotClient(props);
     * hs.pages.getPageById(id).then(response => console.log(response))
     * @returns {Promise}
     */
    getPageById: getPageById,
    /**
     * Update the autosave buffer for a page
     * @async
     * @memberof hs/pages
     * @method updateAutosaveBuffer
     * @param {object} opts
     * @example
     * const hs = new HubspotClient(props);
     * hs.pages.updateAutosaveBuffer(opts).then(response => console.log(response))
     * @property {int} opts.id If set, this will update the page with the corresponding ID.
     * @property {string} opts.campaign
     * @property {string} opts.campaign_name
     * @property {string} opts.footer_html
     * @property {string} opts.head_html
     * @property {boolean} opts.is_draft
     * @property {string} opts.meta_description
     * @property {string} opts.meta_keywords
     * @property {string} opts.name
     * @property {string} opts.password
     * @property {long} opts.publish_date
     * @property {boolean} opts.publish_immediately
     * @property {string} opts.slug
     * @property {string} opts.subcategory
     * @property {string} opts.widget_containers
     * @property {string} opts.widgets
     * @returns {Promise}
     */
    updateAutosaveBuffer: updateAutosaveBuffer$1,
    /**
     * Retrieve page autosave buffer contents
     * @async
     * @memberof hs/pages
     * @method getPageAutosaveBuffer
     * @param {int} pageId
     * @example
     * const hs = new HubspotClient(props);
     * hs.pages.getPageAutosaveBuffer(pageId).then(response => console.log(response))
     * @returns {Promise}
     */
    getPageAutosaveBuffer: getPageAutosaveBuffer,
    /**
     * Clones a page
     * @async
     * @memberof hs/pages
     * @method clonePage
     * @param {int} id
     * @example
     * const hs = new HubspotClient(props);
     * hs.pages.clonePage(id).then(response => console.log(response))
     * @returns {Promise}
     */
    clonePage: clonePage,
    /**
     * Determine if the auto-save buffer differs from the live page
     * @async
     * @memberof hs/pages
     * @method hasBufferedChanges
     * @param {int} pageId
     * @example
     * const hs = new HubspotClient(props);
     * hs.pages.hasBufferedChanges(pageId).then(response => console.log(response))
     * @returns {Promise}
     */
    hasBufferedChanges: hasBufferedChanges$1,
    /**
     * Carries out a publish action with the current page. Check out {@link https://developers.hubspot.com/docs/methods/pages/post_pages_page_id_publish_action|the developer docs} for further info.
     * @async
     * @memberof hs/pages
     * @method doPublishAction
     * @param {int} pageId
     * @param {string} publishAction One of `push-buffer-live`, `schedule-publish` or `cancel-publish`
     * @example
     * const hs = new HubspotClient(props);
     * hs.pages.doPublishAction(pageId, publishAction).then(response => console.log(response))
     * @returns {Promise}
     */
    doPublishAction: doPublishAction,
    /**
     * Copies the contents of the auto-save buffer into the live Page
     * @async
     * @memberof hs/pages
     * @method pushBufferLive
     * @param {int} id
     * @example
     * const hs = new HubspotClient(props);
     * hs.pages.pushBufferLive(id).then(response => console.log(response))
     * @returns {Promise}
     */
    pushBufferLive: pushBufferLive,
    /**
     * Restores a previously deleted Page
     * @async
     * @memberof hs/pages
     * @method restoreDeleted
     * @param {int} id
     * @example
     * const hs = new HubspotClient(props);
     * hs.pages.restoreDeleted(id).then(response => console.log(response))
     * @returns {Promise}
     */
    restoreDeleted: restoreDeleted,
    /**
     * Validates the auto-save buffer version of the Page
     * @async
     * @memberof hs/pages
     * @method validatePageAutoSaveBuffer
     * @param {int} id
     * @example
     * const hs = new HubspotClient(props);
     * hs.pages.validatePageAutoSaveBuffer(id).then(response => console.log(response))
     * @returns {Promise}
     */
    validatePageAutoSaveBuffer: validatePageAutoSaveBuffer,
    /**
     * List previous versions of a Page
     * @async
     * @memberof hs/pages
     * @method getPageVersions
     * @param {int} id
     * @example
     * const hs = new HubspotClient(props);
     * hs.pages.getPageVersions(id).then(response => console.log(response))
     * @returns {Promise}
     */
    getPageVersions: getPageVersions,
    /**
     * Restore a previous version of a Page
     * @async
     * @memberof hs/pages
     * @method restorePageVersion
     * @param {int} pageId
     * @param {int} versionId
     * @example
     * const hs = new HubspotClient(props);
     * hs.pages.restorePageVersion(pageId, versionId).then(response => console.log(response))
     * @returns {Promise}
     */
    restorePageVersion: restorePageVersion
  };
}

var _this$15 = undefined;

var defaults$16 = {};
var _baseOptions$15 = void 0;

var createTable = function () {
  var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var name, useForPages, columns, publishedAt, body, method, url, options, mergedProps, create;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

            requiresAuthentication(_baseOptions$15);
            name = opts.name, useForPages = opts.useForPages, columns = opts.columns, publishedAt = opts.publishedAt;
            body = {
              name: name,
              useForPages: useForPages,
              columns: columns,
              publishedAt: publishedAt
            };
            method = 'POST';
            url = constants.api.hubdb.tables;
            options = { method: method, body: body };
            mergedProps = Object.assign({}, defaults$16, _baseOptions$15);
            _context.next = 10;
            return createRequest(url, options, mergedProps);

          case 10:
            create = _context.sent;
            return _context.abrupt('return', Promise.resolve(create));

          case 14:
            _context.prev = 14;
            _context.t0 = _context['catch'](0);
            return _context.abrupt('return', Promise.reject(_context.t0.message));

          case 17:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this$15, [[0, 14]]);
  }));

  return function createTable() {
    return _ref.apply(this, arguments);
  };
}();

var getTables = function () {
  var _ref2 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
    var mergedProps, tables;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;

            requiresAuthentication(_baseOptions$15);
            mergedProps = Object.assign({}, defaults$16, _baseOptions$15);
            _context2.next = 5;
            return createRequest(constants.api.hubdb.tables, {}, mergedProps);

          case 5:
            tables = _context2.sent;
            return _context2.abrupt('return', Promise.resolve(tables));

          case 9:
            _context2.prev = 9;
            _context2.t0 = _context2['catch'](0);
            return _context2.abrupt('return', Promise.reject(_context2.t0.message));

          case 12:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, _this$15, [[0, 9]]);
  }));

  return function getTables() {
    return _ref2.apply(this, arguments);
  };
}();

var getTableRows = function () {
  var _ref3 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(tableId, portalId) {
    var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var additionalOpts, mergedProps, rows;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;
            additionalOpts = { portalId: portalId };
            mergedProps = Object.assign({}, defaults$16, _baseOptions$15, opts, additionalOpts);
            _context3.next = 5;
            return createRequest(constants.api.hubdb.rows, { tableId: tableId }, mergedProps);

          case 5:
            rows = _context3.sent;
            return _context3.abrupt('return', Promise.resolve({ published: true, rows: rows }));

          case 9:
            _context3.prev = 9;
            _context3.t0 = _context3['catch'](0);
            return _context3.abrupt('return', Promise.reject(_context3.t0.message));

          case 12:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, _this$15, [[0, 9]]);
  }));

  return function getTableRows(_x2, _x3) {
    return _ref3.apply(this, arguments);
  };
}();

var publishTable = function () {
  var _ref4 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(tableId) {
    var mergedProps, method, table;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.prev = 0;

            requiresAuthentication(_baseOptions$15);
            mergedProps = Object.assign({}, defaults$16, _baseOptions$15);
            method = 'PUT';
            _context4.next = 6;
            return createRequest(constants.api.hubdb.publishTable, { tableId: tableId, method: method }, mergedProps);

          case 6:
            table = _context4.sent;
            return _context4.abrupt('return', Promise.resolve(table));

          case 10:
            _context4.prev = 10;
            _context4.t0 = _context4['catch'](0);
            return _context4.abrupt('return', Promise.reject(_context4.t0.message));

          case 13:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, _this$15, [[0, 10]]);
  }));

  return function publishTable(_x5) {
    return _ref4.apply(this, arguments);
  };
}();

var getTableById = function () {
  var _ref5 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(tableId, portalId) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var additionalOpts, mergedProps, table;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.prev = 0;
            additionalOpts = { portalId: portalId };
            mergedProps = Object.assign({}, defaults$16, _baseOptions$15, options, additionalOpts);
            _context5.next = 5;
            return createRequest(constants.api.hubdb.table, { tableId: tableId }, mergedProps);

          case 5:
            table = _context5.sent;
            return _context5.abrupt('return', Promise.resolve(table));

          case 9:
            _context5.prev = 9;
            _context5.t0 = _context5['catch'](0);
            return _context5.abrupt('return', Promise.reject(_context5.t0.message));

          case 12:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, _this$15, [[0, 9]]);
  }));

  return function getTableById(_x6, _x7) {
    return _ref5.apply(this, arguments);
  };
}();

var addTableRow = function () {
  var _ref6 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(tableId) {
    var body = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var method, url, options, mergedProps, add;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.prev = 0;

            requiresAuthentication(_baseOptions$15);
            method = 'POST';
            url = constants.api.hubdb.rows;
            options = { tableId: tableId, method: method, body: body };
            mergedProps = Object.assign({}, defaults$16, _baseOptions$15);
            _context6.next = 8;
            return createRequest(url, options, mergedProps);

          case 8:
            add = _context6.sent;
            return _context6.abrupt('return', Promise.resolve(add));

          case 12:
            _context6.prev = 12;
            _context6.t0 = _context6['catch'](0);
            return _context6.abrupt('return', Promise.reject(_context6.t0.message));

          case 15:
          case 'end':
            return _context6.stop();
        }
      }
    }, _callee6, _this$15, [[0, 12]]);
  }));

  return function addTableRow(_x9) {
    return _ref6.apply(this, arguments);
  };
}();

var updateTableRow = function () {
  var _ref7 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(tableId, rowId) {
    var body = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var method, url, options, mergedProps, update;
    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.prev = 0;

            requiresAuthentication(_baseOptions$15);
            method = 'PUT';
            url = constants.api.hubdb.row;
            options = { tableId: tableId, id: rowId, method: method, body: body };
            mergedProps = Object.assign({}, defaults$16, _baseOptions$15);
            _context7.next = 8;
            return createRequest(url, options, mergedProps);

          case 8:
            update = _context7.sent;
            return _context7.abrupt('return', Promise.resolve(update));

          case 12:
            _context7.prev = 12;
            _context7.t0 = _context7['catch'](0);
            return _context7.abrupt('return', Promise.reject(_context7.t0.message));

          case 15:
          case 'end':
            return _context7.stop();
        }
      }
    }, _callee7, _this$15, [[0, 12]]);
  }));

  return function updateTableRow(_x11, _x12) {
    return _ref7.apply(this, arguments);
  };
}();

var deleteTableRow = function () {
  var _ref8 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(tableId, rowId) {
    var body = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var method, url, options, mergedProps, update;
    return regeneratorRuntime.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.prev = 0;

            requiresAuthentication(_baseOptions$15);
            method = 'DELETE';
            url = constants.api.hubdb.row;
            options = { tableId: tableId, id: rowId, method: method, body: body };
            mergedProps = Object.assign({}, defaults$16, _baseOptions$15);
            _context8.next = 8;
            return createRequest(url, options, mergedProps);

          case 8:
            update = _context8.sent;
            return _context8.abrupt('return', Promise.resolve(update));

          case 12:
            _context8.prev = 12;
            _context8.t0 = _context8['catch'](0);
            return _context8.abrupt('return', Promise.reject(_context8.t0.message));

          case 15:
          case 'end':
            return _context8.stop();
        }
      }
    }, _callee8, _this$15, [[0, 12]]);
  }));

  return function deleteTableRow(_x14, _x15) {
    return _ref8.apply(this, arguments);
  };
}();

function hubdbApi(baseOptions) {
  _baseOptions$15 = baseOptions;

  return {
    /**
     * Create a new HubDB table
     * @async
     * @memberof hs/hubdb
     * @method createTable
     * @param {object} opts
     * @example
     * const hs = new HubSpotClient(props);
     * hs.pages.createTable(opts).then(response => console.log(response));
     * @property {string} opts.name
     * @property {boolean} opts.useForPages
     * @property {array} opts.columns
     * @property {int} opts.publishedAt
     * @returns {Promise}
     */
    createTable: createTable,
    /**
     * Get a collection of HubDB tables
     * @async
     * @memberof hs/hubdb
     * @method getTables
     * @example
     * const hs = new HubSpotClient(props);
     * hs.hubdb.getTables(opts).then(response => console.log(response));
     * @returns {Promise}
     */
    getTables: getTables,
    /**
     * Get rows in a HubDB table
     * @async
     * @memberof hs/hubdb
     * @method getTableRows
     * @param {int} tableId
     * @param {int} portalId
     * @param {object} options
     * @example
     * const hs = new HubSpotClient(props);
     * hs.pages.getTableRows(tableId, portalId, options).then(response => console.log(response))
     * @returns {Promise}
     */
    getTableRows: getTableRows,
    /**
     * Retrieve HubDB table by ID
     * @async
     * @memberof hs/hubdb
     * @method getTableById
     * @param {int} tableId
     * @param {int} portalId
     * @param {object} options
     * @example
     * const hs = new HubSpotClient(props);
     * hs.hubdb.getTableById(tableId, portalId, options).then(response => console.log(response))
     * @returns {Promise}
     */
    getTableById: getTableById,
    /**
     * Add row to a HubDB table
     * @async
     * @memberof hs/hubdb
     * @method addTableRow
     * @param {int} tableId
     * @param {object} options
     * @example
     * const hs = new HubSpotClient(props);
     * hs.hubdb.addTableRow(tableId, options).then(response => console.log(response))
     * @returns {Promise}
     */
    addTableRow: addTableRow,
    /**
     * Update row in a HubDB table
     * @async
     * @memberof hs/hubdb
     * @method updateTableRow
     * @param {int} tableId
     * @param {int} rowId
     * @param {object} options
     * @example
     * const hs = new HubSpotClient(props);
     * hs.hubdb.updateTableRow(tableId, rowId, options).then(response => console.log(response))
     * @returns {Promise}
     */
    updateTableRow: updateTableRow,
    /**
     * Delete row from a HubDB table
     * @async
     * @memberof hs/hubdb
     * @method deleteTableRow
     * @param {int} tableId
     * @param {int} rowId
     * @param {object} options
     * @example
     * const hs = new HubSpotClient(props);
     * hs.hubdb.deleteTableRow(tableId, rowId, options).then(response => console.log(response))
     * @returns {Promise}
     */
    deleteTableRow: deleteTableRow,
    /**
     * Publish a draft table
     * @async
     * @memberof hs/hubdb
     * @method publishTable
     * @param {int} tableId
     * @example
     * const hs = new HubSpotClient(props);
     * hs.hubdb.publishTable(tableId).then(response => console.log(response))
     * @returns {Promise}
     */
    publishTable: publishTable
  };
}

var _this$16 = undefined;

var defaults$17 = {};
var _baseOptions$16 = void 0;

var create$1 = function () {
  var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var mergedProps, method, url, body, options, result;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

            requiresAuthentication(_baseOptions$16);
            mergedProps = Object.assign({}, defaults$17, _baseOptions$16);
            method = 'POST';
            url = constants.api.engagements.create;
            body = _extends({}, opts);
            options = { method: method, body: body };
            _context.next = 9;
            return createRequest(url, options, mergedProps);

          case 9:
            result = _context.sent;
            return _context.abrupt('return', Promise.resolve(result));

          case 13:
            _context.prev = 13;
            _context.t0 = _context['catch'](0);
            return _context.abrupt('return', Promise.reject(_context.t0.message));

          case 16:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this$16, [[0, 13]]);
  }));

  return function create() {
    return _ref.apply(this, arguments);
  };
}();

function engagements(baseOptions) {
  _baseOptions$16 = baseOptions;

  return {
    /**
     * Create an engagement
     * @async
     * @memberof hs/engagements
     * @method create
     * @param {object} opts
     * @example
     * const hs = new HubspotClient(props);
     * const newEngagementOpts = {
     * engagement: {
     *   type: 'NOTE',
     *   active: true,
     *   timestamp: new Date().getTime()
     * },
     * associations: {
     *   companyIds: [53333385]
     * },
     * metadata: {
     *   body: 'A note about robot'
     * }
     *};
     * hs.engagements.create(newEngagementOpts).then(response => console.log(response));
     * @property {object} opts.engagement
     * @property {object} opts.associations
     * @property {object} opts.metadata
     * @property {array} opts.attachments
     * @returns {Promise}
     */
    create: create$1
  };
}

var _this$17 = undefined;

var getTokenInfo = function () {
  var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(token) {
    var info;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return createRequest(constants.api.oauth.tokenInfo, { token: token });

          case 3:
            info = _context.sent;
            return _context.abrupt('return', Promise.resolve(info));

          case 7:
            _context.prev = 7;
            _context.t0 = _context['catch'](0);
            return _context.abrupt('return', Promise.reject(_context.t0.message));

          case 10:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this$17, [[0, 7]]);
  }));

  return function getTokenInfo(_x) {
    return _ref.apply(this, arguments);
  };
}();

function oauthApi() {
  return {
    /**
     * Get the meta data for an access token. This can be used to get the email address of the HubSpot * user that the token was created for.
     * @memberof hs/oauth
     * @method getTokenInfo
     * @param {string} token  The access token that you want to get the information for.
     * @example
     * const hs = new HubspotClient(props);
     * hs.oauth.getTokenInfo(token).then(response => console.log(response));
     * @returns {Promise}
     */
    getTokenInfo: getTokenInfo
  };
}

var _this$18 = undefined;

var debug$3 = require('debug')('hubspot-api:tests'); // eslint-disable-line
var _baseOptions$17 = void 0;

var defaults$18 = {
  propertyMode: 'value_only',
  formSubmissionMode: 'none'
};

var getById$2 = function () {
  var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(listId) {
    var mergedProps, list;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

            requiresAuthentication(_baseOptions$17);
            mergedProps = Object.assign({}, _baseOptions$17);
            _context.next = 5;
            return createRequest(constants.api.contactsList.byId, { listId: listId }, mergedProps);

          case 5:
            list = _context.sent;
            return _context.abrupt('return', Promise.resolve(list));

          case 9:
            _context.prev = 9;
            _context.t0 = _context['catch'](0);
            return _context.abrupt('return', Promise.reject(_context.t0));

          case 12:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this$18, [[0, 9]]);
  }));

  return function getById(_x) {
    return _ref.apply(this, arguments);
  };
}();

var getContactsInList = function () {
  var _ref2 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(listId) {
    var opts = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var mergedProps, contacts;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;

            requiresAuthentication(_baseOptions$17);
            mergedProps = _extends({}, _baseOptions$17, defaults$18, opts);
            _context2.next = 5;
            return createRequest(constants.api.contactsList.contactsByListId, { listId: listId }, mergedProps);

          case 5:
            contacts = _context2.sent;
            return _context2.abrupt('return', Promise.resolve(contacts));

          case 9:
            _context2.prev = 9;
            _context2.t0 = _context2['catch'](0);
            return _context2.abrupt('return', Promise.reject(_context2.t0));

          case 12:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, _this$18, [[0, 9]]);
  }));

  return function getContactsInList(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

function contactsListsApi(baseOptions) {
  _baseOptions$17 = baseOptions;
  // API
  return {
    /**
     * Get contact list by ID
     * @async
     * @memberof hs/contactsLists
     * @method getById
     * @param {int} list The id of the list to retrieve
     * @example
     * const hs = new HubspotClient(props);
     * hs.contactsList.getById(123412313).then(response => console.log(response))
     * @returns {Promise}
     */
    getById: getById$2,
    /**
    * Get contacts in list
    * @async
    * @memberof hs/contactsLists
    * @method getContactsInList
    * @param {int} list The id of the list to retrieve
    * @param {object} properties Optional extra properties to add to the request - see {@link https://developers.hubspot.com/docs/methods/lists/get_list_contacts|developer docs}
    * @example
    * const hs = new HubspotClient(props);
    * hs.contactsList.getContactsInList(123412313).then(response => console.log(response))
    * @returns {Promise}
    */
    getContactsInList: getContactsInList
  };
}

var _this$19 = undefined;

var defaults$19 = {};
var _baseOptions$18 = void 0;

var updateEmailSubscription = function () {
  var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(email) {
    var body = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var mergedProps, updateStatus;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

            requiresAuthentication(_baseOptions$18);

            if (email) {
              _context.next = 4;
              break;
            }

            throw new Error('Email is a required field');

          case 4:
            mergedProps = _extends({}, defaults$19, _baseOptions$18);
            _context.next = 7;
            return createRequest(constants.api.emailSubscriptions.updateStatus, { body: body, method: 'PUT', email: email }, mergedProps);

          case 7:
            updateStatus = _context.sent;
            return _context.abrupt('return', Promise.resolve(updateStatus));

          case 11:
            _context.prev = 11;
            _context.t0 = _context['catch'](0);
            return _context.abrupt('return', Promise.reject(_context.t0.message));

          case 14:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this$19, [[0, 11]]);
  }));

  return function updateEmailSubscription(_x) {
    return _ref.apply(this, arguments);
  };
}();

var getEmailSubscriptionStatus = function () {
  var _ref2 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(email, portalId) {
    var mergedProps, status;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;

            requiresAuthentication(_baseOptions$18);

            if (!(!email || !portalId)) {
              _context2.next = 4;
              break;
            }

            throw new Error('Email / Portal ID are required fields');

          case 4:
            mergedProps = _extends({}, defaults$19, _baseOptions$18);
            _context2.next = 7;
            return createRequest(constants.api.emailSubscriptions.getStatus, { email: email, portalId: portalId }, mergedProps);

          case 7:
            status = _context2.sent;
            return _context2.abrupt('return', Promise.resolve(status));

          case 11:
            _context2.prev = 11;
            _context2.t0 = _context2['catch'](0);
            return _context2.abrupt('return', Promise.reject(_context2.t0.message));

          case 14:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, _this$19, [[0, 11]]);
  }));

  return function getEmailSubscriptionStatus(_x3, _x4) {
    return _ref2.apply(this, arguments);
  };
}();

function emailSubscriptions(baseOptions) {
  _baseOptions$18 = baseOptions;

  return {
    /**
     * Update the email subscription status for an email address (https://developers.hubspot.com/docs/methods/email/update_status)
     * @async
     * @memberof hs/emailSubscriptions
     * @method updateEmailSubscription
     * @param {string} email
     * @param {object} opts
     * @example
     * const hs = new HubspotClient(props);
     * hs.emailSubscriptions.updateEmailSubscription(email, { unsubscribeFromAll: true}).then(response => console.log(response));
     * @returns {Promise}
     */
    updateEmailSubscription: updateEmailSubscription,
    /**
     * Get the email subscription status for an email address / portal ID combination (https://developers.hubspot.com/docs/methods/email/get_status)
     * @async
     * @memberof hs/emailSubscriptions
     * @method getEmailSubscriptionStatus
     * @param {string} email
     * @param {string} portalId
     * @example
     * const hs = new HubspotClient(props);
     * hs.emailSubscriptions.getEmailSubscriptionStatus(email, 198273).then(response => console.log(response));
     * @returns {Promise}
     */
    getEmailSubscriptionStatus: getEmailSubscriptionStatus
  };
}

var _this$20 = undefined;

var defaults$20 = {};
var _baseOptions$19 = void 0;

var getById$3 = function () {
  var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(objectId, definitionId) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var mergedProps, products;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

            requiresAuthentication(_baseOptions$19);
            mergedProps = Object.assign({}, defaults$20, _baseOptions$19, options);
            _context.next = 5;
            return createRequest(constants.api.associations.byId, { objectId: objectId, definitionId: definitionId }, mergedProps);

          case 5:
            products = _context.sent;
            return _context.abrupt('return', Promise.resolve(products));

          case 9:
            _context.prev = 9;
            _context.t0 = _context['catch'](0);
            return _context.abrupt('return', Promise.reject(_context.t0));

          case 12:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this$20, [[0, 9]]);
  }));

  return function getById(_x, _x2) {
    return _ref.apply(this, arguments);
  };
}();

function associations(baseOptions) {
  _baseOptions$19 = baseOptions;

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
    getById: getById$3
  };
}

var _this$21 = undefined;

var defaults$21 = {};
var _baseOptions$20 = void 0;

var getLineItemByIds = function () {
  var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(ids) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var method, body, mergedProps, result;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

            requiresAuthentication(_baseOptions$20);
            method = 'POST';
            body = {
              ids: ids
            };
            mergedProps = Object.assign({}, defaults$21, _baseOptions$20, options);
            _context.next = 7;
            return createRequest(constants.api.objects.getLineItemByIds, { method: method, body: body }, mergedProps);

          case 7:
            result = _context.sent;
            return _context.abrupt('return', Promise.resolve(result));

          case 11:
            _context.prev = 11;
            _context.t0 = _context['catch'](0);
            return _context.abrupt('return', Promise.reject(_context.t0));

          case 14:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this$21, [[0, 11]]);
  }));

  return function getLineItemByIds(_x) {
    return _ref.apply(this, arguments);
  };
}();

function objects(baseOptions) {
  _baseOptions$20 = baseOptions;

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
    getLineItemByIds: getLineItemByIds
  };
}

var _this$22 = undefined;

var debug$4 = require('debug')('hubspot-api:tests'); // eslint-disable-line

var defaults$22 = {};
var _baseOptions$21 = void 0;

var getById$4 = function () {
  var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(ownerId) {
    var mergedProps, contact;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

            requiresAuthentication(_baseOptions$21);
            mergedProps = Object.assign({}, defaults$22, _baseOptions$21);
            _context.next = 5;
            return createRequest(constants.api.owners.byId, { ownerId: ownerId }, mergedProps);

          case 5:
            contact = _context.sent;
            return _context.abrupt('return', Promise.resolve(contact));

          case 9:
            _context.prev = 9;
            _context.t0 = _context['catch'](0);
            return _context.abrupt('return', Promise.reject(_context.t0));

          case 12:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this$22, [[0, 9]]);
  }));

  return function getById(_x) {
    return _ref.apply(this, arguments);
  };
}();

//
// const mergeContacts = async (primary, secondary) => {
//   // FIXME: Implement this
// };

function owners(baseOptions) {
  _baseOptions$21 = baseOptions;
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
    getById: getById$4
  };
}

var _this$23 = undefined;

var defaults$23 = {};
var _baseOptions$22 = void 0;

var createProducts = function () {
  var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(newProducts) {
    var mergedProps, method, url, body;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;

            requiresAuthentication(_baseOptions$22);
            mergedProps = Object.assign({}, defaults$23, _baseOptions$22);
            method = 'POST';
            url = constants.api.products.createProducts;
            body = newProducts.map(function (p) {
              return Object.keys(p).map(function (key) {
                return {
                  name: key,
                  value: p[key]
                };
              });
            });
            _context.next = 8;
            return createRequest(url, { method: method, body: body }, mergedProps);

          case 8:
            return _context.abrupt('return', Promise.resolve({ deleted: true }));

          case 11:
            _context.prev = 11;
            _context.t0 = _context['catch'](0);
            return _context.abrupt('return', Promise.reject(_context.t0.message));

          case 14:
          case 'end':
            return _context.stop();
        }
      }
    }, _callee, _this$23, [[0, 11]]);
  }));

  return function createProducts(_x) {
    return _ref.apply(this, arguments);
  };
}();

var createProduct = function () {
  var _ref2 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(newProduct) {
    var mergedProps, method, url, body, result;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;

            requiresAuthentication(_baseOptions$22);
            mergedProps = Object.assign({}, defaults$23, _baseOptions$22);
            method = 'POST';
            url = constants.api.products.createProduct;
            body = Object.keys(newProduct).map(function (key) {
              return {
                name: key,
                value: newProduct[key]
              };
            });
            _context2.next = 8;
            return createRequest(url, { method: method, body: body }, mergedProps);

          case 8:
            result = _context2.sent;
            return _context2.abrupt('return', Promise.resolve(result));

          case 12:
            _context2.prev = 12;
            _context2.t0 = _context2['catch'](0);
            return _context2.abrupt('return', Promise.reject(_context2.t0.message));

          case 15:
          case 'end':
            return _context2.stop();
        }
      }
    }, _callee2, _this$23, [[0, 12]]);
  }));

  return function createProduct(_x2) {
    return _ref2.apply(this, arguments);
  };
}();

var updateProducts = function () {
  var _ref3 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(upProducts) {
    var mergedProps, method, url, body;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;

            requiresAuthentication(_baseOptions$22);
            mergedProps = Object.assign({}, defaults$23, _baseOptions$22);
            method = 'POST';
            url = constants.api.products.updateProducts;
            body = upProducts.map(function (p) {
              return _extends({}, p, {
                properties: Object.keys(p.properties).map(function (key) {
                  return {
                    name: key,
                    value: p.properties[key]
                  };
                })
              });
            });
            _context3.next = 8;
            return createRequest(url, { method: method, body: body }, mergedProps);

          case 8:
            return _context3.abrupt('return', Promise.resolve({ deleted: true }));

          case 11:
            _context3.prev = 11;
            _context3.t0 = _context3['catch'](0);
            return _context3.abrupt('return', Promise.reject(_context3.t0.message));

          case 14:
          case 'end':
            return _context3.stop();
        }
      }
    }, _callee3, _this$23, [[0, 11]]);
  }));

  return function updateProducts(_x3) {
    return _ref3.apply(this, arguments);
  };
}();

var getAll$3 = function () {
  var _ref4 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var limit, offset, properties, propertiesWithHistory, allowedProps, mergedProps, allProducts;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.prev = 0;

            requiresAuthentication(_baseOptions$22);
            limit = opts.limit, offset = opts.offset, properties = opts.properties, propertiesWithHistory = opts.propertiesWithHistory;
            allowedProps = { limit: limit, offset: offset, properties: properties, propertiesWithHistory: propertiesWithHistory };
            mergedProps = Object.assign({}, defaults$23, _baseOptions$22, allowedProps);
            _context4.next = 7;
            return createRequest(constants.api.products.getAll, {}, mergedProps);

          case 7:
            allProducts = _context4.sent;
            return _context4.abrupt('return', Promise.resolve(allProducts));

          case 11:
            _context4.prev = 11;
            _context4.t0 = _context4['catch'](0);
            return _context4.abrupt('return', Promise.reject(_context4.t0.message));

          case 14:
          case 'end':
            return _context4.stop();
        }
      }
    }, _callee4, _this$23, [[0, 11]]);
  }));

  return function getAll() {
    return _ref4.apply(this, arguments);
  };
}();

var batchDelete = function () {
  var _ref5 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(deletes) {
    var mergedProps, method, url;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.prev = 0;

            requiresAuthentication(_baseOptions$22);
            mergedProps = Object.assign({}, defaults$23, _baseOptions$22);
            method = 'POST';
            url = constants.api.products.batchDelete;
            _context5.next = 7;
            return createRequest(url, { method: method, body: { ids: deletes } }, mergedProps);

          case 7:
            return _context5.abrupt('return', Promise.resolve({ deleted: true }));

          case 10:
            _context5.prev = 10;
            _context5.t0 = _context5['catch'](0);
            return _context5.abrupt('return', Promise.reject(_context5.t0.message));

          case 13:
          case 'end':
            return _context5.stop();
        }
      }
    }, _callee5, _this$23, [[0, 10]]);
  }));

  return function batchDelete(_x5) {
    return _ref5.apply(this, arguments);
  };
}();

function products(baseOptions) {
  _baseOptions$22 = baseOptions;

  return {
    createProduct: createProduct,
    createProducts: createProducts,
    updateProducts: updateProducts,
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
    getAll: getAll$3,
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
    batchDelete: batchDelete
  };
}

/**
* HubSpotClient class
* @example
const HubSpotClient = require('hubspot-api');
const hs = new HubSpotClient({ accessToken: 'i82739813ksjksf' });
// or
const hs = new HubSpotClient({ hapikey: '76128312asa7s8761823761' });
*/

var HubSpotClient = function () {
  /**
   * @param {object} props Constructor props. 1 of hapikey / accessToken is required for authenticated requests. No properties required for public methods (eg HubDB, forms)
   * @param {string} props.hapikey          - hapikey
   * @param {string} props.accessToken      - accessToken
   * @returns {object}
   */
  function HubSpotClient(props) {
    classCallCheck(this, HubSpotClient);

    Object.assign(this, { props: props });
  }
  /**
   * A collection of methods related to the Account API
   * @namespace hs/account
   */


  createClass(HubSpotClient, [{
    key: 'account',
    get: function get$$1() {
      return accounts(this.props);
    }

    /**
     * A collection of methods related to the Calendar API
     * @namespace hs/calendar
     */

  }, {
    key: 'calendar',
    get: function get$$1() {
      return calendar(this.props);
    }

    /**
     * A collection of methods related to the Contacts API
     * @namespace hs/contacts
     */

  }, {
    key: 'contacts',
    get: function get$$1() {
      return contacts(this.props);
    }

    /**
     * A collection of methods related to the Contacts Properties API
     * @namespace hs/contactsProperties
     */

  }, {
    key: 'contactsProperties',
    get: function get$$1() {
      return contactsProperties(this.props);
    }

    /**
     * A collection of methods related to the Comapny API
     * @namespace hs/company
     */

  }, {
    key: 'company',
    get: function get$$1() {
      return company(this.props);
    }

    /**
     * A collection of methods related to the Blog API / Blog Posts API / Blog Authors API
     * @namespace hs/blog
     */

  }, {
    key: 'blog',
    get: function get$$1() {
      return blog(this.props);
    }

    /**
     * A collection of methods related to the Workflows API
     * @namespace hs/workflows
     */

  }, {
    key: 'workflows',
    get: function get$$1() {
      return workflows(this.props);
    }

    /**
     * A collection of methods related to the COS Files API
     * @namespace hs/files
     */

  }, {
    key: 'files',
    get: function get$$1() {
      return filesApi(this.props);
    }

    /**
     * A collection of methods related to the Domains API
     * @namespace hs/domains
     */

  }, {
    key: 'domains',
    get: function get$$1() {
      return domainsApi(this.props);
    }

    /**
     * A collection of methods related to the Layouts API
     * @namespace hs/layouts
     */

  }, {
    key: 'layouts',
    get: function get$$1() {
      return layoutsApi(this.props);
    }

    /**
     * A collection of methods related to the Forms API
     * @namespace hs/forms
     */

  }, {
    key: 'forms',
    get: function get$$1() {
      return formsApi(this.props);
    }

    /**
     * A collection of methods related to the Social API
     * @namespace hs/social
     */

  }, {
    key: 'social',
    get: function get$$1() {
      return socialApi(this.props);
    }

    /**
     * A collection of methods related to the Email Events API
     * @namespace hs/emailEvents
     */

  }, {
    key: 'emailEvents',
    get: function get$$1() {
      return emailEvents(this.props);
    }

    /**
     * A collection of methods related to the Deals API
     * @namespace hs/deals
     */

  }, {
    key: 'deals',
    get: function get$$1() {
      return deals(this.props);
    }

    /**
     * A collection of methods related to the Page Publishing API
     * @namespace hs/pages
     */

  }, {
    key: 'pages',
    get: function get$$1() {
      return pagesApi(this.props);
    }

    /**
     * A collection of methods related to the HubDB Tables API
     * @namespace hs/hubdb
     */

  }, {
    key: 'hubdb',
    get: function get$$1() {
      return hubdbApi(this.props);
    }

    /**
     * A collection of methods related to the Engagements API
     * @namespace hs/engagements
     */

  }, {
    key: 'engagements',
    get: function get$$1() {
      return engagements(this.props);
    }

    /**
     * A collection of methods related to the OAuth API
     * @namespace hs/oauth
     */

  }, {
    key: 'oauth',
    get: function get$$1() {
      return oauthApi(this.props);
    }

    /**
     * A collection of methods related to the ContactsList API
     * @namespace hs/contactsLists
     */

  }, {
    key: 'contactsLists',
    get: function get$$1() {
      return contactsListsApi(this.props);
    }

    /**
    * A collection of methods related to the Email Subscriptions API
    * @namespace hs/emailSubscriptions
    */

  }, {
    key: 'emailSubscriptions',
    get: function get$$1() {
      return emailSubscriptions(this.props);
    }

    /**
     * A collection of methods related to the CRM associations API
     * @namespace hs/associations
     */

  }, {
    key: 'associations',
    get: function get$$1() {
      return associations(this.props);
    }

    /**
     * A collection of methods related to the CRM Objects API
     * @namespace hs/objects
     */

  }, {
    key: 'objects',
    get: function get$$1() {
      return objects(this.props);
    }

    /**
     * A collection of methods related to the owners API
     * @namespace hs/owners
     */

  }, {
    key: 'owners',
    get: function get$$1() {
      return owners(this.props);
    }

    /**
     * A collection of methods related to the products API
     * @namespace hs/owners
     */

  }, {
    key: 'products',
    get: function get$$1() {
      return products(this.props);
    }
  }]);
  return HubSpotClient;
}();

module.exports = HubSpotClient;
//# sourceMappingURL=main.browser.js.map
