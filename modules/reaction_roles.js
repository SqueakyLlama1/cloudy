import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '..', 'tracked_messages.json');

let EMOJI_TO_ROLE_MAP = {};
const userQueues = new Map();

async function getTrackedData() {
    try {
        const data = await fs.readFile(dataPath, 'utf-8');
        return JSON.parse(data);
    } catch {
        const initialData = { messageIds: [], deployments: {} };
        await fs.writeFile(dataPath, JSON.stringify(initialData, null, 2), 'utf-8');
        return initialData;
    }
}

async function saveTrackedData(data) {
    await fs.writeFile(dataPath, JSON.stringify(data, null, 2), 'utf-8');
}

function getMapKey(reaction, contextType = '') {
    const name = reaction.emoji.name;
    if (['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'].includes(name) || ['🟢','🔴','❓','🔵','🟣','🟡','🟠'].includes(name)) {
        return contextType ? `${name}_${contextType}` : name;
    }
    return name;
}

function enqueueTask(userId, taskFn) {
    if (!userQueues.has(userId)) {
        userQueues.set(userId, Promise.resolve());
    }
    const currentQueue = userQueues.get(userId);
    const nextQueue = currentQueue.then(() => taskFn().catch(() => null));
    userQueues.set(userId, nextQueue);
    
    nextQueue.then(() => {
        if (userQueues.get(userId) === nextQueue) {
            userQueues.delete(userId);
        }
    });
}

async function deploySystemMessages(channel, roles, emojis) {
    const data = await getTrackedData();
    
    const posts = [
        {
            key: 'age',
            text: `**What's your age? (required.)**\n3️⃣ - 13\n4️⃣ - 14\n5️⃣ - 15\n6️⃣ - 16\n7️⃣ - 17\n8️⃣ - 18\n9️⃣ - 19`,
            emojis: ['3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'],
            context: 'age'
        },
        {
            key: 'littlespace',
            text: `**Littlespace Roles**\n${emojis['pat_bab'] || '🍼'} - You're a Little.\n${emojis['cg_smirk'] || '🧸'} - You're a Caregiver.\n🔄 - You're a switch (both)`,
            emojis: ['pat_bab', 'cg_smirk', '🔄'],
            context: ''
        },
        {
            key: 'colors',
            text: `**Color Roles**\n<@&${roles.color.red}> - 1\n<@&${roles.color.yellow}> - 2\n<@&${roles.color.green}> - 3\n<@&${roles.color.blue}> - 4\n<@&${roles.color.teal}> - 5\n<@&${roles.color['hot-pink']}> - 6\n<@&${roles.color['soft-pink']}> - 7\n<@&${roles.color.purple}> - 8\n<@&${roles.color.black}> - 9\n<@&${roles.color.orange}> - 10`,
            emojis: ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'],
            context: ''
        },
        {
            key: 'gender',
            text: `**What's your gender? (optional)**\n🔵 - Boy\n🟣 - Girl\n🟢 - Non Binary\n🟡 - Gender Fluid\n🟠 - Deciding Gender`,
            emojis: ['🔵','🟣','🟢','🟡','🟠'],
            context: 'gender'
        },
        {
            key: 'sexuality',
            text: `**Sexuality Roles**\nStraight - 1\nBisexual - 2\nGay - 3\nLesbian - 4\nPansexual - 5\nOther - 6`,
            emojis: ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣'],
            context: 'sex'
        },
        {
            key: 'dm_boundaries',
            text: `**DM Status; These reflect your boundaries.**\n🟢 - DMs Open\n🔴 - DMs Closed\n❓ - Ask to DM`,
            emojis: ['🟢','🔴','❓'],
            context: 'dm'
        },
        {
            key: 'friend_boundaries',
            text: `**Friend Requests. Do you want people in this server to send you friend requests?**\n🟢 - Friend Requests Open\n🔴 - Friend Requests Closed\n❓ - Ask to Friend`,
            emojis: ['🟢','🔴','❓'],
            context: 'friend'
        },
        {
            key: 'pings',
            text: `**Ping Roles**\nAnnouncement Ping - 1\nBump Ping - 2\nDead Chat Ping - 3\nVC Ping - 5\nBirthday Ping - 6`,
            emojis: ['1️⃣','2️⃣','3️⃣','5️⃣','6️⃣'],
            context: 'ping'
        },
        {
            key: 'pad_art',
            text: `**Padded Art Role**\n${emojis['color'] || '🎨'} - Padded Art`,
            emojis: ['color'],
            context: ''
        }
    ];

    for (const post of posts) {
        if (data.deployments[post.key]) continue;

        const msg = await channel.send(post.text);
        for (const emo of post.emojis) {
            const finalEmoji = emojis[emo] || emo;
            await msg.react(finalEmoji).catch(() => null);
        }

        data.messageIds.push(msg.id);
        data.deployments[post.key] = { id: msg.id, context: post.context };
    }

    await saveTrackedData(data);
}

export const initReactionRoles = async (client, channels, roles, emojis) => {
    const rolesChannelId = channels.important.roles;

    EMOJI_TO_ROLE_MAP = {
        '3️⃣_age': roles.age['13'],
        '4️⃣_age': roles.age['14'],
        '5️⃣_age': roles.age['15'],
        '6️⃣_age': roles.age['16'],
        '7️⃣_age': roles.age['17'],
        '8️⃣_age': roles.age['18'],
        '9️⃣_age': roles.age['19'],

        'pat_bab': roles.littlespace.little,
        'cg_smirk': roles.littlespace.caregiver,
        '🔄': roles.littlespace.switch,

        '1️⃣': roles.color.red,
        '2️⃣': roles.color.yellow,
        '3️⃣': roles.color.green,
        '4️⃣': roles.color.blue,
        '5️⃣': roles.color.teal,
        '6️⃣': roles.color['hot-pink'],
        '7️⃣': roles.color['soft-pink'],
        '8️⃣': roles.color.purple,
        '9️⃣': roles.color.black,
        '🔟': roles.color.orange,

        '🔵_gender': roles.gender.boy,
        '🟣_gender': roles.gender.girl,
        '🟢_gender': roles.gender['non-binary'],
        '🟡_gender': roles.gender.fluid,
        '🟠_gender': roles.gender.deciding,

        '1️⃣_sex': roles.sexuality.straight,
        '2️⃣_sex': roles.sexuality.bisexual,
        '3️⃣_sex': roles.sexuality.gay,
        '4️⃣_sex': roles.sexuality.lesbian,
        '5️⃣_sex': roles.sexuality.pansexual,
        '6️⃣_sex': roles.sexuality.other,

        '🟢_dm': roles.boundary['dm-status'].open,
        '🔴_dm': roles.boundary['dm-status'].closed,
        '❓_dm': roles.boundary['dm-status'].ask,

        '🟢_friend': roles.boundary['friend-request-status'].open,
        '🔴_friend': roles.boundary['friend-request-status'].closed,
        '❓_friend': roles.boundary['friend-request-status'].ask,

        '1️⃣_ping': roles.ping.announcement,
        '2️⃣_ping': roles.ping.bump,
        '3️⃣_ping': roles.ping['dead-chat'],
        '5️⃣_ping': roles.ping['voice-chat'],
        '6️⃣_ping': roles.ping.birthday,

        'color': roles.access['pad-art']
    };

    const channel = await client.channels.fetch(rolesChannelId).catch(() => null);
    if (channel) {
        await deploySystemMessages(channel, roles, emojis);
    }

    client.on('messageReactionAdd', async (reaction, user) => {
        if (user.bot || reaction.message.channelId !== rolesChannelId) return;
        enqueueTask(user.id, async () => {
            if (reaction.partial) await reaction.fetch().catch(() => null);

            const data = await getTrackedData();
            if (!data.messageIds.includes(reaction.message.id)) return;

            const block = Object.values(data.deployments).find(d => d.id === reaction.message.id);
            const context = block ? block.context : '';

            const key = getMapKey(reaction, context);
            const roleId = EMOJI_TO_ROLE_MAP[key];
            if (!roleId) return;

            const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
            if (member && !member.roles.cache.has(roleId)) {
                await member.roles.add(roleId);
            }
        });
    });

    client.on('messageReactionRemove', async (reaction, user) => {
        if (user.bot || reaction.message.channelId !== rolesChannelId) return;
        enqueueTask(user.id, async () => {
            if (reaction.partial) await reaction.fetch().catch(() => null);

            const data = await getTrackedData();
            if (!data.messageIds.includes(reaction.message.id)) return;

            const block = Object.values(data.deployments).find(d => d.id === reaction.message.id);
            const context = block ? block.context : '';

            const key = getMapKey(reaction, context);
            const roleId = EMOJI_TO_ROLE_MAP[key];
            if (!roleId) return;

            const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
            if (member && member.roles.cache.has(roleId)) {
                await member.roles.remove(roleId);
            }
        });
    });

    client.on('guildMemberUpdate', async (oldMember, newMember) => {
        if (!channel) return;
        
        const oldRoles = oldMember.roles.cache;
        const newRoles = newMember.roles.cache;
        
        if (oldRoles.equals(newRoles)) return;

        enqueueTask(newMember.id, async () => {
            const data = await getTrackedData();
            if (!data.messageIds.length) return;

            for (const [emojiKey, roleId] of Object.entries(EMOJI_TO_ROLE_MAP)) {
                const hadRole = oldRoles.has(roleId);
                const hasRole = newRoles.has(roleId);

                if (hadRole === hasRole) continue;

                const block = Object.values(data.deployments).find(d => {
                    if (emojiKey.endsWith(`_${d.context}`) && d.context !== '') return true;
                    if (!emojiKey.includes('_') && d.context === '') return true;
                    if (['pat_bab', 'cg_smirk', '🔄'].includes(emojiKey) && d.id === data.deployments.littlespace?.id) return true;
                    if (emojiKey === 'color' && d.id === data.deployments.pad_art?.id) return true;
                    return false;
                });

                if (!block) continue;

                const message = await channel.messages.fetch(block.id).catch(() => null);
                if (!message) continue;

                let rawEmojiName = emojiKey.split('_')[0];
                let targetReaction = message.reactions.cache.find(r => r.emoji.name === rawEmojiName);

                if (!targetReaction && ['pat_bab', 'cg_smirk', 'color'].includes(emojiKey)) {
                    const mappedCustomEmoji = emojis[emojiKey];
                    if (mappedCustomEmoji) {
                        const customId = mappedCustomEmoji.match(/:(\d+)>$/)?.[1];
                        targetReaction = message.reactions.cache.find(r => r.emoji.id === customId);
                    }
                }

                if (!targetReaction) continue;

                if (hasRole) {
                    const users = await targetReaction.users.fetch().catch(() => null);
                    if (users && !users.has(newMember.id)) {
                        await targetReaction.message.react(targetReaction.emoji).catch(() => null);
                    }
                } else {
                    const users = await targetReaction.users.fetch().catch(() => null);
                    if (users && users.has(newMember.id)) {
                        await targetReaction.users.remove(newMember.id).catch(() => null);
                    }
                }
            }
        });
    });

    client.on('guildMemberRemove', async (member) => {
        try {
            const data = await getTrackedData();
            if (!data.messageIds.length || !channel) return;

            for (const messageId of data.messageIds) {
                const message = await channel.messages.fetch(messageId).catch(() => null);
                if (!message) continue;

                for (const reaction of message.reactions.cache.values()) {
                    const users = await reaction.users.fetch().catch(() => null);
                    if (users && users.has(member.id)) {
                        await reaction.users.remove(member.id).catch(() => null);
                    }
                }
            }
        } catch (err) {
            console.error(err);
        }
    });
};