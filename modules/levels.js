import Level from '../models/Levels.js';

const levelUpXP = 25;
const xpPerMessage = 1;

export const initLevels = async (client, command_prefix) => {
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;

        const guild = await client.guilds.fetch(process.env.GUILD_ID || "1463364922103693577");
        const onlineMembers = guild.members.cache.filter((m) => m.presence?.status == "online" && !m.user.bot).size;
        if (onlineMembers > 1) {
            client.user.setActivity(`Watching over ${onlineMembers} members`, { type: "WATCHING" });
        } else if (onlineMembers === 1) {
            client.user.setActivity(`Watching over ${onlineMembers} member`, { type: ActivityType.Watching });
        }

        const accountId = message.author.id;

        let user = await Level.findOne({ accountId });

        if (!user) {
            user = await Level.create({
                accountId,
                created: new Date(),
                level: 0,
                levelProgress: 0
            });
        }

        // Don't add XP to commands
        if (!message.content.startsWith(command_prefix)) {
            user.levelProgress += xpPerMessage;

            if (user.levelProgress >= levelUpXP) {
                user.level += 1;
                user.levelProgress = 0;

                await message.channel.send(
                    `${message.author} has leveled up to level ${user.level}!`
                );
            }

            await user.save();
        }


        // Check level command
        if (message.content.toLowerCase() === `${command_prefix}checklevel`) {
            await message.reply(
                `You are level ${user.level} with ${user.levelProgress} XP.`
            );
            return;
        }


        // Leaderboard command
        if (message.content.toLowerCase() === `${command_prefix}leaderboard`) {
            const topUsers = await Level.find()
                .sort({ level: -1, levelProgress: -1 })
                .limit(10);

            let leaderboardMessage = 'Leaderboard:\n';

            topUsers.forEach((user, index) => {
                leaderboardMessage += 
                    `${index + 1}. <@${user.accountId}> - Level ${user.level} (${user.levelProgress} XP)\n`;
            });

            await message.channel.send(leaderboardMessage);
        }
    });
};