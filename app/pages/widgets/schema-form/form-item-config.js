import input from "./complex-view/input/input.vue";
import inputNumber from "./complex-view/input-number/input-number.vue";
import select from "./complex-view/select/select.vue";

const FormItemConfig = {
  input:{
    component: input,
  },
  inputNumber: {
    component: inputNumber,
  },
  select: {
    component: select,
  }
};

export default FormItemConfig