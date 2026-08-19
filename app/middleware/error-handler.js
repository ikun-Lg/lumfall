/**
 * runtimeException handler
 * @param {*} app koa app
 */
module.exports = (app) => {
    return async (ctx, next) => {
        try {
            await next();
        } catch (e) {
            const {status, message, detail} = e;
            app.logger.info(JSON.stringify(e))
            app.logger.error('[-- Exception --}:', e);
            app.logger.error('[-- Exception --}:', status, message, detail);

            // can't find page
            if (message && message.indexOf('template not found') > -1) {
                // redirect
                ctx.status = 302;
                ctx.redirect(app?.options?.homePath || "/");
                return;
            }

            const resBody = {
                success: false,
                code: 5000,
                message: 'Internal Server Error',
            }

            ctx.status = 200;
            ctx.body = resBody;
        }
    }
};
