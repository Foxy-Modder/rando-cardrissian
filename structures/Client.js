const { AkairoClient, CommandHandler } = require('discord-akairo');
const { stripIndents } = require('common-tags');
const path = require('path');
const CodeType = require('../types/code');

module.exports = class Client extends AkairoClient {
	constructor(options) {
		super(options);

		this.commandHandler = new CommandHandler(this, {
			directory: path.join(__dirname, '..', 'commands'),
			prefix: msg => msg.channel.type === 'text' ? options.prefix : '',
			aliasReplacement: /-/g,
			allowMention: true,
			handleEdits: true,
			commandUtil: true,
			commandUtilLifetime: 60000,
			fetchMembers: true,
			defaultCooldown: 1000,
			defaultPrompt: {
				modifyStart: (text, msg) => stripIndents`
					${msg.author}, ${text}
					Respond with \`cancel\` to cancel the command. The command will automatically be cancelled in 30 seconds.
				`,
				modifyRetry: (text, msg) => stripIndents`
					${msg.author}, ${text}
					Respond with \`cancel\` to cancel the command. The command will automatically be cancelled in 30 seconds.
				`,
				timeout: msg => `${msg.author}, cancelled command.`,
				ended: msg => `${msg.author}, 2 tries and you still don't understand, cancelled command.`,
				cancel: msg => `${msg.author}, cancelled command.`,
				retries: 2,
				stopWord: 'finish'
			}
		});
		this.playing = new Set();
	}

	setup() {
		this.commandHandler.loadAll();
		this.commandHandler.resolver.addType('code', CodeType);
	}
};
