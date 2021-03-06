import { X509Identity, Wallets, Gateway } from 'fabric-network';
import * as fabprotos from 'fabric-protos';
import { Discoverer, DiscoveryService } from 'fabric-common';
import * as path from 'path';
import concat from 'lodash/concat';
import { explorerError } from '../../../common/ExplorerMessage';
import { ExplorerError } from '../../../common/ExplorerError';

/* eslint-disable @typescript-eslint/no-var-requires */
const { BlockDecoder, Client } = require('fabric-common');
const FabricCAServices = require('fabric-ca-client');
/* eslint-enable @typescript-eslint/no-var-requires */

export class FabricGateway {
    fabricConfig: any;
    config: any;
    gateway: any;
    wallet: any;
    tlsEnable: boolean;
    defaultChannelName: string;
    fabricCaEnabled: boolean;
    client: any;
    clientTlsIdentity: X509Identity;
    FSWALLET: string;
    enableAuthentication: boolean;
    asLocalhost: boolean;
    ds: DiscoveryService;
    dsTargets: Discoverer[];
    waitingResp: boolean;

    /**
     * Creates an instance of FabricGateway.
     * @param {FabricConfig} config
     * @memberof FabricGateway
     */
    constructor(fabricConfig) {
        this.fabricConfig = fabricConfig;
        this.config = this.fabricConfig.getConfig();
        this.gateway = null;
        this.wallet = null;
        this.tlsEnable = false;
        this.defaultChannelName = null;
        this.gateway = new Gateway();
        this.fabricCaEnabled = false;
        this.client = null;
        this.clientTlsIdentity = null;
        this.FSWALLET = null;
        this.enableAuthentication = false;
        this.asLocalhost = false;
        this.ds = null;
        this.dsTargets = [];
        this.waitingResp = false;
    }

    async initialize() {
		// console.log(this.fabricConfig);
        this.fabricCaEnabled = this.fabricConfig.isFabricCaEnabled();
        this.tlsEnable = this.fabricConfig.getTls();
        this.enableAuthentication = this.fabricConfig.getEnableAuthentication();
        this.FSWALLET = 'wallet/' + this.fabricConfig.getNetworkId();

        const explorerAdminId = this.fabricConfig.getAdminUser();
        if (!explorerAdminId) {
            console.error('Failed to get admin ID from configuration file');
            throw new ExplorerError(explorerError.ERROR_1010);
        }

        const info = `Loading configuration  ${this.config}`;
        console.debug(info.toUpperCase());
        this.defaultChannelName = this.fabricConfig.getDefaultChannel();
        try {
            // Create a new file system based wallet for managing identities.
            const walletPath = path.join(process.cwd(), this.FSWALLET);
            this.wallet = await Wallets.newFileSystemWallet(walletPath);
            // Check to see if we've already enrolled the admin user.
            const identity = await this.wallet.get(explorerAdminId);
            if (identity) {
                console.debug(
                    `An identity for the admin user: ${explorerAdminId} already exists in the wallet`
                );
            } else if (this.fabricCaEnabled) {
				console.info('CA enabled');

				await this.enrollCaIdentity(
					explorerAdminId,
					this.fabricConfig.getAdminPassword()
				);
			} else {
                /*
                 * Identity credentials to be stored in the wallet
                 * Look for signedCert in first-network-connection.json
                 */
                const signedCertPem = this.fabricConfig.getOrgSignedCertPem();
                const adminPrivateKeyPem = this.fabricConfig.getOrgAdminPrivateKeyPem();
                await this.enrollUserIdentity(
                    explorerAdminId,
                    signedCertPem,
                    adminPrivateKeyPem
                );
            }

            if (!this.tlsEnable) {
                Client.setConfigSetting('discovery-protocol', 'grpc');
            } else {
                Client.setConfigSetting('discovery-protocol', 'grpcs');
            }

            // Set connection options; identity and wallet
            this.asLocalhost =
                String(Client.getConfigSetting('discovery-as-localhost', 'true')) ===
                'true';

            const connectionOptions = {
                identity: explorerAdminId,
                wallet: this.wallet,
                discovery: {
                    enabled: true,
                    asLocalhost: this.asLocalhost
                },
                clientTlsIdentity: ''
            };
            const mTlsIdLabel = this.fabricConfig.getClientTlsIdentity();
			if (mTlsIdLabel) {
				console.info('client TLS enabled');
				this.clientTlsIdentity = await this.wallet.get(mTlsIdLabel);
				if (this.clientTlsIdentity !== undefined) {
					connectionOptions.clientTlsIdentity = mTlsIdLabel;
				} else {
					throw new ExplorerError(
						`Not found Identity ${mTlsIdLabel} in your wallet`
					);
				}
			}
            // Connect to gateway
			await this.gateway.connect(this.config, connectionOptions);
            console.log("connecting to fabric gateway...");
        } catch (error) {
            console.error(
                `${explorerError.ERROR_1010}: ${JSON.stringify(error, null, 2)}`
            );
            throw new ExplorerError(explorerError.ERROR_1010);
        }
    }

    getEnableAuthentication() {
		return this.enableAuthentication;
	}

	getDiscoveryProtocol() {
		return Client.getConfigSetting('discovery-protocol');
	}

	getDefaultMspId() {
		return this.fabricConfig.getMspId();
	}

	getTls() {
		return this.tlsEnable;
	}

	getConfig() {
		return this.config;
	}

    /**
     * @private method
     *
     */
    async enrollUserIdentity(userName, signedCertPem, adminPrivateKeyPem) {
        const identity = {
            credentials: {
                certificate: signedCertPem,
                privateKey: adminPrivateKeyPem
            },
            mspId: this.fabricConfig.getMspId(),
            type: 'X.509'
        };
        console.info('enrollUserIdentity: userName :', userName);
        await this.wallet.put(userName, identity);
        return identity;
    }

    /**
	 * @private method
	 *
	 */
     async enrollCaIdentity(id, secret){
        if (!this.fabricCaEnabled) {
			console.error('CA server is not configured');
			return null;
		}
        try {
            const caName = this.config.organizations[this.fabricConfig.getOrganization()].certificateAuthorities[0];
            const ca = new FabricCAServices(
				this.config.certificateAuthorities[caName].url,
				{
					trustedRoots: this.fabricConfig.getTlsCACertsPem(caName),
					verify: false
				}
			);
            const enrollment = await ca.enroll({
				enrollmentID: this.fabricConfig.getCaAdminUser(),
				enrollmentSecret: this.fabricConfig.getCaAdminPassword()
			});
            console.info('>>>>>>>>>>>>>>>>>>>>>>>>> enrollment : ca admin');
            const identity = {
				credentials: {
					certificate: enrollment.certificate,
					privateKey: enrollment.key.toBytes()
				},
				mspId: this.fabricConfig.getMspId(),
				type: 'X.509'
			};
            // Import identity wallet
			await this.wallet.put(this.fabricConfig.getCaAdminUser(), identity);

			const adminUser = await this.getUserContext(
				this.fabricConfig.getCaAdminUser()
			);
			await ca.register(
				{
					affiliation: this.fabricConfig.getAdminAffiliation(),
					enrollmentID: id,
					enrollmentSecret: secret,
					role: 'admin'
				},
				adminUser
			);

			const enrollmentBEAdmin = await ca.enroll({
				enrollmentID: id,
				enrollmentSecret: secret
			});
			console.info(
				'>>>>>>>>>>>>>>>>>>>>>>>>> registration & enrollment : BE admin'
			);
            const identityBEAdmin = {
				credentials: {
					certificate: enrollmentBEAdmin.certificate,
					privateKey: enrollmentBEAdmin.key.toBytes()
				},
				mspId: this.fabricConfig.getMspId(),
				type: 'X.509'
			};
			await this.wallet.put(id, identityBEAdmin);

			console.debug('Successfully get user enrolled and imported to wallet, ', id);

			return identityBEAdmin;
        } catch (error) {
            // TODO decide how to proceed if error
			console.error('Error instantiating FabricCAServices ', error);
			return null;
        }
     }

    async queryChannels() {
		const network = await this.gateway.getNetwork(this.defaultChannelName);

		// Get the contract from the network.
		const contract = network.getContract('cscc');
		const result = await contract.evaluateTransaction('GetChannels');
		const resultJson = fabprotos.protos.ChannelQueryResponse.decode(result);
		console.debug('queryChannels', resultJson);
		return resultJson;
	}

    async queryBlock(channelName, blockNum) {
		try {
			const network = await this.gateway.getNetwork(this.defaultChannelName);

			// Get the contract from the network.
			const contract = network.getContract('qscc');
			const resultByte = await contract.evaluateTransaction(
				'GetBlockByNumber',
				channelName,
				String(blockNum)
			);
			const resultJson = BlockDecoder.decode(resultByte);
			console.debug('queryBlock', resultJson);
			return resultJson;
		} catch (error) {
			console.error(
				`Failed to get block ${blockNum} from channel ${channelName} : `,
				error
			);
			return null;
		}
	}

    async queryInstantiatedChaincodes(channelName) {
		console.info('queryInstantiatedChaincodes', channelName);
		const network = await this.gateway.getNetwork(this.defaultChannelName);
		let contract = network.getContract('lscc');
		let result = await contract.evaluateTransaction('GetChaincodes');
		let resultJson = fabprotos.protos.ChaincodeQueryResponse.decode(result);
		if (resultJson.chaincodes.length <= 0) {
			resultJson = { chaincodes: [], toJSON: null };
			contract = network.getContract('_lifecycle');
			result = await contract.evaluateTransaction('QueryChaincodeDefinitions', '');
			const decodedReult = fabprotos.lifecycle.QueryChaincodeDefinitionsResult.decode(
				result
			);
			for (const cc of decodedReult.chaincode_definitions) {
				resultJson.chaincodes = concat(resultJson.chaincodes, {
					name: cc.name,
					version: cc.version
				});
			}
		}
		console.debug('queryInstantiatedChaincodes', resultJson);
		return resultJson;
	}

    async queryChainInfo(channelName) {
		try {
			const network = await this.gateway.getNetwork(this.defaultChannelName);

			// Get the contract from the network.
			const contract = network.getContract('qscc');
			const resultByte = await contract.evaluateTransaction(
				'GetChainInfo',
				channelName
			);
			const resultJson = fabprotos.common.BlockchainInfo.decode(resultByte);
			console.debug('queryChainInfo', resultJson);
			return resultJson;
		} catch (error) {
			console.error(
				`Failed to get chain info from channel ${channelName} : `,
				error
			);
			return null;
		}
	}

	async setupDiscoveryRequest(channelName) {
		try {
			const network = await this.gateway.getNetwork(channelName);
			const channel = network.getChannel();
			this.ds = new DiscoveryService('be discovery service', channel);

			const idx = this.gateway.identityContext;
			// do the three steps
			this.ds.build(idx);
			this.ds.sign(idx);
		} catch (error) {
			console.error('Failed to set up discovery service for channel', error);
			this.ds = null;
		}
	}

	async getDiscoveryServiceTarget() {
		const client = new Client('discovery client');
		if (this.clientTlsIdentity) {
			console.info('client TLS enabled');
			client.setTlsClientCertAndKey(
				this.clientTlsIdentity.credentials.certificate,
				this.clientTlsIdentity.credentials.privateKey
			);
		} else {
			client.setTlsClientCertAndKey();
		}

		const targets: Discoverer[] = [];
		const mspID = this.config.client.organization;
		for (const peer of this.config.organizations[mspID].peers) {
			const discoverer = new Discoverer(`be discoverer ${peer}`, client, mspID);
			const url = this.config.peers[peer].url;
			const pem = this.fabricConfig.getPeerTlsCACertsPem(peer);
			let grpcOpt = {};
			if ('grpcOptions' in this.config.peers[peer]) {
				grpcOpt = this.config.peers[peer].grpcOptions;
			}
			const peer_endpoint = client.newEndpoint(
				Object.assign(grpcOpt, {
					url: url,
					pem: pem
				})
			);
			await discoverer.connect(peer_endpoint);
			targets.push(discoverer);
		}
		return targets;
	}

    async sendDiscoveryRequest() {
		let result;
		try {
			if (!this.waitingResp) {
				this.waitingResp = true;
				console.info('Sending discovery request...');
				await this.ds
          .send({
            asLocalhost: this.asLocalhost,
            requestTimeout: 5000,
            refreshAge: 15000,
            targets: this.dsTargets,
          })
          .then(() => {
            console.info('Succeeded to send discovery request');
          })
          .catch(error => {
            if (error) {
              console.warn(
                'Failed to send discovery request for channel',
                error,
              );
              this.waitingResp = false;
              this.ds.close();
            }
          });
			} else {
				console.info('Have already been sending a request');
				return null;
			}

			result = await this.ds.getDiscoveryResults(true);
			this.waitingResp = false;
		} catch (error) {
			console.warn('Failed to send discovery request for channel', error);
			if (this.ds) {
				this.ds.close();
				this.ds = null;
			}
			result = null;
		}
		return result;
	}

	async getDiscoveryResult(channelName) {
		if (!this.ds) {
			await this.setupDiscoveryRequest(channelName);
		}

		if (!this.dsTargets.length) {
			this.dsTargets = await this.getDiscoveryServiceTarget();
		}

		if (this.ds && this.dsTargets.length) {
			const result = await this.sendDiscoveryRequest();
			return result;
		}

		return null;
	}

    async getUserContext(user) {
		const identity = await this.wallet.get(user);
		if (!identity) {
			console.error('Not exist user :', user);
			return null;
		}
		const provider = this.wallet.getProviderRegistry().getProvider(identity.type);
		const userContext = await provider.getUserContext(identity, user);
		return userContext;
	}

    async getIdentityInfo(label) {
		let identityInfo;
		console.info('Searching for an identity with label: ', label);
		try {
			const list = await this.wallet.list();
			identityInfo = list.filter(id => {
				return id.label === label;
			});
		} catch (error) {
			console.error(error);
		}
		return identityInfo;
	}

	//fabcar
	async changeCarOwner(key, newOwner) {
		const network = await this.gateway.getNetwork(this.defaultChannelName);

		// Get the contract from the network.
		const contract = network.getContract('fabcar');
		const result = await contract.submitTransaction('changeCarOwner', key, newOwner);
		const resultJson = fabprotos.protos.TransactionAction.decode(result);
		console.debug('changeCarOwner', resultJson);
		return resultJson;
	}

	async queryAllCars() {
		const network = await this.gateway.getNetwork(this.defaultChannelName);

		// Get the contract from the network.
		const contract = network.getContract('fabcar');
		const result = await contract.evaluateTransaction('queryAllCars');
		const resultJson = JSON.parse(result.toString());
		console.debug('queryAllCars', resultJson);
		return resultJson;
	}

	async createCar(key, make, model, color, owner) {
		const network = await this.gateway.getNetwork(this.defaultChannelName);

		// Get the contract from the network.
		const contract = network.getContract('fabcar');
		const result = await contract.submitTransaction('createCar', key, make, model, color, owner);
		const resultJson = fabprotos.protos.TransactionAction.decode(result);
		console.debug('createCar', resultJson);
		return resultJson;
	}
}