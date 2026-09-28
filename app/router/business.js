module.exports = (app, router) => {
  const { business: businessController } = app.controllers;

  router.get(
    "/api/project/product/list",
    businessController.getBusinessList.bind(businessController),
  );

  router.get(
    "/api/project/product",
    businessController.getBusiness.bind(businessController),
  );

  router.get(
    "/api/project/productEnum/list",
    businessController.getProductEnumList.bind(businessController),
  );

  router.post(
    "/api/project/product",
    businessController.createBusiness.bind(businessController),
  );

  router.put(
    "/api/project/product",
    businessController.updateBusiness.bind(businessController),
  );

  router.delete(
    "/api/project/product",
    businessController.deleteBusinessList.bind(businessController),
  );
};
