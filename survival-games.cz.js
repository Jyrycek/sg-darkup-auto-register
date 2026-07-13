/**
 * mc.survival-games.cz auto-register
 * Uses block selection pattern matching with dictionary-based detection.
 */

const mineflayer = require('mineflayer');

class SGAutoRegister {
    constructor(username, password) {
        this.username = username;
        this.password = password;
        this.isAuthenticated = false;
        this.result = 'pending';
        this.done = new Promise(resolve => {
            this.resolveDone = resolve;
        });
        this.initBot();
    }

    // This server seems to use the same block list every time.
    // If that does not change, the fixed mapping is enough.
    static BLOCK_DICTIONARY = {
        'Diamond': 'diamond_block',
        'Iron': 'iron_block',
        'Redstone': 'redstone_block',
        'Lapis': 'lapis_block',
        'Obsidian': 'obsidian',
        'Coal': 'coal_block',
        'Gold': 'gold_block',
        'Emerald': 'emerald_block',
        'Wood': 'planks'
    };

    initBot() {
        console.log(`[${this.username}] Initializing bot...`);

        const botOptions = {
            username: this.username,
            host: 'mc.survival-games.cz',
            version: '1.8.9'
        };

        this.bot = mineflayer.createBot(botOptions);
        this.setupEvents();
    }

    setupEvents() {
        this.bot.on('login', () => {
            console.log(`[${this.username}] Connected to server`);
            this.bot.chat(`/register ${this.password} ${this.password}`);
        });

        this.bot.on('windowOpen', (window) => {
            console.log(`[${this.username}] Auto-register window opened: "${window.title}"`);

            const cleanTitle = this.cleanText(window.title);
            console.log(`[${this.username}] Cleaned title: "${cleanTitle}"`);

            const blockType = this.findBlockType(cleanTitle);

            if (!blockType) {
                console.log(`[${this.username}] No matching block found for: "${cleanTitle}"`);
                return;
            }

            console.log(`[${this.username}] Detected block type: ${blockType}`);

            const matchingItem = window.slots.find(
                item => item && item.name === blockType
            );

            if (!matchingItem) {
                console.log(`[${this.username}] Block "${blockType}" not found in inventory`);
                return;
            }

            console.log(`[${this.username}] Found block at slot ${matchingItem.slot}`);

            // 200ms delay to mimic human reaction time and avoid instant click detection
            setTimeout(() => {
                console.log(`[${this.username}] Clicking on ${blockType}...`);
                this.bot.clickWindow(matchingItem.slot, 0, 0);
                console.log(`[${this.username}] Waiting for authentication response...`);
            }, 200);
        });

        this.bot.on('chat', (username, message) => {
            if (message.includes('Go through nether portal now, please!')) {
                this.isAuthenticated = true;
                console.log(`[${this.username}] Authentication successful`);
                this.finish('success');
            }
        });

        this.bot.on('kick', (reason) => {
            console.log(`[${this.username}] Kicked: ${reason}`);
            this.isAuthenticated = false;
            this.finish('kicked');
        });

        this.bot.on('end', () => {
            console.log(`[${this.username}] Disconnected`);
            this.finish(this.isAuthenticated ? 'success' : 'ended');
        });
    }

    finish(result) {
        if (this.result !== 'pending') {
            return;
        }

        this.result = result;
        this.resolveDone();
    }

    cleanText(text) {
        return text
            .replace(/["']/g, '')
            .replace(/§[0-9a-fk-or]/gi, '')
            .trim();
    }

    findBlockType(cleanTitle) {
        const lowerTitle = cleanTitle.toLowerCase();

        for (const [key, value] of Object.entries(SGAutoRegister.BLOCK_DICTIONARY)) {
            if (lowerTitle.includes(key.toLowerCase())) {
                return value;
            }
        }

        return null;
    }
}

async function run() {
    const bot = new SGAutoRegister('NICKNAME', 'PASSWORD12345');
    await bot.done;

    console.log(`Authentication: ${bot.isAuthenticated ? 'SUCCESS' : 'FAILED'}`);
}

run();
