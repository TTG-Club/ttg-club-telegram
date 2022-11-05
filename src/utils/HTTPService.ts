import type { AxiosInstance, AxiosResponse } from 'axios';
import axios from 'axios';

export default class HTTPService {
  private readonly axios: AxiosInstance = axios.create({
    baseURL: `${ process.env.BASE_URL }/api/fvtt/v1`
  });

  public async get(url: string, params: any) {
    try {
      const resp = await this.axios({
        url,
        params: new URLSearchParams(params),
        method: 'get'
      });

      return Promise.resolve(this.parseResponse(resp));
    } catch (err) {
      console.error(err);

      return Promise.reject();
    }
  }

  private parseResponse = (response: AxiosResponse) => response.data;
}
