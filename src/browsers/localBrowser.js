import puppeteer from 'puppeteer';
import { BrowserType } from './browserType.js';

export class LocalBrowser extends BrowserType {
    async launch(config) {
        return puppeteer.launch({
            headless: "new",
            defaultViewport: {
                deviceScaleFactor: 1,
                hasTouch: false,
                height: 1080,
                isLandscape: true,
                isMobile: false,
                width: 1920,
            }
        });
    }
} 