/*
	MIT License http://www.opensource.org/licenses/mit-license.php
	Author Scott Beck @bline
*/

var loaderUtils = require("loader-utils");
var Path = require('path');
var Module = require("module");

module.exports = function(source) {
	var self = this;
	this.cacheable && this.cacheable(true);
	var jade = require("jade");
	var opts = loaderUtils.getOptions(this);

	var dirname = Path.dirname(this.resourcePath);

	var tmpl = jade.compileClientWithDependenciesTracked(source, {
		filename: this.resourcePath,
		self: opts.self,
		pretty: opts.pretty,
		basedir: opts.basedir,
		locals: opts,
		compileDebug: true,
		externalRuntime: false
	});

	tmpl.dependencies.forEach(function(dep) {
		this.addDependency(dep);
	}.bind(this));
	var er = 'var jade = require(' + resolve('jade/runtime') + ');\n';

	var moduleBody = er + tmpl.body + '\n\nmodule.exports = template;\ntemplate.__require = require';

	var mod = exec(moduleBody, this.resourcePath);

	var _require = mod.__require;

	for (var file in _require.contentCache) {
		this.addDependency && this.addDependency(file);
	}

	return mod(opts.locals || opts);

	function exec(code, filename) {
	  const module = new Module(filename, self);
	  module.paths = Module._nodeModulePaths(self.context);
	  module.filename = filename;
	  module._compile(code, filename);
	  return module.exports;
	}
}

function resolve(path) {
	return JSON.stringify(require.resolve(path));
}

function toString(key, value) {
	if (!(value instanceof RegExp)) return value;
	return value.toString();
}
