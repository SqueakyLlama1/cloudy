import { Events, REST, Routes, SlashCommandBuilder } from 'discord.js';

export const initCommands = async (client, appId, secret, guildId, commands = []) => {
    const rest = new REST({ version: '10' }).setToken(secret);
    
    try {
        console.log('Started refreshing application (/) commands.');
        
        await rest.put(
            Routes.applicationGuildCommands(appId, guildId),
            { body: commands },
        );
        
        console.log('Successfully re-registered application (/) commands.');
    } catch (error) {
        console.error('Failed to register application commands:', error);
    }
    
    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        const { commandName } = interaction;

        if (commandName === 'credits') {
            await interaction.reply({content: `Lead Developer - <@1374553820591292487>\nContributor - <@1083102195337150505>`, ephemeral: true});
        }

        if (commandName === 'minecraft') {
            await interaction.reply(`Minecraft Server Details:\nJava: play.squeakyllama.com\nBedrock: play.squeakyllama.com | Port 19132\nNote: The server is not yet done.`);
        }
    });
};