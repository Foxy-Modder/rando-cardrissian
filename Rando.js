require('dotenv').config();
const { RANDO_TOKEN, RANDO_PREFIX, OWNERS, INVITE } = process.env;
const Client = require('./structures/Client');
const client = new Client({
	prefix: RANDO_PREFIX.split('||'),
	ownerID: OWNERS.split(','),
	disableEveryone: true,
	disabledEvents: ['TYPING_START']
});
const { stripIndents } = require('common-tags');

client.setup();

client.on('ready', () => {
	console.log(`[READY] Logged in as ${client.user.tag}! (${client.user.id})`);
	client.setInterval(() => client.user.setActivity('Cards Against Humanity'), 60000);
});

client.on('disconnect', event => {
	console.error(`[DISCONNECT] Disconnected with code ${event.code}.`);
	process.exit(0);
});

client.on('error', err => console.error('[ERROR]', err));

client.on('warn', err => console.warn('[WARNING]', err));

client.commandHandler.on('error', (err, msg) => {
	console.error('[COMMAND ERROR]', err);
	msg.reply(stripIndents`
		An error occurred while running the command: \`${err.message}\`
		You shouldn't ever receive an error like this.
		${INVITE ? `Please visit ${INVITE} for help.` : 'Please pray for help.'}
	`).catch(() => null);
});

client.login(RANDO_TOKEN);

process.on('unhandledRejection', err => {
	console.error('[FATAL] Unhandled Promise Rejection.', err);
	process.exit(1);
});
