local bindings = require("@pkg/luau-electron-bindings")
bindings.server.start_server(require("@lune/process").args[1])

bindings.app.on_load(function(document)
	local body = document.query_selector("body").await()
	require("../examples/click_counter")(body)
end)
