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

        if (commandName === 'minecraft') {
            await interaction.reply(`Java & Bedrock:\nIP: play.squeakyllama.com\nPort: 19132`);
        }
    });
};