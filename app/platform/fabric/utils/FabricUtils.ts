import * as path from 'path';
import fs from 'fs-extra';
import { Utils } from 'fabric-common';
import asn from 'asn1.js';
import sha from 'js-sha256';
import { FabricClient } from '../FabricClient';
import { ExplorerError } from '../../../common/ExplorerError';
import { explorerError } from '../../../common/ExplorerMessage';

export async function createFabricClient(config, persistence?) {
	// Create new FabricClient
	const client = new FabricClient(config);
	// Initialize fabric client
	console.debug(
		'************ Initializing fabric client for [%s]************',
		config.getNetworkId()
	);
	try {
		await client.initialize(persistence);
		return client;
	} catch (err) {
		throw new ExplorerError(explorerError.ERROR_2014);
	}
}

/**
 *
 *
 * @param {*} dateStr
 * @returns
 */
export async function getBlockTimeStamp(dateStr) {
	try {
		return new Date(dateStr);
	} catch (err) {
		console.error(err);
	}
	return new Date(dateStr);
}

/**
 *
 *
 * @returns
 */
export async function generateDir() {
	const tempDir = `/tmp/${new Date().getTime()}`;
	try {
		fs.mkdirSync(tempDir);
	} catch (err) {
		console.error(err);
	}
	return tempDir;
}

/**
 *
 *
 * @param {*} header
 * @returns
 */
export async function generateBlockHash(header) {
	const headerAsn = asn.define('headerAsn', function() {
		this.seq().obj(
			this.key('Number').int(),
			this.key('PreviousHash').octstr(),
			this.key('DataHash').octstr()
		);
	});
	console.info('generateBlockHash', header.number.toString());
	// ToDo: Need to handle Long data correctly. header.number {"low":3,"high":0,"unsigned":true}
	const output = headerAsn.encode(
		{
			Number: parseInt(header.number.low),
			PreviousHash: header.previous_hash,
			DataHash: header.data_hash
		},
		'der'
	);
	return sha.sha256(output);
}

/**
 *
 *
 * @param {*} config
 * @returns
 */
export function getPEMfromConfig(config) {
	let result = null;
	if (config) {
		if (config.path) {
			// Cert value is in a file
			try {
				result = readFileSync(config.path);
				result = Utils.normalizeX509(result);
			} catch (e) {
				console.error(e);
			}
		}
	}

	return result;
}

/**
 *
 *
 * @param {*} config_path
 * @returns
 */
function readFileSync(config_path) {
	try {
		const config_loc = path.resolve(config_path);
		const data = fs.readFileSync(config_loc);
		return Buffer.from(data).toString();
	} catch (err) {
		console.error(`NetworkConfig101 - problem reading the PEM file :: ${err}`);
		throw err;
	}
}
