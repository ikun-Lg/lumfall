import { Message } from "@arco-design/web-vue";
import Axios from "axios";
import md5 from "md5";

const curl = async ({
  url,
  method = "post",
  headers = {},
  query = {},
  timeout = 60000,
  data = {},
  responseType = "json",
  errorMessage = "Network Error",
}) => {
  const signKey = "lumfall";
  const st = Date.now();

  const dtoHeaders = {
    ...headers,
    s_t: st,
    s_sign: md5(`${signKey}_${st}`),
  };

  // 项目列表页等无当前项目的场景 projectKey 为空，此时不能下发空的 project_key header
  const projectKey = window.__LUMFALL__?.projectKey;

  if (projectKey && url.indexOf("/api/project/") > -1) {
    dtoHeaders.project_key = projectKey;
  }

  const axiosConfigs = {
    url,
    method,
    params: query,
    data,
    responseType,
    timeout,
    headers: dtoHeaders,
  };

  return Axios.request(axiosConfigs)
    .then((res) => {
      const resData = res.data || {};
      const { success, code, message = "" } = resData;
      if (!success) {
        switch (code) {
          case 442:
            Message.error("Invalid request parameters");
            break;
          case 445:
            Message.error("Invalid request");
            break;
          case 446:
            Message.error("Required parameter is missing");
            break;
          case 50000:
            Message.error(message);
            break;
          default:
            Message.error(errorMessage);
        }

        console.error("[Axios]:" + (message || errorMessage));

        return Promise.resolve(resData);
      }
      return Promise.resolve(resData);
    })
    .catch((err) => {
      const { message } = err;

      if (message.match(/timeout/)) {
        return Promise.resolve({
          message: "Request Timeout",
          code: 504,
        });
      }

      return Promise.resolve(err);
    });
};

export default curl;
