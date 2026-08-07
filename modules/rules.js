const rules = {
    "1.0": "All users must maintain a non-explicit environment. This applies to (but is not limited to:) jokes, imagery, conversations, and audio. This server accompanies minors, we cannot tolerate explicit material per Discord's Guidelines.",
    "1.1": "For media/conversations that could be potentially triggering; ||Gun use, Drug Use, Suicide, Mental Health, Sexual Abuse, ETC|| please use the dedicated Sensitive topics channel for this purpose",
    "1.2": "Baby talk, diaper usage, and discussions surrounding diapers are not permitted in the general channels. We have a dedicated ⁠littlespace / rp channel for this purpose.",
    "1.3": "Please do not show pictures of you actively wearing a diaper in the little gear channel, or anywhere within the server. This causes the server to be limited. If you wish to show a user self-made content involving diapers, please do so consensually in their dms, not in the server.",
    "1.4": "Media involving convicted predators ||(I.E. Jeffery Epstein, Diddy, etc.)|| and jokes surrounding them are not permitted.",
    "1.5": "Please do not share scat when sharing padded artwork. 'Messy' images are fine with spoilers, as long as it's not 'Hyper-messing'. All content involved padded artwork belongs in the respective ⁠padded-artwork channel. You can access this channel by getting the sensitive art role in ⁠the roles channel.",
    "1.6": "Gore, Shock Content, Excessive Blood, and general NSFL aren't permitted anywhere within server grounds, or anywhere for that matter.",
    "1.7": "Do not share DM screenshots with anyone but staff, and especially do not post them in public channels.",
    "2.0": "All users MUST respect one another's boundaries, both within server grounds and inside direct messaging. Failure to comply will result in an immediate removal of server privileges.",
    "2.1": "All users of ages 16-19 must remain SFW and be mindful of age gaps when interacting with other server members. Failure to comply will result in an immediate removal of server privileges, and a PSA (Public Service Announcement) alert followed by your ban.",
    "2.2": "All users must treat one another with utmost respect. Conflict within public channels must be avoided at all costs. If you feel like you are unable to de-escalate things with another member, please ping the Support Team, or DM an online staff member to help things de-escalate. NO RAGEBAITING, it's lame.",
    "2.3": "To avoid conflict, the folowing are not permitted in public channels: Religion Talk, Political Talk, General Accusations.",
    "2.4": "If you have a personal issue with another user, please utilize the ticket system, much rather than starting conflict in the public channels. Similarly, if your ticket did not get you the resolution you wanted, accept our decision.",
    "2.5": "Do not advertise yourself. We are a TBDL focused server, but we are not a looking server. You are not permitted to primarily send messages that are looking for a CG, or a Little.",
    "2.6": "Respect all staff members and respect their authority. If you don't like how a situation was handled, bring it up in a ticket. You are not permitted to hurl insults at anyone.",
    "2.7": "Attempting to find 'loopholes' in the rules, and using that as plausible deniability will be rewarded with infractions. Even if it isn't explicitly said, if you believe it doesn't belong in the server, it doesn't. Use your brain."
};

export const initRules = async (client) => {
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;

        const contentLower = message.content.toLowerCase();
        
        if (!contentLower.includes('rule')) return;

        for (const ruleKey of Object.keys(rules)) {
            const lowerRuleKey = ruleKey.toLowerCase();

            const regex = new RegExp(`\\b${lowerRuleKey}\\b`);
            
            if (regex.test(contentLower)) {
                const presetMessage = `${ruleKey} - ${rules[ruleKey]}`;
                await message.reply(presetMessage);
                return; 
            }
        }
    });
};