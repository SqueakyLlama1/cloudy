import { Level } from '../models/Levels.js';
const levelUpXP = 25;
const xpPerMessage = 1;
export const initLevels = async (client, command_prefix) => {
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;
        // Add XP for each message sent
        let user = await Level.findOne({ accountId: message.author.id });
        user.levelProgress += xpPerMessage;
        if (user.levelProgress >= levelUpXP) {
            user.level += 1;
            user.levelProgress = 0;
            await message.channel.send(`${message.author} has leveled up to level ${user.level}!`);
        }

        // Check level command
        if (message.content.toLowerCase() === `${command_prefix}checklevel`) {
            await message.reply(`You are level ${user.level} with ${user.levelProgress} XP.`);
            return;
        }

        // Get leaderboard command
        if (message.content.toLowerCase() === `${command_prefix}leaderboard`) {
            const topUsers = await Level.find().sort({ level: -1, levelProgress: -1 }).limit(10);
            let leaderboardMessage = 'Leaderboard:\n';
            topUsers.forEach((user, index) => {
                leaderboardMessage += `${index + 1}. <@${user.accountId}> - Level ${user.level} (${user.levelProgress} XP)\n`;
            }); 
            await message.channel.send(leaderboardMessage);
            return;
        }
        
    });
};