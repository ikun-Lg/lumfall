const Ajv = require("ajv")
const ajv = new Ajv()

module.exports = (app) => {
    // compiled validators are cached per path+method+part, schemas are static after startup
    const validatorCache = new Map();

    const getValidator = (part, path, method, schema) => {
        const key = `${method} ${path} ${part}`;
        let validate = validatorCache.get(key);
        if (!validate) {
            validate = ajv.compile(schema);
            validatorCache.set(key, validate);
        }
        return validate;
    };

    return async (ctx, next) => {
        // just for api
        if (ctx.path.indexOf('/api') < 0) {
            return await next();
        }

        const {body, query, headers} = ctx.request;
        const {params, path, method} = ctx;

        app.logger.info(`[${method} ${path}] body: ${JSON.stringify(body)}`);
        app.logger.info(`[${method} ${path}] query: ${JSON.stringify(query)}`);
        app.logger.info(`[${method} ${path}] headers: ${JSON.stringify(headers)}`);
        app.logger.info(`[${method} ${path}] params: ${JSON.stringify(params)}`);

        const schema = app.routerSchema[path]?.[method.toLowerCase()]

        if (!schema) {
            return await next();
        }

        let valid = true;

        // ajv validate
        let validate;

        // validate headers
        if (valid && headers && schema.headers) {
            validate = getValidator("headers", path, method, schema.headers);
            valid = validate(headers);
        }

        // validate body
        if (valid && body && schema.body) {
            validate = getValidator("body", path, method, schema.body);
            valid = validate(body)
        }

        // validate query
        if (valid && query && schema.query) {
            validate = getValidator("query", path, method, schema.query);
            valid = validate(query);
        }

        // validate params
        if (valid && params && schema.params) {
            validate = getValidator("params", path, method, schema.params);
            valid = validate(params);
        }

        if (!valid) {
            ctx.status = 200;
            ctx.body = {
                success: false,
                message: `request validate fail: ${ajv.errorsText(validate.errors)}`,
                code: 442
            }
            return
        }

        await next();
    }
}
