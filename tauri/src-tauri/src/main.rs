// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::State;
use std::sync::Mutex;
use tauri::api::process::Command;
use tauri::api::process::CommandChild;
use tauri::api::process::CommandEvent;
use tauri::{Manager, RunEvent};

#[derive(Default)]
struct Backend(Option<CommandChild>);

struct LuauServer {
    port: Mutex<Option<u16>>,
}

#[tauri::command]
fn get_luau_server_port(luau_server: State<LuauServer>) -> u16 {
    luau_server.port.lock().unwrap().unwrap()
}

fn main() {
    let mut backend = Backend::default();

    tauri::Builder::default()
        .manage(LuauServer {
            port: Mutex::new(Some(3476))
        })
        .invoke_handler(tauri::generate_handler![get_luau_server_port])
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(move |app_handle, event| match event {
            RunEvent::Ready => {
                let window = app_handle.get_window("main").unwrap();
                let luau_server = app_handle.state::<LuauServer>();
                let port: u16 = luau_server.port.lock().unwrap().unwrap();

                let (mut rx, child) = Command::new_sidecar("bundled")
                    .expect("failed to run lune binary")
                    .args([&port.to_string()]  )
                    .spawn()
                    .expect("failed to spawn sidecar");

                tauri::async_runtime::spawn(async move {
                    // read stdout
                    while let Some(event) = rx.recv().await {
                        if let CommandEvent::Stdout(line) = event {
                            if line.trim().is_empty() {
                                continue
                            }

                            if !line.starts_with('@') {
                                println!("{:?}", line.trim());
                            }

                            window
                                .emit("message", Some(format!("{}", line)))
                                .expect("failed to emit event");
                        } else if let CommandEvent::Stderr(line) = event {
                            println!("{:?}", line);
                        }
                    }
                });

                _ = backend.0.insert(child);
            }
            RunEvent::Exit => {
                if let Some(child) = backend.0.take() {
                    child.kill().expect("Failed to shutdown lune.");
                    println!("Lune gracefully shutdown.")
                }
            }
            _ => {}
        });
}
