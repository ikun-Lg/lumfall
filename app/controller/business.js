module.exports = (app) => {
  const BaseController = require("./base")(app);
  return class BusinessController extends BaseController {
    async getBusinessList(ctx) {
      const { page, pageSize } = ctx.request.query;

      const { business: businessService } = app.services;
      const { data, total } = businessService.getBusinessList({
        page: Number(page) || 1,
        size: Number(pageSize) || 50,
      });

      await this.success(ctx, data, { total });
    }

    async getBusiness(ctx) {
      const { productId } = ctx.request.query;
      const { business: businessService } = app.services;
      const product = businessService.getBusiness({ productId });

      if (!product) {
        await this.fail(ctx, "获取失败，未找到对应商品", 50000);
        return;
      }

      await this.success(ctx, product);
    }

    async createBusiness(ctx) {
      const { business: businessService } = app.services;
      const product = businessService.createBusiness(ctx.request.body);

      await this.success(ctx, product);
    }

    async updateBusiness(ctx) {
      const { business: businessService } = app.services;
      const product = businessService.updateBusiness(ctx.request.body);

      if (!product) {
        await this.fail(ctx, "更新失败，未找到对应商品", 50000);
        return;
      }

      await this.success(ctx, product);
    }

    async deleteBusinessList(ctx) {
      const { productId } = ctx.request.body;

      const { business: businessService } = app.services;
      const result = businessService.deleteBusinessList({ productId });

      if (!result) {
        this.fail(ctx, "删除失败，未找到对应数据", 50000);
        return;
      }

      await this.success(ctx, null);
    }

    async getProductEnumList(ctx) {
      const { business: businessService } = app.services;
      const enumList = businessService.getProductEnumList();

      await this.success(ctx, enumList);
    }
  };
};
