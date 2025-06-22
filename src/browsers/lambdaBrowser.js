import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { BrowserType } from './browserType.js';

export class LambdaBrowser extends BrowserType {
    async launch(config) {
        return puppeteer.launch({
            args: [
                ...chromium.args,
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-setuid-sandbox',
                '--no-sandbox',
                '--no-zygote',
                '--single-process',
                '--disable-extensions',
                '--disable-web-security',
                '--disable-features=IsolateOrigins,site-per-process',
                '--disable-site-isolation-trials'
            ],
            defaultViewport: {
                deviceScaleFactor: 1,
                hasTouch: false,
                height: 1080,
                isLandscape: true,
                isMobile: false,
                width: 1920,
            },
            executablePath: await chromium.executablePath(),
            headless: "shell",
            ignoreHTTPSErrors: true,
            timeout: 30000
        });
    }
} 