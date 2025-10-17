import { Request, Response, Router } from "express";

import { ShortenedLink } from "../../models/shortenedLink";
import { saveShortenedLink } from "../../services/dbService";

const router: Router = Router();

router.post('/shorten', async (req: Request, res: Response): Promise<void> => {
    const data = req.body as Partial<ShortenedLink>;

    if (!['alias', 'redirectUrl'].every(key => key in data)) {
        res.status(400).json({ success: false, error: 'Missing data.' });
        return;
    }

    const shortenedLink: ShortenedLink = {
        alias: data.alias!,
        redirectUrl: data.redirectUrl!
    };

    try {
        new URL(shortenedLink.redirectUrl);
    } catch (error) {
        res.status(400).json({ success: false, error: 'Invalid redirect URL format.'});
        return;
    }

    let trackingCode: string;
    try {
        trackingCode = await saveShortenedLink(shortenedLink);
    } catch (error) {
        res.status(400).json({ success: false, error: 'A shortened link with the current alias already exists.' })
        return;
    }

    res.status(200).json({ success: true, trackingCode: trackingCode });
});

export {router};