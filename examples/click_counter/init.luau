local bindings = require("@pkg/luau-electron-bindings")

return function(body: bindings.HTMLElement)
	body:set_props({
		style = {
			margin = "0",
			height = "100vh",
			display = "flex",
			flexDirection = "column",
			justifyContent = "center",
			alignItems = "center",
		},
	})

	local clicks = 0

	local _, update_counter = require("./components/counter")({
		parent = body,
		get_count = function()
			return `Clicks: {clicks}`
		end,
	})

	require("./components/button")({
		parent = body,
		on_click_callback = function(e: bindings.Event)
			clicks += 1
			update_counter()
		end,
	})
end
