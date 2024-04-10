import * as child_process from "child_process";
import config from './lune.config.json' assert { type: 'json' };
import { exit, exitCode } from "process";
import * as fs from "fs";
import path from "path";

let bundlingProcess = child_process.spawnSync("darklua", ["process", "src/init.luau", "dist/bundled.luau"], {
    stdio: "inherit"
})

if (bundlingProcess.error) {
    console.error('Error occurred:', bundlingProcess.error);
    console.error('Try installing darklua on your system if you havent already.')
    exit(exitCode)
} else if (bundlingProcess.status !== 0) {
    console.error('Command exited with non-zero status:', bundlingProcess.status);
    exit(exitCode)
}

console.log("Bundled luau codebase")

config["lune-binray-platform"].forEach(target => {
    let buildProcess = child_process.spawnSync("lune", ["build", "dist/bundled.luau", "-o", "tauri/src-tauri/bundled" + target], {
        stdio: "inherit"
    })

    if (buildProcess.error) {
        console.error('Error occurred:', buildProcess.error);
        console.error('Try installing lune on your system if you havent already.')
        exit(exitCode)
    } else if (buildProcess.status !== 0) {
        console.error('Command exited with non-zero status:', buildProcess.status);
        exit(exitCode)
    }
})

console.log("Built lune binary")

fs.copyFileSync('.luaurc', "tauri/src-tauri/.luaurc")

console.log("Copied .luaurc")

if (!fs.existsSync('tauri/src-tauri/node_modules/')) {
    fs.mkdirSync('tauri/src-tauri/node_modules/')
}

fs.cpSync('node_modules/.luau-aliases', 'tauri/src-tauri/node_modules/.luau-aliases', { recursive: true })

fs.readdirSync('node_modules/.luau-aliases').forEach((file) => {
    let module = path.parse(file).name
    let dir = 'node_modules/' + module

    if (fs.lstatSync(dir).isSymbolicLink()) {
        dir = fs.realpathSync(dir);
    }

    fs.cpSync(dir, 'tauri/src-tauri/node_modules/' + module, { recursive: true })
    console.log('Copied', module)
})
