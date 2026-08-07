import Level from '../models/Levels.js';

export const initLevels = async (client, channels) => {

    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;

        const messageLogsChannelId = channels.staff.logs.messages;
        const messageLogsChannel = await client.channels.fetch(messageLogsChannelId);

        const botPinged = message.mentions.has(client.user);
        let user = await Level.findOne(message.author.id);

        if (!user) {
            user = await Level.create({
                accountId: message.author.id,
                created: new Date()
            });
        }

        await Level.update(message.author.id, {
            level: user.level,
            levelProgress: user.levelProgress + 1
        });

        if (user.levelProgress + 1 >= 100) {
            await Level.update(message.author.id, {
                level: user.level + 1,
                levelProgress: 0
            });
            const embed = new EmbedBuilder().setColor(0xFEE75C).setAuthor({ name: `${user.username} leveled up!` }).setTitle(`Level ${user.level}`);
            await messageLogsChannel.send({ embeds: [embed] });
        }

        

    });

    client.on(Events.InteractionCreate, async (interaction) => {
            if (!interaction.isChatInputCommand()) return;
            
            const { commandName } = interaction;
            const currentTime = Date.now();
            
            // Ping Pong Game
            if (commandName === 'checklevel') {
                const user = await Level.findOne(interaction.user.id);
                if (!user) {
                    await interaction.reply(`You haven't sent any messages yet, so you don't have a level.`);
                    return;
                }
                await interaction.reply(`You are currently at level ${user.level} with ${user.levelProgress} progress.`);
                return;
            } else if (commandName === 'leaderboard') {
                const [rows] = await pool.query(
                    'SELECT * FROM levels ORDER BY level DESC, levelProgress DESC LIMIT 10'
                );
                if (rows.length === 0) {
                    await interaction.reply(`No users have leveled up yet.`);
                    return;
                }
                const leaderboard = rows.map((row, index) => `${index + 1}. ${row.accountId} - Level ${row.level}`);
                const embed = new EmbedBuilder().setColor(0xFEE75C).setTitle(`Leaderboard`).setDescription(leaderboard.join('\n'));
                await interaction.reply({ embeds: [embed] });
                return;
            }
        });
}