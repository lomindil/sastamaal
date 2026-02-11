class ContextPool {
    constructor(browser, maxSize = 9) {
        this.browser = browser;
        this.maxSize = maxSize;

        this.available = [];
        this.inUse = new Set();
        this.waitQueue = [];
    }

    async init() {
        for (let i = 0; i < this.maxSize; i++) {
            const context = await this.browser.createBrowserContext();
            this.available.push(context);
        }
        console.log(`✅ Context pool initialized (${this.maxSize})`);
    }

    async acquire() {
        // If a context is available → give immediately
        if (this.available.length > 0) {
            const ctx = this.available.pop();
            this.inUse.add(ctx);
            return ctx;
        }

        // Otherwise wait
        return new Promise((resolve) => {
            this.waitQueue.push(resolve);
        }).then((ctx) => {
            this.inUse.add(ctx);
            return ctx;
        });
    }

    release(ctx) {
        if (!this.inUse.has(ctx)) return;

        this.inUse.delete(ctx);

        // If someone is waiting → handoff
        if (this.waitQueue.length > 0) {
            const next = this.waitQueue.shift();
            next(ctx);
        } else {
            this.available.push(ctx);
        }
    }

    async destroy() {
        for (const ctx of this.available) {
            await ctx.close();
        }
        for (const ctx of this.inUse) {
            await ctx.close();
        }
        this.available = [];
        this.inUse.clear();
    }
}

module.exports = ContextPool;

