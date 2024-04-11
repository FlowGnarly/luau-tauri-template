local bindings = require("@pkg/luau-electron-bindings")
local process = require("@lune/process")

bindings.server.start_server(process.args[1])

bindings.server.kill = function()
	process.exit(0)
end

bindings.app.on_load(function(document)
	local body = document.query_selector("body").await()
	require("../examples/click_counter")(body)
end)
