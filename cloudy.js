import cron from 'node-cron';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as fsSync from 'node:fs';
import { Readable } from 'node:stream';
import { finished } from 'node:stream/promises';
import { fileURLToPath } from 'node:url';

import { Client, IntentsBitField, SlashCommandBuilder, Partials } from 'discord.js';

import { initReminders } from './modules/reminders.js';
import { initEasterEggs } from './modules/easter_eggs.js';
import { initCommands } from './modules/commands.js';
import { initRules } from './modules/rules.js';
import { initFilters } from './modules/filters.js';
import { initGames } from './modules/games.js';
import { initReactionRoles } from './modules/reaction_roles.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commands = [
    // Games and Easter Eggs
    new SlashCommandBuilder().setName('coinflip').setDescription('Flip a coin'),
    new SlashCommandBuilder().setName('bubblewrap').setDescription('Pop!').addNumberOption(option => option.setName('amount').setDescription('Amount of Bubbles! Max. 150').setRequired(false)),
    new SlashCommandBuilder().setName('ping').setDescription('Pong'),
    new SlashCommandBuilder().setName('willowmode').setDescription('Willow is cool'),
    new SlashCommandBuilder().setName('squeakymode').setDescription('Squeaky is Tiny'),
    // Utility Commands
    new SlashCommandBuilder().setName('minecraft').setDescription('The IP and Port for the Minecraft server'),
].map(command => command.toJSON());

let serverId;
let appId;
let channels;
let roles;
let emojiCategories;
let secret;

const emojis = {
    "categories": {}
};

const client = new Client({
    intents: [
        IntentsBitField.Flags.Guilds,
        IntentsBitField.Flags.GuildMembers,
        IntentsBitField.Flags.GuildMessages,
        IntentsBitField.Flags.MessageContent,
        IntentsBitField.Flags.GuildMessageReactions
    ],
    partials: [Partials.Message, Partials.Reaction, Partials.User]
});

client.once('clientReady', async () => {
    try {
        console.log(`Logged in as ${client.user.tag}!`);
        
        await buildDynamicEmojiObject(true);
        
        await initFilters(client, channels);
        await initCommands(client, appId, secret, serverId, commands);
        await initRules(client);
        await initReactionRoles(client, channels, roles, emojis);
        await initReminders(client, channels, roles);
        await initEasterEggs(client, roles, emojis);
        await initGames(client);
        
        console.log("Cloudy has been loaded.");
    } catch (error) {
        console.error("Failed to initialize bot configurations:", error);
    }
});

async function startBot() {
    // Load secret from file
    secret = await fs.readFile(path.join(__dirname, 'CloudySecret.txt'), {encoding:"utf-8"});

    // Load configuration from file
    const config = JSON.parse(await fs.readFile(path.join(__dirname, 'config.json'), {encoding:"utf-8"}));

    serverId = config["serverId"];
    appId = config["appId"];
    emojiCategories = config["emojiCategories"];
    roles = config["roles"];
    channels = config["channels"];

    // Login
    client.login(secret);
}

async function downloadFile(url, outputPath) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch ${url}: ${response.statusText}`);
    }
    const fileStream = fsSync.createWriteStream(outputPath);
    const body = Readable.fromWeb(response.body);
    await finished(body.pipe(fileStream));
}

async function buildDynamicEmojiObject(download = false) {
    try {
        const guild = await client.guilds.fetch(serverId);
        if (!guild) {
            console.error("Target server could not be located.");
            return;
        }
        
        const freshEmojis = await guild.emojis.fetch();
        
        for (const emoji of freshEmojis.values()) {
            const prefix = emoji.animated ? 'a:' : ':';
            emojis[emoji.name] = `<${prefix}${emoji.name}:${emoji.id}>`;
            
            if (download) {
                const outputDir = path.join(__dirname, 'app_state', 'emojis');
                if (download && !fsSync.existsSync(outputDir)) {
                    fsSync.mkdirSync(outputDir, { recursive: true });
                }
                const ext = emoji.animated ? 'gif' : 'png';
                const url = `https://cdn.discordapp.com/emojis/${emoji.id}`;
                const outputPath = path.join(outputDir, `${emoji.name}.${ext}`);
                
                try {
                    await downloadFile(url, outputPath);
                } catch (downloadError) {
                    console.error(`Failed to download emoji "${emoji.name}":`, downloadError.message);
                }
            }
        }
        
        for (const [categoryName, emojiNamesArray] of Object.entries(emojiCategories)) {
            emojis.categories[categoryName] = emojiNamesArray
            .map(name => emojis[name])
            .filter(Boolean);
        }
        
    } catch (error) {
        console.error("Failed to dynamically build emoji structures:", error);
    }
}

startBot();