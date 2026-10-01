const md5 = require('md5');

/*
* API sign verfy
* */
module.exports = (app) => {
    return async (ctx, next) => {
        // only for API
        if (ctx.path.indexOf('/api') < 0) {
            return await next();
        }

        const {path, method} = ctx;
        const {headers} = ctx.request;

        // Node lowercases header names; sSign/st land in headers as ssign/st
        const {ssign, s_sign, st: stTs, s_t} = headers;
        const sSign = ssign || s_sign;
        const st = stTs || s_t;

        const signKey = 'lumfall';
        const signature = md5(`${signKey}_${st}`);
        app.logger.info(`[${method} ${path} signature ${signature}]`);

        if (!sSign || !st || signature !== sSign.toLowerCase() || Date.now() - st > 600000) {
            ctx.status = 200;
            ctx.body = {
                success: false,
                message: 'Sign verification failed',
                code: 445
            }
            return;
        }
        await next()
    }
}