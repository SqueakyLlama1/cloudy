import * as fs from 'node:fs/promises';
import { Client, IntentsBitField } from 'discord.js';
import cron from 'node-cron';

import * as reminders from './modules/reminders.js';
import * as easter_eggs from './modules/easter_eggs.js';

const command_prefix = `~`;

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ]
});

const initReminders = reminders.initReminders;
const initEasterEggs = easter_eggs.initEasterEggs;

client.on('ready', async () => {
    const secret = await fs.readFile('Cloudy-Secret.txt', {encoding:"utf-8"});
    await initReminders(client);
    await initEasterEggs(client, command_prefix);
    
    client.login(secret);
});