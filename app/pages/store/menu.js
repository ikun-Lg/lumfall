import { defineStore } from "pinia";
import { ref } from "vue";

export const useMenuStore = defineStore("menu", () => {
  const menuList = ref([]);

  const setMenuList = function (list) {
    menuList.value = list;
  };

  const findMenuItem = function ({ key, value }, mList = menuList.value) {
    for (let i = 0; i < mList.length; i++) {
      const menuItem = mList[i];
      if (!menuItem) continue;

      const { menuType, moduleType } = menuItem;

      if (menuItem[key] === value) {
        return menuItem;
      }

      if (menuType === "group" && menuItem.subMenu) {
        const mItem = findMenuItem({ key, value }, menuItem.subMenu);
        if (mItem) {
          return mItem;
        }
      }

      if (
        moduleType === "sider" &&
        menuItem.siderConfig &&
        menuItem.siderConfig.menu
      ) {
        const mItem = findMenuItem({ key, value }, menuItem.siderConfig.menu);
        if (mItem) {
          return mItem;
        }
      }
    }
  };

  const findFirstMenuItem = function (mList = menuList.value) {
    if (!mList || !mList[0]) {
      return null
    }
    let firstMenuItem = mList[0]
    if (firstMenuItem.subMenu && firstMenuItem.subMenu.length > 0) {
      firstMenuItem = findFirstMenuItem(firstMenuItem.subMenu)
    }
    return firstMenuItem
  };

  return { menuList, setMenuList, findMenuItem, findFirstMenuItem };
});
