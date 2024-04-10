// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::api::process::Command;
use tauri::api::process::CommandChild;
use tauri::api::process::CommandEvent;
use tauri::{Manager, RunEvent};

#[derive(Default)]
struct Backend(Option<CommandChild>);

fn main() {
    let mut backend = Backend::default();

    tauri::Builder::default()
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(move |app_handle, event| match event {
            RunEvent::Ready => {
                let window = app_handle.get_window("main").unwrap();

                let (mut rx, child) = Command::new_sidecar("bundled")
                    .expect("failed to run lune binary")
                    .args(["3476"])
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
