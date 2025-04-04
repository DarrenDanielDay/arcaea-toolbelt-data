# Arcaea Toolbelt-Data

[Arcaea-Toolbelt](https://darrendanielday.github.io/arcaea-toolbelt/) 的相关数据

## For developers

```sh
# install dependencies & start dev mode
npm install
npm run start
```

Open <http://localhost:1236/dist-tools> for data tools.

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
