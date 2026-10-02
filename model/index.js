const glob = require("glob");
const path = require("path");
const { sep } = path;
const _ = require("lodash");

const projectExtendModel = (model, project) => {
  return _.mergeWith({}, model, project, (modelValue, projectValue) => {
    if (_.isArray(modelValue) && _.isArray(projectValue)) {
      let result = [];

      // update or remain
      for (let i = 0; i < modelValue.length; i++) {
        let modelItem = modelValue[i];
        let projectItem = projectValue.find(
          (projectItem) => projectItem.key === modelItem.key,
        );
        result.push(
          projectItem ? projectExtendModel(modelItem, projectItem) : modelItem,
        );
      }

      // add new
      for (let i = 0; i < projectValue.length; i++) {
        let projectItem = projectValue[i];
        let modelItem = modelValue.find(
          (modelItem) => modelItem.key === projectItem.key,
        );
        if (!modelItem) result.push(projectItem);
      }

      return result;
    }
  });
};

/**
 * 从归一化（/ 分隔）的模型文件路径解析扫描条目。
 * glob 的分隔符与平台/版本相关，统一归一化后再匹配，Windows 兼容（issue #45）。
 * 导出为可测试的纯函数。
 */
const parseModelPath = (normalizedPath) => {
  if (normalizedPath.indexOf("/project/") > -1) {
    return {
      type: "project",
      modelKey: normalizedPath.match(/\/model\/(.*?)\/project/)?.[1],
      projectKey: normalizedPath.match(/\/project\/(.*?)\.js/)?.[1],
    };
  }
  return {
    type: "model",
    modelKey: normalizedPath.match(/\/model\/(.*?)\/model\.js/)?.[1],
  };
};

module.exports = (app) => {
  const modelList = [];

  const modelPath = path.resolve(process.cwd(), `.${sep}model`);
  const fileList = glob.sync(path.resolve(modelPath, `.${sep}**${sep}**.js`));
  fileList.forEach((rawFile) => {
    // 只按文件名跳过扫描器自身的 index.js；旧写法「路径里含 index.js 就跳过」
    // 会误伤目录名恰好含 index.js 的正常模型文件
    if (path.basename(rawFile) === "index.js") return;

    const file = rawFile.split(path.sep).join("/");
    const entry = parseModelPath(file);
    const { type, modelKey } = entry;

    if (type === "project") {
      const projectKey = entry.projectKey;
      let modelItem = modelList.find((item) => item.model?.key === modelKey);
      if (!modelItem) {
        modelItem = {};
        modelList.push(modelItem);
      }
      if (!modelItem.project) {
        modelItem.project = {};
      }
      modelItem.project[projectKey] = require(path.resolve(rawFile));
      modelItem.project[projectKey].key = projectKey;
      modelItem.project[projectKey].modelKey = modelKey;
    }

    if (type === "model") {
      let modelItem = modelList.find((item) => item.model?.key === modelKey);
      if (!modelItem) {
        modelItem = {};
        modelList.push(modelItem);
      }
      modelItem.model = require(path.resolve(rawFile));
      modelItem.model.key = modelKey;
    }
  });

  modelList.forEach((item) => {
    const { model, project } = item;
    for (const key in project) {
      project[key] = projectExtendModel(model, project[key]);
    }
  });

  return modelList;
};

module.exports.parseModelPath = parseModelPath;

