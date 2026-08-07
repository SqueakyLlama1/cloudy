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

const channels = {
    "important": {
        "announcements": "1463538828815110227",
        "roles": "1463868325141414031"
    },
    "staff": {
        "logs": {
            "messages": "1499490762507948073"
        }
    },
    "miscellaneous": {
        "bump": "1471790641879973899"
    }
};

const roles = {
    // Application Obtained Roles (Automatic, used for server access management)
    "status": {
        "unverified": "1463545366124302337"
    },
    // Reaction Obtained Roles (Get To Know Me and Boundary, all optional)
    "littlespace": {
        "caregiver": "1466423766413344852",
        "little": "1466423861389299766",
        "switch": "1466423939130589392"
    },
    "boundary": {
        "friend-request-status": {
            "open": "1466426621618557110",
            "ask": "1466426716208627784",
            "closed": "1466426683505512529"
        },
        "dm-status": {
            "open": "1466423986928750624",
            "ask": "1466424075965567162",
            "closed": "1466424025235460318"
        }
    },
    "ping": {
        "poll-of-the-day": "1524007575325245550",
        "question-of-the-day": "1524007437437370378",
        "bump": "1471889549910347818",
        "announcement": "1471890121602109460",
        "dead-chat": "1471890288770551808",
        "birthday": "1488537471942660186",
        "voice-chat": "1476574049336299693"
    },
    "age": {
        "13": "1466416939940188409",
        "14": "1466417061960880331",
        "15": "1466417102855602279",
        "16": "1466417119703859416",
        "17": "1466417139673071749",
        "18": "1466417156689236071",
        "19": "1466417171218436159"
    },
    "sexuality": {
        "straight": "1474269228940001443",
        "gay": "1474268637669101599",
        "bisexual": "1474268883539066930",
        "lesbian": "1474268983304917197",
        "pansexual": "1474269098501476435",
        "other": "1474269380262236190"
    },
    "access": {
        "pad-art": "1471389544732688517",
        "pad": "1504090847787094026"
    },
    "gender": {
        "boy": "1466420042655858770",
        "girl": "1466420087064891486",
        "non-binary": "1466420116517421056",
        "deciding": "1466419900816949332",
        "fluid": "1466420153360322666"
    },
    "color": {
        "green": "1471803926692233317",
        "orange": "1471803830365589649",
        "teal": "1471803678980702310",
        "blue": "1471803390152409216",
        "soft-pink": "1471803218458837148",
        "red": "1471803100397436990",
        "purple": "1471803552442748989",
        "yellow": "1471804032325517363",
        "hot-pink": "1471803145486336044",
        "black": "1471801957134897173"
    }
};

const categoryDefinitions = {
    "hug": [
        "big_kid_happy_hug",
        "big_kid_support_hug",
        "cg_comfort_bab",
        "cg_cuddle_bab",
        "cg_hold_bab",
        "cuddles",
        "leg_cling",
        "want_hug",
        "cling"
    ]
};

const emojis = {
    "categories": {}
};

const commands = [
    // Games and Easter Eggs
    new SlashCommandBuilder().setName('coinflip').setDescription('Flip a coin'),
    new SlashCommandBuilder().setName('bubblewrap').setDescription('Pop!').addNumberOption(option => option.setName('amount').setDescription('Amount of Bubbles! Max. 150').setRequired(false)),
    new SlashCommandBuilder().setName('ping').setDescription('Pong'),
    new SlashCommandBuilder().setName('willowmode').setDescription('Willow is cool'),
    new SlashCommandBuilder().setName('squeakymode').setDescription('Squeaky is Tiny'),
    // Utility Commands
    new SlashCommandBuilder().setName('credits').setDescription('Credits to all the Cloudy contributers!'),
    new SlashCommandBuilder().setName('minecraft').setDescription('The IP and Port for the Minecraft server'),
].map(command => command.toJSON());

const guildId = '1463364922103693577';
const appId = '1521963518537105569';
let secret;

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
        
        await buildDynamicEmojiObject(false);
        
        const rawData = await fs.readFile(path.join(__dirname, 'FilteredWords.txt'), { encoding: "utf-8" });
        const filteredWordsArray = rawData.split(/\r?\n/).map(word => word.trim()).filter(word => word.length > 0);
        
        await initFilters(client, filteredWordsArray, channels);
        await initCommands(client, appId, secret, guildId, commands);
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
    secret = await fs.readFile(path.join(__dirname, 'CloudySecret.txt'), {encoding:"utf-8"});
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
        const guild = await client.guilds.fetch(guildId);
        if (!guild) {
            console.error("Target server could not be located.");
            return;
        }
        
        const freshEmojis = await guild.emojis.fetch();
        
        for (const emoji of freshEmojis.values()) {
            const prefix = emoji.animated ? 'a:' : ':';
            emojis[emoji.name] = `<${prefix}${emoji.name}:${emoji.id}>`;
            
            if (download) {
                const outputDir = path.join(__dirname, 'emojis');
                if (download && !fsSync.existsSync(outputDir)) {
                    fsSync.mkdirSync(outputDir, { recursive: true });
                }
                const ext = emoji.animated ? 'gif' : 'png';
                const url = `https://cdn.discordapp.com/emojis/${emoji.id}`;
                const outputPath = path.join(outputDir, `${emoji.name}.${ext}`);
                
                try {
                    console.log(`Downloading ${emoji.name}...`);
                    await downloadFile(url, outputPath);
                } catch (downloadError) {
                    console.error(`Failed to download emoji "${emoji.name}":`, downloadError.message);
                }
            }
        }
        
        for (const [categoryName, emojiNamesArray] of Object.entries(categoryDefinitions)) {
            emojis.categories[categoryName] = emojiNamesArray
            .map(name => emojis[name])
            .filter(Boolean);
        }
        
    } catch (error) {
        console.error("Failed to dynamically build emoji structures:", error);
    }
}

startBot();