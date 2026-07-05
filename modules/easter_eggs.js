let pongCount = 0;
let lastPongTime = null;
let isOnBreak = false;
let breakEndTime = null;

function wait(ms) {return new Promise(resolve => setTimeout(resolve, ms));}

export const initEasterEggs = async (client, command_prefix) => {
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;
        const botPinged = message.mentions.has(client.user);
        
        // Ping-Pong Easter Egg
        if (message.content.toLowerCase() === `${command_prefix}ping`) {
            const currentTime = Date.now();
            
            if (isOnBreak) {
                if (currentTime < breakEndTime) {
                    const timeLeft = Math.ceil((breakEndTime - currentTime) / 1000);
                    await message.reply(`My arm is tired. I'm taking a break. Let's keep playing in **${timeLeft} seconds**.`);
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
                await message.reply(`My arm is getting tired :c\nCan we please take a break?`);
                return;
            }
            
            await message.reply(`🏓 Pong!`);
            return;
        }
        
        
        // Bite Easter Egg
        if (botPinged && message.content.includes('<:bite:1465757765426348187>')) {
            await message.reply(`HEY! That's not nice!!! That HURT! <:tantrum:1478184349961683045>`);
            return;
        }
        
        // Tiny Easter Egg
        if (botPinged && message.content.toLowerCase().includes('tiny')) {
            await message.reply(`<:raspberry:1488606658727772320>`);
            return;
        }
        
        // Vibe Coded Easter Egg
        if (botPinged && message.content.toLowerCase().includes('vibe') && message.content.toLowerCase().includes('coded')) {
            await message.reply(`Yesn't`);
            return;
        }

        // My better coded kjsdhflksdkjfhsdkjf willow.py javascript sucks
        if (message.content.toLowerCase() === `${command_prefix}willowmode`) {
            await message.reply(`willow is sooo cool`);
            await wait(1000);
            await message.channel.send(`and theyre NOT tiny`);
            return;
        }

        // Squeaky Code
        if (message.content.toLowerCase() === `${command_prefix}squeakymode`) {
            await message.reply(`squeaky is soo itty bitty and tiny`);
            await wait(1000);
            await message.channel.send(`vewy smol`);
            return;
        }

        // Funny
        if (message.content.toLowerCase() === `im big`) {
            await message.reply(`hey ${message.author}! lying is bad, tiny`);
            return;
        }
    });
};