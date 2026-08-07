import { Events, EmbedBuilder } from 'discord.js';

let pongCount = 0;
let lastPongTime = null;
let isOnBreak = false;
let breakEndTime = null;

export const initGames = async (client) => {
    client.on(Events.InteractionCreate, async (interaction) => {
        if (!interaction.isChatInputCommand()) return;
        
        const { commandName } = interaction;
        const currentTime = Date.now();
        
        // Ping Pong Game
        if (commandName === 'ping') {
            if (isOnBreak) {
                if (currentTime < breakEndTime) {
                    const timeLeft = Math.ceil((breakEndTime - currentTime) / 1000);
                    await interaction.reply(`My arm is tired. I'm taking a break. Let's keep playing in **${timeLeft} seconds**.`);
                    return;
                } else {
                    isOnBreak = false;
                    pongCount = 0;
                }
            }
            
            if (lastPongTime && (currentTime - lastPongTime <= 60000)) {
                pongCount++;
            } else {
                pongCount = 1;
            }
            
            lastPongTime = currentTime;
            
            if (pongCount >= 5) {
                isOnBreak = true;
                breakEndTime = currentTime + 30000;
                await interaction.reply(`My arm is getting tired :c\nCan we please take a break?`);
                return;
            }
            
            await interaction.reply(`🏓 Pong!`);
            return;
        }
        
        if (commandName === 'coinflip') {
            const randomNumber = Math.floor(Math.random() * 2);
            const headsOrTails = randomNumber ? 'Heads' : 'Tails';
            const user = interaction.user;
            
            const embed = new EmbedBuilder().setColor(0xFEE75C).setAuthor({ name: `${user.username} flipped a coin` }).setTitle(headsOrTails);

            await interaction.reply({ embeds: [embed] });
            return;
        }

        if (commandName === 'bubblewrap') {
            const bubblewrap = `|| pop ||`;
            const bubblewrapAmount = interaction.options.getNumber('amount') || 50;
            if (bubblewrapAmount > 150) {
                await interaction.reply('Too many bubbles! Max bubbles is 150!');
                return;
            }
            let concatenatedString = '';
            for (let i = 0; i < bubblewrapAmount; i++) {
                concatenatedString += bubblewrap;
            }
            await interaction.reply(concatenatedString);
            return;
        }
    });
}