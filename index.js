// index.js
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { DEFAULT_VIEWPORT, crawlWebtoonTitle } from './crawler.js';
import { parseWebtoonCrawlRequest } from './types.js';

export async function handler(event) {
    // SQS 이벤트에서 첫 번째 레코드를 처리
    if (!event.Records || !event.Records[0]) {
        throw new Error('SQS 메시지가 없습니다.');
    }

    const request = parseWebtoonCrawlRequest(event.Records[0]);

    const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: DEFAULT_VIEWPORT,
        executablePath: await chromium.executablePath(),
        headless: "shell",
        ignoreHTTPSErrors: true
    });

    try {
        const title = await crawlWebtoonTitle(browser, request.titleId);
        return {
            statusCode: 200,
            body: JSON.stringify({
                requestId: request.requestId,
                titleId: request.titleId,
                title,
            }),
        };
    } catch (error) {
        console.error('크롤링 실패:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                requestId: request.requestId,
                error: error.message,
            }),
        };
    } finally {
        await browser.close();
    }
}
