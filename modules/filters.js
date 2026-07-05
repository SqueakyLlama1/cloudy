export const initFilters = async (client, filteredWords = [], messageLogsChannelId) => {
    const messageLogsChannel = await client.channels.fetch(messageLogsChannelId);
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;
        const botPinged = message.mentions.has(client.user);

        // Invite Filter
        if (message.content.toLowerCase() === `discord.gg/`) {
            await messageLogsChannel.send(`${message.author} Deleted Invite:\n\`\`${message.content}\`\``);
            await message.channel.send(`${message.author} You aren't able to send invite links in here.`);
            message.delete();
            return;
        }
        
        // Slur Filter
        const containsBlockedWord = filteredWords.some(word => message.content.toLowerCase().includes(word.toLowerCase()));
        
        if (containsBlockedWord) {
            try {
                await messageLogsChannel.send(`${message.author} Triggered the filter with the message:\n||${message.content}||`);
                await message.delete();
            } catch (error) {
                console.error('Failed to delete or reply:', error);
            }
            return;
        }
    });
};