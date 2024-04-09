# Lune Tauri
this template uses the [electron-lune-bindings](https://www.npmjs.com/package/electron-lune-bindings) package to connect lune to javascript

---
# CREATE-LUAU-APP
project generator: https://github.com/HighFlowey/create-luau-app

---
# Setup
Install all the dependencies with a node package manager like pnpm or yarn, for both the main directory and the tauri directory

`yarn install` `pnpm install` `npm install`

`cd tauri && yarn install && cd ..` `cd tauri && npm install && cd ..`

And finally run `aftman install` to install the tools that will be used in the build process.

---
# Scripts
Use the `dev` script to run the app in dev mod, in dev mode app will reload when a luau file changes in the project

Use the `build` script to make a windows installer

## Examples
```shell
$ yarn run dev
```
```shell
$ pnpm run dev
```

---
# Creating packages
Create an empty project with yarn or npm, then add [npmluau](https://github.com/seaofvoices/npmluau/) and [luau-electron-bindings](https://github.com/HighFlowey/luau-electron-bindings) to package.json's dependencies

Using `require("@pkg/luau-electron-bindings").app` you can now create elements in your new project, to see the elements you have to add your new project as a dependency to your lune-electron project ofcourse.
