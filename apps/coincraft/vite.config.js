// @ts-ignore
import config from 'config-vite';

const baseConfig = config();

export default {
	...baseConfig,
	server: {
		...baseConfig.server,
		proxy: {
			'/wallet': 'http://localhost:3002',
			'/bet': 'http://localhost:3002',
		},
	},
};
