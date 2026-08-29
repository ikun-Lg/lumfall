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
        let projectItem = projectValue.find(projectItem => projectItem.key === modelItem.key)
        result.push(projectItem ? projectExtendModel(modelItem, projectItem) : modelItem)
      }

      // add new
      for (let i = 0; i < projectValue.length; i++) {
        let projectItem = projectValue[i];
        let modelItem = modelValue.find(modelItem => modelItem.key === projectItem.key)
        if (!modelItem) result.push(projectItem)
      }

      return result
    }
  });
};

module.exports = (app) => {
  const modelList = [];

  const modelPath = path.resolve(app.baseDir, `.${sep}model`);
  const fileList = glob.sync(path.resolve(modelPath, `.${sep}**${sep}**.js`));
  fileList.forEach((file) => {
    if (file.indexOf("index.js") > -1) return;

    const type = file.indexOf(`${sep}project${sep}`) > -1 ? "project" : "model";

    if (type === "project") {
      const modelKey = file.match(/\/model\/(.*?)\/project/)?.[1];
      const projectKey = file.match(/\/project\/(.*?)\.js/)?.[1];
      let modelItem = modelList.find((item) => item.model?.key === modelKey);
      if (!modelItem) {
        modelItem = {};
        modelList.push(modelItem);
      }
      if (!modelItem.project) {
        modelItem.project = {};
      }
      modelItem.project[projectKey] = require(path.resolve(file));
      modelItem.project[projectKey].key = projectKey;
    }

    if (type === "model") {
      const modelKey = file.match(/\/model\/(.*?)\/model\.js/)?.[1];
      let modelItem = modelList.find((item) => item.model?.key === modelKey);
      if (!modelItem) {
        modelItem = {};
        modelList.push(modelItem);
      }
      modelItem.model = require(path.resolve(file));
      modelItem.model.key = modelKey;
    }
  });

  modelList.forEach(item => {
    const { model, project } = item
    for (const key in project) {
      project[key] = projectExtendModel(model, project[key])
    }
  })

  return modelList;
};
