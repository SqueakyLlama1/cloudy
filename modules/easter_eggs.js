let pongCount = 0;
let lastPongTime = null;
let isOnBreak = false;
let breakEndTime = null;

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
        }
        
        
        // Bite Easter Egg
        if (botPinged && message.content.includes('<:bite:1465757765426348187>')) {
            await message.reply(`HEY! That's not nice!!! That HURT!\n<@1374553820591292487> THEY BIT ME! <:tantrum:1478184349961683045>`);
            return;
        }
    });
};