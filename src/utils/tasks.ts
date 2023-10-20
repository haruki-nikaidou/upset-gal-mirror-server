import {fetchGames, flatten, stringifyMap} from "./fetchGames";
import {QueryGameItems} from "./gameItem";

const ShinnkuBaseUrl = 'https://shinnku.com/api/download/legacy/';

const ShinnkuTargets = [
    'win',
    'rpg',
    'krkr',
    'apk',
    'ons',
    'artroid',
    'simulate',
    'tools'
]

async function cloneOneList(baseUrl: string, target: string): Promise<QueryGameItems> {
    if (!baseUrl.endsWith('/')) {
        baseUrl += '/';
    }
    try {
        const fetched = await fetchGames(baseUrl + target);
        return stringifyMap(flatten(fetched, target))
    } catch (e) {
        console.error(e ? e: 'Unknown error');
        return new Map();
    }
}

export async function cloneList() {
    const all = await Promise.all(
        ShinnkuTargets.map(
            target => {
                console.log('Cloning ' + target + '...');
                return cloneOneList(ShinnkuBaseUrl, target);
            }
        )
    )
    console.log("Successfully cloned all lists!");
    const combined: QueryGameItems = new Map();
    for (const series of all) {
        for (const [key, value] of series.entries()) {
            combined.set(key, value);
        }
    }
    return combined;
}