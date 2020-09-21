const AWS = require('aws-sdk');
const uuid = require('uuid').v4;

const S3 = new AWS.S3({
	accessKeyId: process.env.accessKeyId,
	secretAccessKey: process.env.secretAccessKey
});

module.exports = (req, res) => {
	const filetype = req.query.filetype;
	const fileExt = filetype.split('/')[1];
	// to make each file upload in each user foler in S3 bucket
	const filename = `${req.userId}/${uuid()}.${fileExt}`;

	S3.getSignedUrl(
		'putObject',
		{
			Bucket: process.env.bucket,
			Key: filename,
			ContentType: filetype,
			Expires: 3600
		},
		(error, url) => {
			if (error) {
				console.error(error);
				return res.sendStatus(500);
			}
			res.send({ filename, url });
		}
	);
};
