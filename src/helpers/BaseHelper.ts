export default class BaseHelper {
    static isDevelop(): boolean {
        return !!process.env.DEV_MODE && process.env.DEV_MODE === 'true'
    }
}
