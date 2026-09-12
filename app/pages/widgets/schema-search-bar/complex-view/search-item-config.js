import Input from "./input/input.vue";
import Select from "./select/select.vue";
import dynamicSelect from "./dynamic-select/dynamic-select.vue";
import dateRange from "./date-range/date-range.vue";

const SearchItemConfig = {
  input: {
    component: Input,
  },
  select: {
    component: Select,
  },
  dynamicSelect: {
    component: dynamicSelect,
  },
  dateRange: {
    component: dateRange,
  },
};

export default SearchItemConfig;
