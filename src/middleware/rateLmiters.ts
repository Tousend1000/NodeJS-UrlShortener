import rateLimit from "express-rate-limit";

export const shortenLinkRateLimit = rateLimit({
    windowMs: 60 * 1000,
    max: 3,
    message: { success: false, error: "Shortening too many links, please slow down." },
});