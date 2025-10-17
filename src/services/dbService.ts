import { Pool } from 'pg';

import { ShortenedLink } from '../models/shortenedLink';
import { randomUUID } from 'crypto';

import { getCurrent5MinInterval } from '../utils/timeUtils';

const shortenedLinksCache: Map<string, Required<ShortenedLink>> = new Map();

const clickCache: Map<string, number> = new Map();
let lastClickInterval: Date = new Date(0);

export const pool = new Pool({
    user: 'appuser',
    host: 'localhost',
    database: 'appdb',
    password: process.env.POSTGRES_PASSWORD,
    port: 5432,
});

export async function initDb(): Promise<void> {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS shortened_links (
                alias TEXT PRIMARY KEY,
                redirect_url TEXT,
                tracking_code TEXT UNIQUE
            );
        `);

        await pool.query(`
            CREATE TABLE IF NOT EXISTS clicks (
                alias TEXT NOT NULL,
                interval_start TIMESTAMP NOT NULL,
                amount INTEGER DEFAULT 0
            )
        `);
    } catch (err) {
        console.error("Database initialization failed:", err);
        throw err;
    }

    // Set up cache

    const results = (await pool.query(`SELECT alias, redirect_url, tracking_code FROM shortened_links;`)).rows;

    results.forEach(rawShortenedLink => {
        const shortenedLink: Required<ShortenedLink> = {
            alias: rawShortenedLink.alias,
            redirectUrl: rawShortenedLink.redirect_url,
            trackingCode: rawShortenedLink.tracking_code
        };

        shortenedLinksCache.set(shortenedLink.alias, shortenedLink);
    });
}

export async function getShortenedLinkByAlias(alias: string): Promise<Required<ShortenedLink> | null> {
    const shortenedLink = shortenedLinksCache.get(alias);

    if (!shortenedLink) {
        return null;
    }

    return shortenedLink;
}

export async function deleteShortenedLinkByAlias(alias: string): Promise<void> {
    const deleted = shortenedLinksCache.delete(alias);
    
    if (deleted) {
        // Only run query if the shortenedLink existed
        await pool.query(`
            DELETE FROM shortened_links 
            WHERE alias = $1
        `, [alias]);
    }
}

export async function saveShortenedLink(shortenedLink: ShortenedLink): Promise<string> {
    const currentShortenedLink = shortenedLinksCache.get(shortenedLink.alias);

    if (currentShortenedLink) {
        throw new Error('A shortened link already exists under this alias.');
    }
    
    const trackingCode = randomUUID().replace(/-/g, '');
    shortenedLink.trackingCode = trackingCode;

    await pool.query(`
        INSERT INTO shortened_links(alias, redirect_url, tracking_code)
        VALUES ($1, $2, $3)
    `, [shortenedLink.alias, shortenedLink.redirectUrl, shortenedLink.trackingCode]);

    shortenedLinksCache.set(shortenedLink.alias, shortenedLink as Required<ShortenedLink>);

    return trackingCode;
}

function checkClicksCache(): void {
    const currentInterval = getCurrent5MinInterval();

    if (lastClickInterval !== currentInterval) {
        clickCache.clear();
        lastClickInterval = currentInterval;
    }
}

export async function addClick(alias: string): Promise<void> {
    checkClicksCache();
    
    const currentInterval = getCurrent5MinInterval();

    const result = await pool.query(`
        UPDATE clicks
        SET amount = amount + 1
        WHERE alias = $1 AND interval_start = $2
        RETURNING *
    `, [alias, currentInterval]);

    if (result.rowCount === 0) {
        await pool.query(`
            INSERT INTO clicks(alias, interval_start, amount) 
            VALUES ($1, $2, 1)
        `, [alias, currentInterval]);
    }

    clickCache.set(alias, clickCache.get(alias) || 0 + 1);
}

export async function getClicks(alias: string, time: '1h' | '12h' | '24h'): Promise<number[]> {
    const now = new Date();
    let totalMinutes: number;

    switch(time) {
        case '1h': totalMinutes = 60; break;
        case '12h': totalMinutes = 12 * 60; break;
        case '24h': totalMinutes = 24 * 60; break;
        default: totalMinutes = 60;
    }

    const intervalMinutes = totalMinutes / 12;
    const startTime = new Date(now.getTime() - totalMinutes * 60 * 1000);

    const result = await pool.query(`
        SELECT interval_start, amount FROM CLICKS
        WHERE alias = $1 AND interval_start >= $2
        ORDER BY interval_start ASC LIMIT $3
    `, [alias, startTime]);

    // Create an empty array with 12x 0 for 12 invervals
    const clicks: number[] = Array(12).fill(0);

    for (const row of result.rows) {
        const diffMinutes = (row.interval_start.getTime() - startTime.getTime()) / (60 * 1000);
        const bucketIndex = Math.min(Math.floor(diffMinutes / intervalMinutes), 11);
        clicks[bucketIndex] += row.clicks;
    }

    return clicks;
}