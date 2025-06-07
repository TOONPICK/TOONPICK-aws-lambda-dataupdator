import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { BrowserType } from './browserTypes.js';

export class LambdaBrowserType extends BrowserType {
    async launch(config) {
        return puppeteer.launch({
            args: chromium.args,
            defaultViewport: config.defaultViewport,
            executablePath: await chromium.executablePath(),
            headless: "shell",
            ignoreHTTPSErrors: true
        });
    }
} 