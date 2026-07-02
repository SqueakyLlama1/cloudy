import cron from 'node-cron';

const announcementsChannelId = '1463538828815110227';
const unverifiedRoleId = '1463545366124302337';

export const initReminders = (client) => {
    // Unverified Reminder

    cron.schedule('0 12 15 * *', async() => {
        console.log('Reminding Unverified Members to Verify');
        
        try {
            const channel = await client.channels.fetch(announcementsChannelId);
            if (channel) {
                await channel.send(`Hey <@R${unverifiedRoleId}>! You have less than 15 days to submit an application to get verified, else you'll be kicked!`);
            } else {
                console.error('Error Sending Reminder! I could not find the announcements channel!');
            }
        } catch (err) {
            console.error(`An unexpected error occured and I was unable to send the unverified reminder! Error: ${err}`);
        }
    }) 
}