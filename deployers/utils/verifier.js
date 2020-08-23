const { exec } = require("child_process");

const networkName = process.argv[2];
const contractName = process.argv[3];

if (!contractName || !networkName) {
	console.log('You need to provide contract name and network name');
	process.exit(1);
}

const filename = `../../artifacts/${contractName}.json`;
const file = require(filename);
const address = file.networks[networkName].address;
const args = file.networks[networkName].args.join(' ');

const command = `npx buidler verify-contract --contract-name ${contractName} --address ${address} ${args}`

exec(command, (error, stdout, stderr) => {
    if (error) {
        console.log(`error: ${error.message}`);
        return;
    }
    if (stderr) {
        console.log(`stderr: ${stderr}`);
        return;
    }
    console.log(`stdout: ${stdout}`);
});