import rateLimit from "express-rate-limit";

export const editRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 15,
    message: { success: false, error: "Too many edit requests, please slow down." },
});

export const createRateLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 5,
    message: { success: false, error: "Too many task creations, please slow down." },
});