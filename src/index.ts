import express from 'express';
import {cloneList} from "./utils/tasks";
import {QueryGameItem, QueryGameItems} from "./utils/gameItem";

const app = express();
const PORT = 3000;

let clonedDatabase: QueryGameItems = new Map();

const MIRROR_CLOCK = 20 * 60 * 1000; // 20 minutes

app.get('/shinnku/:key', (req, res) => {
    const key = req.params.key;

    // Fetch the item from the database
    const item: QueryGameItem | undefined = clonedDatabase.get(key);

    if (!item) {
        // Key not found in the database
        return res.status(404).send({ error: "Key not found" });
    }

    if (item.isList) {
        // Return the JSON if isList is true
        if (item.Json) {
            return res.json(JSON.parse(item.Json));
        } else {
            return res.status(500).send({ error: "Data inconsistency: isList is true but JSON is missing" });
        }
    } else {
        // Redirect to the downloadUrl if isList is false
        if (item.downloadUrl) {
            return res.redirect(item.downloadUrl);
        } else {
            return res.status(500).send({ error: "Data inconsistency: isList is false but downloadUrl is missing" });
        }
    }
});

app.listen(PORT, async () => {
    console.log(`Server is running at http://localhost:${PORT}`);
    clonedDatabase = await cloneList();
    setInterval(async () => {
        clonedDatabase = await cloneList();
    }, MIRROR_CLOCK);
});
