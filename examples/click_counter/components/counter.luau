local bindings = require("@pkg/luau-electron-bindings")
local app = bindings.app
local document = app.document

type Props = {
	get_count: () -> string,
	parent: bindings.HTMLElement?,
}

return function(props: Props)
	local button = document.create_element("h1", props.get_count()).await()

	button.parent = props.parent

	return button, function()
		button.innerHTML = props.get_count()
	end
end
