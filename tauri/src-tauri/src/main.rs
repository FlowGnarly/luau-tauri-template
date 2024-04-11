// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::io::BufRead;
use std::io::BufReader;
use std::process::Command as StdCommand;
use std::process::Stdio;
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
        let mut child = StdCommand::new("lune")
            .arg("run")
            .arg("../../src/init.luau")
            .arg(&port.to_string())
            .stdout(Stdio::piped())
            .spawn()
            .expect("Failed to run lune, install it on your system if you haven't already.");

        if let Some(ref mut stdout) = child.stdout.take() {
            let reader = BufReader::new(stdout);
            for line_result in reader.lines() {
                if line_result.is_err() { continue; }
                let line = line_result.unwrap();
                process_lune_command(line, window.clone());
            }
        }
    });
}

fn main() {
    let mut backend = Backend::default();
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
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(move |app_handle, event| match event {
            RunEvent::Ready => {
                let window = app_handle.get_window("main").unwrap();

                if !cfg!(debug_assertions) {
                    let luau_server = app_handle.state::<LuauServer>();
                    let port: u16 = luau_server.port.lock().unwrap().unwrap();

                    let (mut rx, child) = Command::new_sidecar("bundled")
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

                    _ = backend.0.insert(child);
                }
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
