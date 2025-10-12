import { Pool } from 'pg';

import { ShortenedLink } from '../models/shortenedLink';
import { randomUUID } from 'crypto';

const shortenedLinksCache: Map<string, Required<ShortenedLink>> = new Map();

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
                alias STRING PRIMARY KEY,
                redirect_url STRING,
                tracking_code STRING UNIQUE
            );
        `);
    } catch (err) {
        console.error("Database initialization failed:", err);
        throw err;
    }

    // Set up cache

    const results = (await pool.query(`SELECT alias, redirect_url, tracking_code FROM tasks;`)).rows;

    results.forEach(rawShortenedLink => {
        const shortenedLink: Required<ShortenedLink> = {
            alias: rawShortenedLink.alias,
            redirectUrl: rawShortenedLink.redirect_url,
            trackingCode: rawShortenedLink.tracking_code
        };

        shortenedLinksCache.set(shortenedLink.alias, shortenedLink);
    });
}

export async function getShortenedLinkByAlias(alias: string): Promise<Required<ShortenedLink>> {
    const shortenedLink = shortenedLinksCache.get(alias);

    if (!shortenedLink) {
        throw new Error(`No shortened link found with alias ${alias}`);
    }

    return shortenedLink;
}

export async function deleteShortenedLinkByAlias(alias: string): Promise<void> {
    const deleted = shortenedLinksCache.delete(alias);
    
    if (deleted) {
        // Only run query if the shortenedLink existed
        await pool.query('DELETE FROM shortened_links WHERE alias = $1;', [alias]);
    }
}

export async function saveShortenedLink(shortenedLink: ShortenedLink): Promise<string> {
    const currentShortenedLink = shortenedLinksCache.get(shortenedLink.alias);

    if (currentShortenedLink) {
        throw new Error('A shortened link already exists under this alias.');
    }
    
    const trackingCode = randomUUID().replace('-', '');
    shortenedLink.trackingCode = trackingCode;

    await pool.query(
        'INSERT INTO shortened_links(alias, redirect_url, tracking_code) VALUES ($1, $2, $3)',
        [shortenedLink.alias, shortenedLink.redirectUrl, shortenedLink.trackingCode]
    );

    shortenedLinksCache.set(shortenedLink.alias, shortenedLink as Required<ShortenedLink>);

    return trackingCode;
}