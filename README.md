# Arcaea Toolbelt-Data

[Arcaea-Toolbelt](https://darrendanielday.github.io/arcaea-toolbelt/) 的相关数据

## For developers

```sh
# install dependencies & start dev mode
npm install
npm run start
```

Open <http://localhost:1236/dist-tools> for data tools.

## Manually Maintained Files

- `./src/data/alias.json`
- `./src/data/characters.json`
- `./src/data/characters-patch.json`
- `./src/data/chart-express.json` (TODO)
- `./src/data/ChartConstant.json` (TODO)
- `./src/data/items.json`
- `./src/data/item-data.json`
- `./src/data/notes-and-constants.json`
- `./scripts/factors.csv`

## Generated Files

- `./src/data/assets-info.json`
- `./src/data/chart-data.json`
- `./src/data/ChartNotes.json`
- `./src/data/constants.json`
- `./src/data/factors.json`
- `./src/data/meta.json`
- `./src/data/notes.json`
- `./src/data/packlist.json`
- `./src/data/song-data.json`
- `./src/data/songlist.json`
- `./src/data/world-maps-events.json`
- `./src/data/world-maps-longterm.json`

## Update steps

1. download apk & generate meta
2. extract apk
3. restart to generate songlist/packlist
4. generate assets info
5. update notes and constants
6. generate merged chart data
7. get characters (if new)
8. get world map (if new)
9. restart to generate meta

## Update Scripts

1. auto-apk
2. update `ChartConstant.json`, `notes-and-constants.json` and `chart-express.json`
3. auto-update-chart-data

## New Character

1. add info or copy all into `characters.json`
2. execute `merge-characters.js`

## License

MIT License
