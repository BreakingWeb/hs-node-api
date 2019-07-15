import fs from 'fs';
import FormData from 'form-data';
import createRequest, { requiresAuthentication } from '../utilities';
import constants from '../constants';

const defaults = {};
let _baseOptions;

const getFilesInFolder = async (folder_id, opts = {}) => {
  try {
    requiresAuthentication(_baseOptions);
    let { limit, offset } = opts;
    limit = limit || 100;
    offset = offset || 0;

    const mergedProps = Object.assign({}, defaults, _baseOptions, {
      folder_id,
      limit,
      offset
    });

    const files = await createRequest(
      constants.api.files.getFilesInFolder,
      {},
      mergedProps
    );
    return Promise.resolve(files);
  } catch (e) {
    return Promise.reject(e.message);
  }
};

const uploadFile = async (opts = {}) => {
  try {
    const {
      overwrite,
      hidden,
      file_names,
      files,
      folder_paths,
      folder_id
    } = opts;

    const method = 'POST';
    const data = new FormData();
    if (file_names) data.append('file_names', file_names);
    if (folder_paths) data.append('folder_paths', folder_paths);
    if (folder_id) data.append('folder_id', folder_id);

    data.append('files', fs.createReadStream(files), {
      knownLength: fs.statSync(files).size,
      name: files,
    });

    const mergedProps = Object.assign({}, defaults, _baseOptions, {
      overwrite,
      hidden,
    });

    const author = await createRequest(
      constants.api.files.upload,
      {
        method,
        data,
        headers: {
          ...data.getHeaders(),
          'Content-Length': data.getLengthSync()
        },
      },
      mergedProps
    );
    return Promise.resolve(author);
  } catch (e) {
    return Promise.reject(e);
  }
};

export default function filesApi(baseOptions) {
  _baseOptions = baseOptions;

  return {
    uploadFile,
    getFilesInFolder
  };
}
