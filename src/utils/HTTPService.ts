import axios, { AxiosInstance, AxiosResponse } from 'axios';

export default class HTTPService {
    private axios: AxiosInstance = axios.create({
        baseURL: `${process.env.SITE_URL}/api/v1`
    });

    public async post(url: string, options: any) {
        try {
            const resp = await this.axios.post(url, options);

            return this.parseResponse(resp);
        } catch (err) {
            throw new Error(err);
        }
    }

    private parseResponse = (response: AxiosResponse) => response.data
}
