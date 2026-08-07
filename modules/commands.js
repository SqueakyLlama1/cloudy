export const initCommands = async (client, command_prefix) => {
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;
        const botPinged = message.mentions.has(client.user);
        
        // Credits
        if (message.content.toLowerCase() === `${command_prefix}credits`) {
            await message.reply(`Lead Developer - <@1374553820591292487>\nContributor - <@1083102195337150505>`);
            return;
        }
        if (message.content.toLowerCase() === `${command_prefix}help`) {
            await message.reply(`
                **Commands:**
                \`${command_prefix}credits\` - View the credits
                \`${command_prefix}help\` - View this help message
                \`${command_prefix}checklevel\` - Check your current level and XP
                \`${command_prefix}leaderboard\` - View the top 10 users by level and XP
                \`${command_prefix}ping\` - Silly little ping command
            `);
            return;
        }
    });
};