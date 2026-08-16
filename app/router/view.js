module.exports = (app, router) => {
  const { view: ViewController } = app.controllers;

  router.get("/view/:page", ViewController.renderPage.bind(ViewController));
};
