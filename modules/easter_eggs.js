import { Events } from 'discord.js';

function wait(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

export const initEasterEggs = async (client, roles, emojis) => {
    
    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isChatInputCommand()) return;

        const { commandName } = interaction;
        const currentTime = Date.now();

        // /willowmode Slash Command
        if (commandName === 'willowmode') {
            await interaction.reply(`willow is sooo cool`);
            await wait(1000);
            await interaction.followUp(`and theyre NOT tiny`);
            return;
        }

        // /squeakymode Slash Command
        if (commandName === 'squeakymode') {
            await interaction.reply(`squeaky is soo itty bitty and tiny`);
            await wait(1000);
            await interaction.followUp(`vewy smol`);
            return;
        }
    });

    client.on(Events.MessageCreate, async (message) => {
        if (message.author.bot) return;
        const botPinged = message.mentions.has(client.user);
        
        // -------- Emoji Easter Eggs --------
        
        // Bite
        if (botPinged && message.content.includes(emojis.bite)) {
            await message.reply(`HEY! That hurt!! Please don't bite me :c`);
            return;
        }
        
        // Hug
        if (botPinged && emojis.categories.hug.some(hugEmoji => message.content.includes(hugEmoji))) {
            if (!message.guild || !message.member) return;
            
            const freshMember = await message.guild.members.fetch({ user: message.author.id, force: true });
            const memberRoles = freshMember.roles.cache;
            
            const hasLittleRole = memberRoles.has(roles.littlespace.little);
            const hasCaregiverRole = memberRoles.has(roles.littlespace.caregiver);
            const hasSwitchRole = memberRoles.has(roles.littlespace.switch);
            
            if ((hasLittleRole && hasCaregiverRole) || hasSwitchRole) {
                await message.reply(emojis.cg_hold_bab);
                return;
            }
            if (hasLittleRole) {
                await message.reply(emojis.cuddles);
                return;
            }
            if (hasCaregiverRole) {
                await message.reply(emojis.cg_hold_bab);
                return;
            }
            await message.reply(emojis.cuddles);
            return;
        }
        
        // -------- Keyword Easter Eggs --------
        
        // Tiny Easter Egg
        if (botPinged && message.content.toLowerCase().includes('tiny')) {
            await message.reply(emojis.raspberry);
            return;
        }
        
        // Vibe Coded Easter Egg
        if (botPinged && message.content.toLowerCase().includes('vibe') && message.content.toLowerCase().includes('coded')) {
            await message.reply(`Yesn't`);
            return;
        }
        
        // Funny (Im big)
        if (message.content.toLowerCase() === `im big`) {
            await message.reply(`hey ${message.author}! lying is bad, tiny`);
            return;
        }
    });
};