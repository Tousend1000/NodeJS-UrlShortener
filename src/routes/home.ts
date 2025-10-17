import { Request, Response, Router } from "express";

import { addClick, getShortenedLinkByAlias } from "../services/dbService";

const router: Router = Router();

router.get('/', async (req: Request, res: Response): Promise<void> => {
    // TODO: Add dashboard to create link
});

router.get('/track/:code', async (req: Request, res: Response): Promise<void> => {
    // TODO: Add tracking dashboard logic
});

router.get('/:alias', async (req: Request, res: Response): Promise<void> => {
    const alias = req.params.alias;

    const shortenedLink = await getShortenedLinkByAlias(alias);

    if (!shortenedLink) {
        res.redirect('/');
        return;
    }

    await addClick(alias);
    
    res.redirect(shortenedLink.redirectUrl);
});

export {router};