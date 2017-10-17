var gulp = require('gulp');
var browserSync = require('browser-sync');
var nodemon = require('gulp-nodemon');


gulp.task('default', ['browser-sync'], () => {});

gulp.task('browser-sync', ['nodemon'], () => {
  browserSync.init(null, {
    proxy: "http://localhost:3001",
    files: ["public/**/*.*"],
    browser: "google chrome",
    port: 3000,
  });
});

gulp.task('nodemon', cb => {

  var started = false;

  return nodemon({
    script: 'bin/www'
  }).on('start', () => {
    if (!started) {
      cb();
      started = true; 
    } 
  });
});
