const dotenv = require('dotenv').config();
const fs = require('fs');
const fsPromises = fs.promises;

const write = async (contractName, network, address, ...args) => {
	const filename = `../../artifacts/${contractName}.json`;
	const file = require(filename);

	console.log('file name:', file.contractName);
	if (!file.networks) {
		file.networks = {};
	}

	if (!file.networks[network]) {
		file.networks[network] = {};
	}

	file.networks[network].address = address;
	file.networks[network].args = args;

	try {
		const writeFilename = `./artifacts/${contractName}.json`;
		await fsPromises.writeFile(writeFilename, JSON.stringify(file, null, '\t'));
		
		return;
	} catch (e) {
		console.log(e);
		
		return;
	}
}

module.exports = {
	write
}