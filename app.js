const express = require('express'),
    connect = require('connect'),
    jade = require('jade'),
    app = module.exports = express.createServer(),
    stylus = require('stylus'),
    markdown = require('markdown').markdown,
    connectTimeout = require('connect-timeout'),
    util = require('util'),
    path = require('path'),
		mysql = require('mysql'),
    models = require('./models'),
    methodOverride = require('method-override'),
    Settings = { development: {}, test: {}, production: {} };

const connection = mysql.createConnection({
  host     : 'localhost',
  user     : 'root',
  password : 'L3j4uo9has',
  database : 'marktpl'
});

var utils = (function() {

    function isNumeric(n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    }

    function checkData(name, lastName, id) {

      var err = false;

      if(name.search(/\d/) != -1) {
        err = true;
      }

      if(lastName.search(/\d/) != -1) {
        err = true;
      }

      if(utils.isNumeric(id) == false) {
        err = true;
      }

      return err;

    }

    function checkDataLength(name, lastName) {
      var err = false;
      if(name.length>30 || name == '') {
        err = true;
      }
      if(lastName.length>50 || lastName == '') {
        err = true
      }
      return err;
    }

    function checkId(id) {

      var err = false;

			connection.query('SELECT COUNT(departmentId) AS namesCount FROM department WHERE departmentId = \'' + id + '\'', function(error, result, fields){
				if(result[0].namesCount == 0) {
					err = true;
				}
  		});

			console.log(err)
			return err;
    }

    return {
        isNumeric: isNumeric,
        checkData: checkData,
        checkDataLength: checkDataLength,
				checkId: checkId
    }
}());

function renderJadeFile(template, options) {
  var fn = jade.compile(template, options);
  return fn(options.locals);
}

app.helpers(require('./helpers.js').helpers);
app.dynamicHelpers(require('./helpers.js').dynamicHelpers);

app.configure(function() {
  app.set('views', __dirname + '/views');
  app.use(express.favicon());
  app.use(express.bodyParser());
  app.use(express.cookieParser());
  app.use(connectTimeout({ time: 10000 }));
  app.use(express.session({secret: 'topsecret'}));
  app.use(express.logger({ format: '\x1b[1m:method\x1b[0m \x1b[33m:url\x1b[0m :response-time ms' }))
  app.use(express.methodOverride());
  app.use(stylus.middleware({ src: __dirname + '/public' }));
  app.use(express.static(__dirname + '/public'));
  app.use(methodOverride('_method'));
});

app.get('/', function(req, res) {
  res.redirect('/departments');
});

/*

		[departments - get - post - put - delete]

*/

app.get('/departments', function(req, res) {
  connection.query('SELECT `name`, `description`, `departmentId` FROM department', function(error, result, fields){
      res.render('departments/index.jade', {locals: { results: result} });
  });
});

app.post('/departments/', function(req, res, next) {

  var name = req.body.name;

  var description = req.body.description;

  var err = utils.checkDataLength(name, description);

	var text = 'done';

  if(err === true) {
	  req.flash('info', 'Some err with length');
	  res.redirect('/departments');
    return;
  }

  connection.query('INSERT INTO department (name,description) VALUES (\'' + name + '\',\'' + description + '\')', function(error, result, fields){
  });

  req.flash('info', text);
  res.redirect('/departments');
});

app.put('/departments', function(req, res) {

  var name = req.body.name;

	var description = req.body.description;

	var departmentId = req.body.departmentId;

	var text = 'done';

  var err = utils.checkDataLength(name, description);

  if(err === true) {
	  req.flash('info', 'Some err with length');
	  res.redirect('/departments');
    return;
  }

  connection.query('UPDATE department SET name = \'' + name + '\', description = \'' + description + '\' WHERE departmentId = \'' + departmentId + '\'', function(error, result, fields){
		console.log(error);
  });

  req.flash('info', text);
  res.redirect('/departments');
});

app.delete('/departments/:departmentId', function(req, res, next) {

  var departmentId = req.params.departmentId;

  var text = 'department with departmentId = ' + departmentId + ' deleted.';

  connection.query('DELETE FROM department WHERE departmentId = ' + departmentId, function(error, result, fields){
  });

  req.flash('info', text);
  res.redirect('/departments');
});

/*

		[/departments]

*/

/*

		[employees - get - post - put - delete]

*/

app.get('/employees', function(req, res) {
  connection.query('SELECT `firstName`, `lastName`, `departmentId`, `personId` FROM employee', function(error, result, fields){
      res.render('employees/index.jade', {locals: { results: result} });
  });
});

app.post('/employees/', function(req, res, next) {

  var departmentId = req.body.departmentId;

  var name = req.body.name;

  var lastName = req.body.lastName;

	var err = utils.checkDataLength(name, lastName);

  var text = 'done';

	if(err === true) {
		req.flash('info', 'Some error with data length');
		res.redirect('/employees');
		return;
	}

	err = utils.checkData(name, lastName, departmentId);

	if(err === true) {
		req.flash('info', 'Some error with data');
		res.redirect('/employees');
		return;
	}

	err = utils.checkId(departmentId);

	connection.query('INSERT INTO employee (firstName,lastName,departmentId) VALUES (\'' + name + '\',\'' + lastName + '\',\'' + departmentId + '\')', function(error, result, fields){
	});

	req.flash('info', text);
	res.redirect('/employees');
});

app.put('/employees', function(req, res) {

  var lastName = req.body.lastName;

  var firstName = req.body.name;

  var departmentId = req.body.departmentId;

  var personId = req.body.personId;

	var text = 'done';

	var err = utils.checkDataLength(firstName, lastName);

  if(err === true) {
	  req.flash('info', 'Some err with data length');
	  res.redirect('/employees');
      return;
  }

  err = utils.checkData(firstName,lastName,departmentId);

  if(err === true) {
	  req.flash('info', 'Some err with data');
	  res.redirect('/employees');
      return;
  }

	err = utils.checkId(departmentId);

  connection.query('UPDATE employee SET departmentId = \'' + departmentId + '\', lastName = \'' + lastName + '\', firstName = \'' + firstName + '\' WHERE personId = \'' + personId + '\'', function(error, result, fields){
  });

  req.flash('info', text);
  res.redirect('/employees');
});


app.delete('/employees/:personId', function(req, res, next) {

  var personId = req.params.personId;

  var text = 'person with personId = ' + personId + ' deleted.';

  connection.query('DELETE FROM employee WHERE personId = \'' + personId + '\'', function(error, result, fields){
  });

  req.flash('info', text);
  res.redirect('/employees');
});

/*

		[/employees]

*/

// Error handling
function NotFound(msg) {
  this.name = 'NotFound';
  Error.call(this, msg);
  Error.captureStackTrace(this, arguments.callee);
}

util.inherits(NotFound, Error);

app.get('/404', function(req, res) {
  res.render('404.jade', { status: 404 });
});

app.get('/500', function(req, res) {
  throw new Error('An expected error');
});

app.get('/bad', function(req, res) {
  unknownMethod();
});

app.use(function(req, res, next) {
  res.render('404.jade', { status: 404 });
});

app.use(function(err, req, res, next) {
  console.error(err.stack);
  res.render('500.jade', { error: 500 });
});

if (!module.parent) {
  app.listen(3000, '192.168.1.33', function() {
    console.log('Express server listening on port %d, environment: %s', app.address().port, app.settings.env)
  });
  
  console.log('Using connect %s, Express %s, Jade %s', connect.version, express.version, jade.version);
}

