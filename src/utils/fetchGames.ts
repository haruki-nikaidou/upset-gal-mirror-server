import {FetchedGameItemList, QueriedFolder, QueryGameItem, QueryGameItems, StoredGameItem} from "./gameItem";
import axios, {AxiosResponse} from "axios";

export async function fetchGames(url: string): Promise<Map<string, StoredGameItem>> {
    let res: AxiosResponse<FetchedGameItemList>
    try {
        res = await axios(
            {
                method: 'get',
                url: url,
                responseType: 'json'
            }
        )
    } catch (e) {
        console.error('Error while fetching games: ' + e);
        throw e;
    }
    const fetchedGameItemList: FetchedGameItemList = res.data;
    const storedGameItemList: Map<string, StoredGameItem> = new Map<string, StoredGameItem>();
    const promises: Promise<void>[] = [];

    for (const fetchedGameItem of fetchedGameItemList) {
        promises.push((async () => {
            const { name, size, date, "@type": type } = fetchedGameItem;

            const baseUri = url.endsWith('/') ? url : `${url}/`;
            const fullUrl = baseUri + name;

            let storedGameItem: Partial<StoredGameItem> = {
                name,
                size,
                date,
            };

            if (type === 'folder') {
                console.log('fetch:' + fullUrl);
                storedGameItem.subItems = await fetchGames(fullUrl);
            } else {
                storedGameItem.downloadUrl = await getRedirectURL(fullUrl);
            }

            storedGameItem["@type"] = type as 'file' | 'folder';

            storedGameItemList.set(name, storedGameItem as StoredGameItem);
        })());
    }

// Await all the promises to complete
    await Promise.all(promises);
    return storedGameItemList;
}

async function getRedirectURL(url: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
        axios({
            method: 'head',
            url: url,
            maxRedirects: 0
        }).then(res => {
            reject(res.headers.location);
        }).catch(err => {
            if (err.response && (err.response.status === 302 || err.response.status === 301)) {
                resolve(err.response.headers.location);
                return;
            }
            console.error('Error while getting redirect URL: ' + err);
            reject(err);
        })
    });
}

export function flatten(stored: Map<string, StoredGameItem>, basePath: string): Map<string, QueriedFolder | string> {
    if (!basePath.endsWith('/')) {
        basePath += '/';
    }
    const map = new Map<string, QueriedFolder | string>();
    const thisFolder: QueriedFolder = [];
    for (const [, value] of stored.entries()) {
        thisFolder.push({
            name: value.name,
            size: value.size,
            date: value.date,
            "@type": value["@type"]
        })
        if (value["@type"] === 'folder') {
            const newMap = flatten(
                value.subItems as Map<string, StoredGameItem>,
                basePath + value.name + '/'
            );
            newMap.forEach((value: QueriedFolder | string, key: string) => {
                map.set(key, value);
            });
        } else {
            map.set(basePath + value.name, value.downloadUrl as string);
        }
    }
    const basePathWithoutSlash = basePath.substring(0, basePath.length - 1);
    map.set(basePathWithoutSlash, thisFolder);
    return map;
}

export function stringifyMap(map: Map<string, QueriedFolder | string>): QueryGameItems {
    const queryGameItems: QueryGameItems = new Map<string, QueryGameItem>();
    for (const [key, value] of map.entries()) {
        if (typeof value === 'string') {
            queryGameItems.set(key, {
                isList: false,
                downloadUrl: value
            });
        } else {
            queryGameItems.set(key, {
                isList: true,
                Json: JSON.stringify(value)
            });
        }
    }
    return queryGameItems;
}