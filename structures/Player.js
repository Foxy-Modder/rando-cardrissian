const { stripIndents } = require('common-tags');
const { escapeMarkdown } = require('discord.js');

module.exports = class Player {
	constructor(user) {
		this.id = user.id;
		this.user = user;
		this.points = 0;
		this.hand = new Set();
		this.strikes = 0;
	}

	dealHand(deck, amount) {
		for (let i = 0; i < amount; i++) this.hand.add(deck.deal());
		return this.hand;
	}

	get kickable() {
		return this.strikes >= 3;
	}

	kick(players, czars) {
		players.delete(this.id);
		czars.splice(czars.indexOf(this.id), 1);
	}

	async turn(channel, czar, black, deck, chosenCards) {
		if (this.user.id === czar.user.id) return;
		if (this.hand.size < 10) this.hand.add(deck.deal());
		try {
			if (this.hand.size < black.pick) {
				await this.user.send('You don\'t have enough cards!');
				return;
			}
			const hand = Array.from(this.hand);
			await this.user.send(stripIndents`
				__**Your hand is**__: _(Type \`swap\` to exchange a point for a new hand.)_
				${hand.map((card, i) => `**${i + 1}.** ${card}`).join('\n')}

				**Black Card**: ${escapeMarkdown(black.text)}
				**Card Czar**: ${czar.user.username}
				Pick **${black.pick}** card${black.pick > 1 ? 's' : ''}!
			`);
			const chosen = [];
			const filter = res => {
				if (res.content.toLowerCase() === 'swap' && this.points > 0) return true;
				const existing = hand[Number.parseInt(res.content, 10) - 1];
				if (!existing) return false;
				if (chosen.includes(existing)) return false;
				chosen.push(existing);
				return true;
			};
			const choices = await this.user.dmChannel.awaitMessages(filter, {
				max: black.pick,
				time: 60000
			});
			if (choices.first().content.toLowerCase() === 'swap') {
				this.points--;
				await this.user.send('Swapping cards...');
				for (const card of this.hand) this.hand.delete(card);
				this.dealHand(deck, 10);
				return this.turn(channel, czar, black, deck, chosenCards); // eslint-disable-line consistent-return
			}
			if (choices.size < black.pick) {
				for (let i = 0; i < black.pick; i++) chosen.push(hand[Math.floor(Math.random() * hand.length)]);
				this.strikes++;
			}
			if (chosen.includes('<Blank>')) {
				if (choices.size < black.pick) {
					chosen[chosen.indexOf('<Blank>')] = 'A randomly chosen blank card.';
				} else {
					const handled = await this.deck.handleBlank(this);
					chosen[chosen.indexOf('<Blank>')] = handled;
				}
			}
			for (const card of chosen) this.hand.delete(card);
			await this.user.send(`Nice! Return to ${channel} to await the results!`);
			chosenCards.push({ id: this.id, cards: chosen });
		} catch (err) {
			return; // eslint-disable-line no-useless-return
		}
	}
};