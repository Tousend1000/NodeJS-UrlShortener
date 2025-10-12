import { Request, Response, Router } from "express";

const router: Router = Router();

router.get('/', async (req: Request, res: Response) => {
    // TODO: Add dashboard to create link
});

router.get('/track/:code', async (req: Request, res: Response) => {
    // TODO: Add tracking dashboard logic
});

router.get('/:code', async (req: Request, res: Response) => {
    // TODO: Add redirect and tracking logic
});

export {router};