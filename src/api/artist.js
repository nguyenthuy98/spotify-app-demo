import { request } from "./base";

const artist = {
    artist_get(id, options) {
        return request("get", `/artists/${id}`, {}, options);
    }
}