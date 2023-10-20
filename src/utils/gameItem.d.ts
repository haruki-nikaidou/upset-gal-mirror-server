export type FetchedGameItem = {
    name: string;
    size: string;
    date: string;
    "@type": string;
}

export type FetchedGameItemList = FetchedGameItem[];

export type StoredGameItem = {
    name: string;
    size: string;
    date: string;
    "@type": 'file' | 'folder';
    subItems?: Map<string,StoredGameItem>;
    downloadUrl?: string;
}

export type QueryGameItems = Map<string, QueryGameItem>

export type QueryGameItem = {
    isList: boolean;
    Json?: string;
    downloadUrl?: string;
}

export type QueriedFolder = {
    name: string;
    size: string;
    date: string;
    "@type": 'file' | 'folder';
}[];
