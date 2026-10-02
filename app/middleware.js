const path = require("path");

module.exports = (app) => {
    // static files
    const koaStatic = require("koa-static");
    app.use(koaStatic(path.join(app.businessPath, "public")));

    // template render engine
    const koaNunjucks = require("koa-nunjucks-2");
    app.use(
        koaNunjucks({
            ext: "tpl",
            path: path.join(app.businessPath, "public"),
            nunjucksConfig: {
                // local 保持无缓存：dev 构建会把模板反复写盘，需要每次重读；
                // beta/prod 的模板只在构建期变化，启用编译缓存避免每请求重读（issue #46）
                noCache: app.env?.get?.() !== "prod",
                trimBlocks: true,
            },
        }),
    );

    const bodyParser = require("koa-bodyparser");
    app.use(
        bodyParser({
            formLimit: "1000mb",
            enableTypes: ["json", "form", "text"],
        }),
    );

    app.use(app.middlewares.errorHandler)

    // monitoring sits inside errorHandler so thrown errors reach it before errorHandler renders the response
    app.use(app.middlewares.monitoring)

    app.use(app.middlewares.apiParamsVerify)

    app.use(app.middlewares.securityPolicy)
};
