// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;
use tauri::api::process::Command;
use tauri::api::process::CommandChild;
use tauri::api::process::CommandEvent;
use tauri::AppHandle;
use tauri::State;
use tauri::{Manager, RunEvent};

use get_port::tcp::TcpPort;
use get_port::{Ops, Range};

#[derive(Default)]
struct Backend(Option<CommandChild>);

struct LuauServer {
    port: Mutex<Option<u16>>,
}

#[tauri::command]
fn get_luau_server_port(luau_server: State<LuauServer>) -> u16 {
    luau_server.port.lock().unwrap().unwrap()
}

fn process_lune_command(line: String, window: tauri::Window) {
    if line.trim().is_empty() {
        return;
    }

    if !line.starts_with('@') {
        println!("{:?}", line.trim());
    }

    window
        .emit("message", Some(format!("{}", line)))
        .expect("failed to emit event");
}

#[tauri::command]
fn run_lune(app_handle: AppHandle) {
    if !cfg!(debug_assertions) {
        return;
    }

    let luau_server = app_handle.state::<LuauServer>();
    let window = app_handle.get_window("main").unwrap();
    let port: u16 = luau_server.port.lock().unwrap().unwrap();

    tauri::async_runtime::spawn(async move {
        println!("{:?}", ["run", "../../src/init.luau", &port.to_string()]);
        let (mut rx, _child) = Command::new("lune")
            .args(["run", "../../src/init.luau", &port.to_string()])
            .spawn()
            .expect("Failed to run lune, install it on your system if you haven't already.");

        // read stdout
        while let Some(event) = rx.recv().await {
            if let CommandEvent::Stdout(line) = event {
                process_lune_command(line, window.clone());
            } else if let CommandEvent::Stderr(line) = event {
                println!("{:?}", line);
            }
        }
    });
}

fn main() {
    let tcp_port = TcpPort::in_range(
        "127.0.0.1",
        Range {
            min: 6000,
            max: 7000,
        },
    )
    .unwrap();

    tauri::Builder::default()
        .manage(LuauServer {
            port: Mutex::new(Some(tcp_port)),
        })
        .invoke_handler(tauri::generate_handler![get_luau_server_port, run_lune])
        .setup(move |app| {
            let app_handle = &app.app_handle();
            let window = app_handle.get_window("main").unwrap();

            if cfg!(debug_assertions) {
                run_lune(app_handle.clone());
            } else {
                let luau_server = app_handle.state::<LuauServer>();
                let port: u16 = luau_server.port.lock().unwrap().unwrap();

                let (mut rx, _child) = Command::new_sidecar("bundled")
                    .expect("failed to run lune binary")
                    .args([&port.to_string()])
                    .spawn()
                    .expect("failed to spawn sidecar");

                tauri::async_runtime::spawn(async move {
                    // read stdout
                    while let Some(event) = rx.recv().await {
                        if let CommandEvent::Stdout(line) = event {
                            process_lune_command(line, window.clone());
                        } else if let CommandEvent::Stderr(line) = event {
                            println!("{:?}", line);
                        }
                    }
                });
            }

            Ok(())
        })
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(move |_app_handle, event| match event {
            RunEvent::Exit => {
                let request =
                    "http://localhost:".to_owned() + tcp_port.to_string().as_str() + "/kill";

                println!("sent kill request to lune: {:?}", reqwest::blocking::get(request).is_ok());
            }
            _ => {}
        });
}
