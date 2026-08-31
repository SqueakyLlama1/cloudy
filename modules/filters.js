import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read blocked words
const filteredWordsFile = await fs.readFile(path.join(__dirname, '..', 'filters', 'words.txt'), { encoding: "utf-8" });
const filteredWords = filteredWordsFile.split(/\r?\n/).map(word => word.trim()).filter(word => word.length > 0);

// Helper function to hash buffer data using SHA-256
const calculateHash = (buffer) => {
    return crypto.createHash('sha256').update(buffer).digest('hex');
};

export const initFilters = async (client, channels) => {
    const messageLogsChannelId = channels.staff.logs.messages;
    const messageLogsChannel = await client.channels.fetch(messageLogsChannelId);

    // 1. Read files from filters/files directory and load their hashes into a Set
    const blockedHashes = new Set();
    const filesDir = path.join(__dirname, '..', 'filters', 'files');

    try {
        const files = await fs.readdir(filesDir);
        for (const file of files) {
            const filePath = path.join(filesDir, file);
            const stat = await fs.stat(filePath);

            // Ensure it is a file (not a folder)
            if (stat.isFile()) {
                const fileBuffer = await fs.readFile(filePath);
                const fileHash = calculateHash(fileBuffer);
                blockedHashes.add(fileHash);
            }
        }
        console.log(`Loaded ${blockedHashes.size} image hashes into memory filter.`);
    } catch (error) {
        console.error('Error loading image filter files:', error);
    }

    // 2. Message Event Listener
    client.on('messageCreate', async (message) => {
        if (message.author.bot) return;

        // Invite Filter
        if (message.content.toLowerCase().includes(`discord.gg/`)) {
            await messageLogsChannel.send(`${message.author} Deleted Invite:\n\`\`${message.content}\`\``);
            await message.channel.send(`${message.author} You aren't able to send invite links in here.`);
            await message.delete();
            return;
        }

        // Word Filter
        const containsBlockedWord = filteredWords.some(word => message.content.toLowerCase().includes(word.toLowerCase()));
        if (containsBlockedWord) {
            try {
                await messageLogsChannel.send(`${message.author} Triggered the filter with the message:\n||${message.content}||`);
                await message.delete();
            } catch (error) {
                console.error('Failed to delete or reply:', error);
            }
            return;
        }

        // Attachment Image Hash Filter
        if (message.attachments.size > 0 && blockedHashes.size > 0) {
            for (const attachment of message.attachments.values()) {
                try {
                    // Fetch attachment directly into memory buffer
                    const response = await fetch(attachment.url);
                    if (!response.ok) continue;

                    const arrayBuffer = await response.arrayBuffer();
                    const buffer = Buffer.from(arrayBuffer);
                    const attachmentHash = calculateHash(buffer);

                    if (blockedHashes.has(attachmentHash)) {
                        await messageLogsChannel.send(`${message.author} sent a blacklisted image file (${attachment.name}).`);
                        await message.delete();
                        return; // Stop checking further attachments once deleted
                    }
                } catch (error) {
                    console.error('Failed to process message attachment hash:', error);
                }
            }
        }
    });
};