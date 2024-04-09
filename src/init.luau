local bindings = require("@pkg/luau-electron-bindings")
bindings.server.start_server(3476)

require("../examples/click_counter")
