var connect = require('connect');
var app = connect();

function logger(req,res,next){
	console.log('%s %s',req.method,req.url);
	next();
}

function hello(req,res){
	res.setHeader('Content-Type','text/plain');
	res.end('hello world');
}

app.use(logger).use(hello);
app.listen(3000);