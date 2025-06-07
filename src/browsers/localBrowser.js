import puppeteer from 'puppeteer';
import { BrowserType } from './browserType.js';

export class LocalBrowser extends BrowserType {
    async launch(config) {
        return puppeteer.launch({
            headless: "new",
            defaultViewport: config.defaultViewport
        });
    }
} 