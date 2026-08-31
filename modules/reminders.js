import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { EmbedBuilder } from '@discordjs/builders';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.join(__dirname, '..', 'app_state', 'bump.json');

const getSavedBumpTime = () => {
    try {
        if (fs.existsSync(DB_PATH)) {
            const data = fs.readFileSync(DB_PATH, 'utf8');
            return JSON.parse(data).targetTime || null;
        }
    } catch (err) {
        console.error('Failed to read bump state:', err);
    }
    return null;
};

const saveBumpTime = (timestamp) => {
    try {
        fs.writeFileSync(DB_PATH, JSON.stringify({ targetTime: timestamp }), 'utf8');
    } catch (err) {
        console.error('Failed to save bump state:', err);
    }
};

export const initReminders = (client, channels, roles) => {
    const TWO_HOURS = 2 * 60 * 60 * 1000;
    
    // Unverified Reminder
    cron.schedule('0 12 15 * *', async () => {
        try {
            const channel = await client.channels.fetch(channels.important.announcements);
            if (channel) {
                await channel.send(`Hey <@&${roles.status.unverified}>! You have less than 15 days to submit an application to get verified, else you'll be kicked!`);
            } else {
                console.error('Error Sending Reminder! I could not find the announcements channel!');
            }
        } catch (err) {
            console.error(`An unexpected error occurred and I was unable to send the unverified reminder! Error: ${err}`);
        }
    });
    
    // Bump Reminder
    cron.schedule('* * * * *', async () => {
        const targetTime = getSavedBumpTime();
        if (!targetTime) return;
        
        if (Date.now() >= targetTime) {
            try {
                const channel = await client.channels.fetch(channels.miscellaneous.bump);
                
                if (channel) {
                    const embed = new EmbedBuilder().setColor(0x5865F2).setAuthor({ name: `Bump Time` }).setDescription(`**Time to bump!** Use \`/bump\` to bump our server!`);
                    // <@&${roles.ping.bump}>
                    await channel.send({content: `<@&${roles.ping.bump}>`, embeds: [embed]});
                    saveBumpTime(null);
                }
            } catch (err) {
                console.error('Failed to send persistent bump reminder:', err);
            }
        }
    });
    
    client.on('messageCreate', async (message) => {
        const DISBOARD_BOT_ID = '302050872383242240';
        if (message.author.bot && message.author.id !== DISBOARD_BOT_ID) return;
        
        const hasBumpSuccess = message.embeds.some(embed => 
            embed.description && embed.description.includes('Bump done!')
        );
        
        if (hasBumpSuccess) {
            const targetTime = Date.now() + TWO_HOURS;
            
            saveBumpTime(targetTime);
            console.log(`Bump detected! Scheduled next reminder for: ${new Date(targetTime).toLocaleTimeString()}`);
            
            try {
                await message.reply("Thanks for bumping our server! We'll remind you again in 2 hours!");
            } catch (err) {
                console.error('Failed to reply to bump confirmation:', err);
            }
        }
    });
};