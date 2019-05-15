const fs = require('fs');
const path = require('path');

function getPath(requestPath){
	return path.join(__dirname, '..', 'output', requestPath);
}

exports.loadFile = function (req, res, next) {
	const body = req.body;

	fs.readFile(getPath(body.path), 'utf8', (err, data) => {
		if(err){
			console.log(err);
			res.status(500).json({ err: err });
		}
		else
			res.json({ content: data })

	});
}

exports.saveFile = function (req, res, next) {
	const body = req.body;

	fs.writeFile(getPath(body.path), body.data, (err) => {
		if(err){
			console.log(err);
			res.status(500).json(err);
		}
		else
			res.sendStatus(200);
	});
}