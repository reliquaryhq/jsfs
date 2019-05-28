# JsFs

JsFs is a pure JavaScript implementation of an Emscripten-compatible filesystem. It is based heavily off of Emscripten's MEMFS.

JsFs is licensed under the [MIT license](https://github.com/reliquaryhq/jsfs/blob/master/LICENSE). It incorporates code from Emscripten, which is also licensed under the [MIT license](https://github.com/reliquaryhq/jsfs/blob/master/LICENSE.emscripten).

## Why JsFs?

Emscripten ships MEMFS as code inside Emscripten modules. Using MEMFS without first instantiating a module isn't really possible. JsFs permits creating file systems and populating them with files without this dependency. JsFs file systems can be mounted inside Emscripten when convenient.
