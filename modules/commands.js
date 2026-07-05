export const initCommands = async (client, command_prefix) => {
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;
        const botPinged = message.mentions.has(client.user);
        
        // Credits
        if (message.content.toLowerCase() === `${command_prefix}credits`) {
            await message.reply(`Lead Developer - <@1374553820591292487>\nContributor - <@1083102195337150505>`);
            return;
        }
    });
};