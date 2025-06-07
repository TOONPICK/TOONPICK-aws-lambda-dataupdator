import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { BrowserFactory, DEFAULT_VIEWPORT } from './browserFactory.js';

export class LambdaBrowserFactory extends BrowserFactory {
    async createBrowser() {
        return puppeteer.launch({
            args: chromium.args,
            defaultViewport: DEFAULT_VIEWPORT,
            executablePath: await chromium.executablePath(),
            headless: "shell",
            ignoreHTTPSErrors: true
        });
    }
} 