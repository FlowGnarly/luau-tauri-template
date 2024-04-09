local task = require("@lune/task")
local bindings = require("@pkg/luau-electron-bindings")
local server = bindings.server
local app = bindings.app
server.start_server(3476)

local body = app.document.querySelector("body").await()
local thread = task.spawn(function()
	while true do
		app.document.create_element("h1", "Hello, World!").await().parent = body
		task.wait(0.1)
	end
end)

server.kill = function()
	-- this function gets called when window gets reloaded or closed
	task.cancel(thread)
end
