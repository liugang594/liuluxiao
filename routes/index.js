var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express', path : '/' });
});
router.get('/photos', function(req, res, next) {
  res.render('photos', { title: 'Express', path : '/photos' });
});
router.get('/about', function(req, res, next) {
  res.render('about', { title: 'Express' , path:'/about'});
});
router.get('/articles', function(req, res, next) {
  res.render('articles', { title: 'Express' , path : '/articles' });
});
router.get('/login', function(req, res, next) {
  res.render('login', { title: 'Express' , path : '/login' });
});
module.exports = router;
