import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataPath = path.join(__dirname, '..', 'app_state', 'reaction_role_messages.json');

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
    const multiContextEmojis = [
        '1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟',
        '🟢','🔴','❓','🔵','🟣','🟡','🟠','✅','🚫','🛑'
    ];

    if (multiContextEmojis.includes(name)) {
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
            text: `**Required: What's your age?**\n-# Note: This is required in order to be able to chat in our server.\n\n3️⃣ - 13\n4️⃣ - 14\n5️⃣ - 15\n6️⃣ - 16\n7️⃣ - 17\n8️⃣ - 18\n9️⃣ - 19`,
            emojis: ['3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'],
            context: 'age'
        },
        {
            key: 'littlespace',
            text: `**Optional: Littlespace Roles**\n\n${emojis['pat_bab'] || '🍼'} - You're a Little.\n${emojis['cg_smirk'] || '🧸'} - You're a Caregiver.\n🔀 - You're a Flip (both)`,
            emojis: ['pat_bab', 'cg_smirk', '🔀'],
            context: 'littlespace'
        },
        {
            key: 'colors',
            text: `**Color Roles**\nThese color your display name/username in chat\n\nRed - 1\nYellow - 2\nGreen - 3\nBlue - 4\nTeal - 5\nHot Pink - 6\nSoft Pink - 7\nPurple - 8\nBlack - 9\nOrange - 10`,
            emojis: ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'],
            context: 'color'
        },
        {
            key: 'gender',
            text: `**Optional: What's your gender?**\n\n🔵 - Boy\n🟣 - Girl\n🟢 - Non Binary\n🟡 - Gender Fluid\n🟠 - Deciding Gender`,
            emojis: ['🔵','🟣','🟢','🟡','🟠'],
            context: 'gender'
        },
        {
            key: 'sexuality',
            text: `**Optional: Sexuality Roles**\n\nStraight - 1\nBisexual - 2\nGay - 3\nLesbian - 4\nPansexual - 5\nOther - 6`,
            emojis: ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣'],
            context: 'sex'
        },
        {
            key: 'ping_boundaries',
            text: `**Recommended: Ping Boundaries:**\nShould members of this server ping you?\n-# Note: This does not apply to important staff matters, announcements, and PSAs\n\n✅ - Okay to Ping\n🛑 - Do Not Ping`,
            emojis: ['✅', '🛑'],
            context: 'ping_boundary'
        },
        {
            key: 'tease_boundaries',
            text: `**Recommended: Tease Boundaries**\nShould members of this server tease you?\n\n✅ - Okay to Tease\n❓ - Ask to Tease\n🛑 - Do Not Tease`,
            emojis: ['✅', '❓', '🛑'],
            context: 'tease'
        },
        {
            key: 'dm_boundaries',
            text: `**Recommended: DM Boundaries**\nShould members of this server send you DMs?\n\n✅ - DMs Open\n❓ - Ask to DM\n🛑 - DMs Closed`,
            emojis: ['✅','❓','🛑'],
            context: 'dm'
        },
        {
            key: 'friend_boundaries',
            text: `**Recommended: Friend Requests Boundaries**\n Should members of this server send you Friend Requests?\n\n✅ - Friend Requests Open\n❓ - Ask to Friend\n🛑 - Friend Requests Closed`,
            emojis: ['✅','❓','🛑'],
            context: 'friend'
        },
        {
            key: 'pings',
            text: `**Optional: Ping Roles**\nHere you can select what you would like to receieve notifications about\n-# Note: This does not apply to important announcements and PSAs.\n\nAnnouncement Ping - 📢\nBump Ping - 👊\nDead Chat Ping - 💬\nVC Ping - 🎤\nBirthday Ping - 🎉`,
            emojis: ['📢','👊','💬','🎤','🎉'],
            context: 'ping_notify'
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

        'pat_bab_littlespace': roles.littlespace.little,
        'cg_smirk_littlespace': roles.littlespace.caregiver,
        '🔀_littlespace': roles.littlespace.flip,

        '1️⃣_color': roles.color.red,
        '2️⃣_color': roles.color.yellow,
        '3️⃣_color': roles.color.green,
        '4️⃣_color': roles.color.blue,
        '5️⃣_color': roles.color.teal,
        '6️⃣_color': roles.color['hot-pink'],
        '7️⃣_color': roles.color['soft-pink'],
        '8️⃣_color': roles.color.purple,
        '9️⃣_color': roles.color.black,
        '🔟_color': roles.color.orange,

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

        '✅_ping_boundary': roles.boundary.ping.ok,
        '🛑_ping_boundary': roles.boundary.ping.no,

        '✅_tease': roles.boundary.tease.ok,
        '❓_tease': roles.boundary.tease.ask,
        '🛑_tease': roles.boundary.tease.no,

        '✅_dm': roles.boundary.dms.open,
        '❓_dm': roles.boundary.dms.ask,
        '🛑_dm': roles.boundary.dms.closed,

        '✅_friend': roles.boundary['friend-requests'].open,
        '❓_friend': roles.boundary['friend-requests'].ask,
        '🛑_friend': roles.boundary['friend-requests'].closed,

        '📢_ping_notify': roles.ping.announcement,
        '👊_ping_notify': roles.ping.bump,
        '💬_ping_notify': roles.ping['dead-chat'],
        '🎤_ping_notify': roles.ping['voice-chat'],
        '🎉_ping_notify': roles.ping.birthday
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
                    return d.context && emojiKey.endsWith(`_${d.context}`);
                });

                if (!block) continue;

                const message = await channel.messages.fetch(block.id).catch(() => null);
                if (!message) continue;

                let rawEmojiName = emojiKey.split('_')[0];
                let targetReaction = message.reactions.cache.find(r => r.emoji.name === rawEmojiName);

                if (!targetReaction && ['pat_bab', 'cg_smirk'].includes(rawEmojiName)) {
                    const mappedCustomEmoji = emojis[rawEmojiName];
                    if (mappedCustomEmoji) {
                        const customId = mappedCustomEmoji.match(/:(\d+)>$/)?.[1];
                        targetReaction = message.reactions.cache.find(r => r.emoji.id === customId);
                    }
                }

                if (!targetReaction) continue;

                if (!hasRole) {
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