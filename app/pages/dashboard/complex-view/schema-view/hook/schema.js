import { useMenuStore } from "$store/menu.js";
import { nextTick, onMounted, ref, watch } from "vue";
import { useRoute } from "vue-router";

export const useSchema = function () {
  const route = useRoute();
  const menuStore = useMenuStore();

  const api = ref("");
  const tableSchema = ref({});
  const tableConfig = ref({});
  const searchSchema = ref({});
  const searchConfig = ref({});

  const buildData = function () {
    const { key, siderKey } = route.query;

    const mItem = menuStore.findMenuItem({
      key: "key",
      value: siderKey ?? key,
    });

    if (mItem && mItem.schemaConfig) {
      const { schemaConfig } = mItem;

      const configSchema = JSON.parse(JSON.stringify(schemaConfig.schema));

      api.value = schemaConfig.api ?? "";
      tableSchema.value = {};
      tableConfig.value = undefined;
      searchSchema.value = {};
      searchConfig.value = undefined;
      nextTick(() => {
        tableSchema.value = buildDtoSchema(configSchema, "table");
        tableConfig.value = schemaConfig.tableConfig ?? {};

        const dtoSearchSchema = buildDtoSchema(configSchema, "search");
        for (const key in dtoSearchSchema.properties) {
          if (route.query[key] !== undefined) {
            dtoSearchSchema.properties[key].option.default = route.query[key];
          }
        }
        searchSchema.value = dtoSearchSchema;
        searchConfig.value = schemaConfig.searchConfig ?? {};
      });
    }
  };

  function buildDtoSchema(_schema, comName) {
    if (!_schema?.properties) {
      return {};
    }

    const dtoSchema = {
      type: "object",
      properties: {},
    };

    for (const key in _schema.properties) {
      const props = _schema.properties[key];
      if (props[`${comName}Option`]) {
        let dtoProps = {};
        for (const pKey in props) {
          if (pKey.indexOf("Option") < 0) {
            dtoProps[pKey] = props[pKey];
          }
        }
        dtoProps = Object.assign({}, dtoProps, {
          option: props[`${comName}Option`],
        });
        dtoSchema.properties[key] = dtoProps;
      }
    }

    return dtoSchema;
  }

  watch(
    [
      () => route.query.key,
      () => route.query.siderKey,
      () => menuStore.menuList,
    ],
    () => {
      buildData();
    },
    {
      deep: true,
    },
  );

  onMounted(() => {
    buildData();
  });

  return {
    api,
    tableSchema,
    tableConfig,
    searchSchema,
    searchConfig,
  };
};
