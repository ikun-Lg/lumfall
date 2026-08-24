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
  const signKey = "sunset";
  const st = Date.now();

  const axiosConfigs = {
    url,
    method,
    params: query,
    data,
    responseType,
    timeout,
    headers: {
      ...headers,
      s_t: st,
      s_sign: md5(`${signKey}_${st}`),
    },
  };

  return Axios.request(axiosConfigs)
    .then((res) => {
      const resData = res.data || {};
      const { success, code, message = ""} = resData;
      if (!success) {
        switch (code) {
          case 442:
            Message.error("Invalid request parameters");
            break;
          case 445:
            Message.error("Invalid request");
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
