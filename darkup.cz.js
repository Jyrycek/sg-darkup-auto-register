/**
 * mc.darkup.cz auto-register
 * Uses string similarity with leet speak normalization for menu selection.
 */

const mineflayer = require('mineflayer');
const stringSimilarity = require('string-similarity');

class DarkupAutoRegister {
    constructor(username, password) {
        this.username = username;
        this.password = password;
        this.isAuthenticated = false;
        this.isLoggedIn = false;
        this.result = 'pending';
        this.done = new Promise(resolve => {
            this.resolveDone = resolve;
        });
        this.initBot();
    }

    // Darkup replaces letters with numbers to confuse text comparison
    // This method converts numbers back to letters for proper matching
    static normalizeLeetSpeak(text) {
        if (!text) return text;
        
        const leetMap = {
            '1': 'i',
            '4': 'a',
            '3': 'e',
            '0': 'o',
            '5': 's',
        };

        let normalized = text.toLowerCase();
        
        for (const [number, letter] of Object.entries(leetMap)) {
            normalized = normalized.replace(new RegExp(number, 'g'), letter);
        }

        return normalized;
    }

    // Extract the colored word from title (e.g., "§4§lCOal bloCk")
    static extractTargetWord(title) {
        // Remove all color codes
        const clean = title.replace(/§[0-9a-fkl-or]/gi, '');

        // Remove special characters because darkup tries to confuse us with them
        const cleaned = clean.replace(/[^a-zA-Z0-9 ]/g, ' ');
        const words = cleaned.split(/\s+/);
        if (words.length <= 1) return clean;

        // Remove first word because darkup randomly adds a prefix word to the title
        return words.slice(1).join(' ');
    }

    initBot() {
        console.log(`[${this.username}] Initializing bot...`);

        const botOptions = {
            username: this.username,
            host: 'mc.darkup.cz',
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
            if (this.isLoggedIn) {
                return;
            }

            console.log(`[${this.username}] Darkup window opened: "${window.title}"`);
            this.handleDarkUpAuth(window);
        });

        this.bot.on('kick', (reason) => {
            console.log(`[${this.username}] Kicked: ${reason}`);
            this.isAuthenticated = false;
            this.finish('kicked');
        });

        this.bot.on('end', () => {
            console.log(`[${this.username}] Disconnected`);
            this.isAuthenticated = false;
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

    handleDarkUpAuth(window) {
        const targetWord = DarkupAutoRegister.extractTargetWord(window.title);
        console.log(`[${this.username}] Extracted target word from title: "${targetWord}"`);
        if (!targetWord) {
            console.log(`[${this.username}] Could not find target word in title`);
            return;
        }

        console.log(`[${this.username}] Target word: "${targetWord}"`);

        // Normalize target word
        const normalizedTarget = DarkupAutoRegister.normalizeLeetSpeak(targetWord);
        console.log(`[${this.username}] Normalized target: "${normalizedTarget}"`);

        let bestMatch = null;
        let highestSimilarity = 0;

        console.log(`[${this.username}] Scanning ${window.slots.length} slots for best match...`);

        window.slots.forEach(item => {
            if (item && item.displayName) {
                const itemName = item.displayName;
                const similarity = stringSimilarity.compareTwoStrings(normalizedTarget, itemName);
                
                console.log(`[${this.username}] Item "${item.displayName}" similarity: ${(similarity * 100).toFixed(1)}%`);

                if (similarity > highestSimilarity) {
                    highestSimilarity = similarity;
                    bestMatch = item;
                }
            }
        });

        if (bestMatch && highestSimilarity > 0.05) {
            console.log(
                `[${this.username}] Best match found: "${bestMatch.displayName}" (${(highestSimilarity * 100).toFixed(1)}% match)`
            );
            console.log(`[${this.username}] Clicking on slot ${bestMatch.slot}`);

            // Click the best match slot to authenticate
            this.bot.clickWindow(bestMatch.slot, 0, 0);
            this.isLoggedIn = true;
            this.isAuthenticated = true;

            console.log(`[${this.username}] Authentication successful`);
            this.finish('success');
        } else {
            console.log(`[${this.username}] No suitable match found (best: ${highestSimilarity * 100}%)`);
        }
    }
}

async function run() {
    console.log('Testing bypass for mc.darkup.cz');

    const bot = new DarkupAutoRegister('NIKCNAME', 'PASSWORD12345');
    await bot.done;

    console.log(`Authentication: ${bot.isAuthenticated ? 'SUCCESS' : 'FAILED'}`);
}

run();