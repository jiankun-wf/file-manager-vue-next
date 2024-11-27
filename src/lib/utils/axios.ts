import Axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { createDiscreteApi } from "naive-ui";
import { uid } from "./uid";

const { message: Message } = createDiscreteApi(["message"]);

export type AxiosRequest = AxiosInstance & {
  $request: <T = any>(config: AxiosRequestConfig) => Promise<T>;
};

export function createAxios(baseUrl: string): AxiosRequest {
  const http = Axios.create({
    baseURL: baseUrl,
  }) as AxiosRequest;

  http.interceptors.response.use(
    (res) => {
      const { data: response } = res;

      if (Object.prototype.toString.call(response) === "[object Blob]") {
        const name =
          res.headers["content-disposition"]?.split("filename=")?.[1] ||
          `${uid("file_")}`;

        const x = {
          blob: response,
          name: decodeURIComponent(name),
        };

        return x;
      }

      if (Object.prototype.toString.call(response) !== "[object Object]") {
        return response;
      }
      const { code, data, message } = response;

      if (code !== "200") {
        const m = `${res.config.url} Error：${message || "接口错误"}`;
        Message.error(m?.toString());
        throw new Error(m);
      }
      return data;
    },
    (err) => {
      const { config, response, code, message } = err;

      Message.error(
        `${config.url} Error：${response?.status || ""}（${code}）：${message}`
      );
      throw new Error(err);
    }
  );

  http.interceptors.request.use((config) => {
    // config.headers["Wi-Font-Authenticate"] =
    //   "37f46233-b8a8-4e4c-9d4d-418aea78e1cc";
    if (
      config.headers["Content-Type"] === "multipart/form-data" &&
      config.data
    ) {
      const formData = new FormData();
      for (const key in config.data) {
        formData.append(key, config.data[key]);
      }
    }
    return config;
  });

  http.$request = <T = any>(config: AxiosRequestConfig) => {
    return http.request<T>(config) as T;
  };

  return http as AxiosRequest;
}
