import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import cron from 'node-cron';
import * as mongoose from 'mongoose';
import { Level } from './models/Levels.js';

import { Client, IntentsBitField } from 'discord.js';

import { initReminders } from './modules/reminders.js';
import { initEasterEggs } from './modules/easter_eggs.js';
import { initCommands } from './modules/commands.js';
import { initRules } from './modules/rules.js';
import { initFilters } from './modules/filters.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const channels = {
    "logs": {
        "messages": "1499490762507948073"
    }
};

const command_prefix = `~`;

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent
    ]
});

client.on('clientReady', async () => {
    try {
        const rawData = await fs.readFile(path.join(__dirname, 'FilteredWords.txt'), { encoding: "utf-8" });  // This is put in a separate file that is on the Git ignore list to keep code auditors comfortable as they read. This file contains a lot of objectional words in order to tell the code what to filter out.
        const filteredWordsArray = rawData.split(/\r?\n/).map(word => word.trim()).filter(word => word.length > 0);
        
        initFilters(client, filteredWordsArray, channels.logs.messages);
        
        await initReminders(client);
        await initCommands(client, command_prefix);
        await initRules(client);
        await initEasterEggs(client, command_prefix);
        const guild = await client.guilds.fetch("1463364922103693577");
        const members = guild.members.cache.filter((m) => !m.user.bot);
        for (const member of members.values()) {
            const accountId = member.id;

            const exists = await Level.exists({ accountId });
            if (!exists) {
                await Level.create({
                    created: new Date(),
                    level: 0,
                    accountId
                });
            }
        }
        
    } catch (error) {
        console.error("Failed to initialize bot configurations:", error);
    }
});

client.on('guildMemberAdd', member, async () => {
    const guild = member.guild;
    const accountId = member.user.id;
    const newLevel = new Level({
                    created: new Date(),
                    level: 0,
                    accountId: accountId
                });
    await newLevel.save();
});

async function startBot() {
    const secret = await fs.readFile(path.join(__dirname, 'CloudySecret.txt'), {encoding:"utf-8"}); // This is put in a separate file that is on the Git ignore list to keep the bots privacy.
    client.login(secret);
    mongoose.connect('mongodb://localhost:27017/cloudy', { useNewUrlParser: true, useUnifiedTopology: true })
        .then(() => {
            console.log('Connected to MongoDB');
        })
        .catch((err) => {
            console.error('Failed to connect to MongoDB', err);
        });
}

startBot();