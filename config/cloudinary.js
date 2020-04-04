const cloudinary = require('cloudinary').v2;
const dotenv = require('dotenv');
const uuid = require('uuid');

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// module.exports.uploads = (file, folder) => {
//   return new Promise(resolve => {
//     cloudinary.uploader.upload(file, (result) => {
//       resolve({
//         url: result.url,
//         id: result.public_id
//       });
//     }, {
//       resource_type: "raw",
//       folder: folder
//     });
//   });
// };

module.exports.uploads = (file, fileName, folder) => {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(file, {
      resource_type: "auto",
      folder: folder,
      public_id: `${fileName}-${uuid()}`
    }, (error, result) => {
      resolve({
        url: result.url
      });
      reject(error);
    });
  });
};