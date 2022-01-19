import { ExplorerError } from './common/ExplorerError';
import { Synchronizer } from './Synchronizer';

const args = process.argv.slice(2);

let synchronizer;

async function start() {
	console.debug('Start synchronizer');
	synchronizer = new Synchronizer(args);
	await synchronizer.initialize();

	console.info(`Synchronizer pid is ${process.pid}`);
}

start();

/*
 * This function is called when you want the server to die gracefully
 * i.e. wait for existing connections
 */

const shutDown = function() {
	console.info(
		'<<<<<<<<<<<<<<<<<<<<<<<<<< Closing client processor >>>>>>>>>>>>>>>>>>>>>'
	);
	if (synchronizer) {
		synchronizer.close();
	}
	setTimeout(() => {
		process.exit(0);
		setTimeout(() => {
			console.error(
				'Could not close child connections in time, forcefully shutting down'
			);
			if (synchronizer) {
				synchronizer.close();
			}
			process.exit(1);
		}, 5000);
	}, 2000);
};

process.on('unhandledRejection', (up : {message : string}) => {
	console.error(
		'<<<<<<<<<<<<<<<<<<<<<<<<<< Synchronizer Error >>>>>>>>>>>>>>>>>>>>>'
	);
	if (up instanceof ExplorerError) {
		console.error('Error : ', up.message);
	} else {
		console.error(up);
	}
  // prevent timeout error from calling shutdown
	if (!up.message.includes('REQUEST TIMEOUT') && !up.message.includes('ETIMEOUT')) {
    shutDown();
  }
});
process.on('uncaughtException', up => {
	console.error(
		'<<<<<<<<<<<<<<<<<<<<<<<<<< Synchronizer Error >>>>>>>>>>>>>>>>>>>>>'
	);
	if (up instanceof ExplorerError) {
		console.error('Error : ', up.message);
	} else {
		console.error(up);
	}
	shutDown();
});

// Listen for TERM signal .e.g. kill
process.on('SIGTERM', shutDown);
// Listen for INT signal e.g. Ctrl-C
process.on('SIGINT', shutDown);
