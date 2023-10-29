import axios from 'axios';

import { useConfig } from './useConfig.js';

import type { AxiosInstance, AxiosRequestConfig } from 'axios';

export type RequestConfig = {
  url: AxiosRequestConfig['url'];
  payload?: AxiosRequestConfig['params'] | AxiosRequestConfig['data'];
};

const { API_URL } = useConfig();

class HTTPService {
  protected instance: AxiosInstance;

  constructor() {
    axios.defaults.withCredentials = true;

    this.instance = axios.create({
      baseURL: `${API_URL || 'http://localhost:8080'}/api/v1`,
      withCredentials: true,
      headers: {}
    });
  }

  get<T>(config: RequestConfig) {
    return this.instance<T>({
      method: 'get',
      url: config.url,
      params: config.payload
    });
  }

  post<T>(config: RequestConfig) {
    return this.instance<T>({
      method: 'post',
      url: config.url,
      data: config.payload
    });
  }

  put<T>(config: RequestConfig) {
    return this.instance<T>({
      method: 'put',
      url: config.url,
      data: config.payload
    });
  }

  patch<T>(config: RequestConfig) {
    return this.instance<T>({
      method: 'patch',
      url: config.url,
      data: config.payload
    });
  }

  delete<T>(config: RequestConfig) {
    return this.instance<T>({
      method: 'delete',
      url: config.url,
      params: config.payload
    });
  }
}

export const useAxios = () => new HTTPService();
