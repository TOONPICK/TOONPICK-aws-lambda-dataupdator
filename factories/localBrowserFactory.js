import puppeteer from 'puppeteer';
import { BrowserFactory, DEFAULT_VIEWPORT } from './browserFactory.js';

export class LocalBrowserFactory extends BrowserFactory {
    async createBrowser() {
        return puppeteer.launch({
            defaultViewport: DEFAULT_VIEWPORT,
            headless: "new"
        });
    }
} 