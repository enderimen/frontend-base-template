// Initialize modules
// Importing specific gulp API functions lets us write them below as series() instead of gulp.series()
const { src, dest, watch, series, parallel } = require("gulp");

// Importing all the Gulp-related packages we want to use
const sourcemaps = require("gulp-sourcemaps");
const sass = require("gulp-sass");
const postcss = require("gulp-postcss");
const autoprefixer = require("autoprefixer");
const cssnano = require("cssnano");
const replace = require("gulp-replace");
const minify = require('gulp-minify');

// File paths
const files = {
  scssPath: "scss/**/*.scss",
  jsPath: "js/**/*.js",
  htmlPath: "./*.html",
  assetsPath: "assets/**/*.*",
  outputJsPath: "dist/index-min.js",
  outputCssPath: "dist/main.css"
};

// Sass task: compiles the style.scss file into style.css
function scssTask() {
  return src(files.scssPath)
    .pipe(sourcemaps.init()) // initialize sourcemaps first
    .pipe(sass()) // compile SCSS to CSS
    .pipe(
      postcss([
        autoprefixer({
          browsers: ["last 10 versions"],
          cascade: false
        }),
        cssnano()
      ])
    ) // PostCSS plugins
    .pipe(sourcemaps.write(".")) // write sourcemaps file in current directory
    .pipe(dest("dist")); // put final CSS in dist folder
}

// JS task: compiles the *.js file into custom.js
function jsTask() {
  return src(files.jsPath)
    .pipe(minify())
    .pipe(dest("dist")); // put final js in dist folder
}

// Cachebust
var cbString = new Date().getTime();
function cacheBustTask() {
  return src(["index.html"])
    .pipe(replace(/cb=\d+/g, "cb=" + cbString))
    .pipe(dest("."));
}

// Replace html path
function copyHtml() {
  return src(files.htmlPath).pipe(dest("dist"));
}

// Replace assets path
function copyAssets() {
  return src(files.assetsPath).pipe(dest("dist/assets"));
}

// Replace html url path
function repHtmlUrl() {
  return src(`dist/**/*.html`, {
    base: "./"
  })
    .pipe(replace(files.outputCssPath, "./main.css"))
    .pipe(dest("./"));
}

// Replace js url path
function repJsUrl() {
  return src(`dist/**/*.html`, {
    base: "./"
  })
    .pipe(replace(files.outputJsPath, "./index-min.js"))
    .pipe(dest("./"));
}

// replace css url path
function repCssUrl() {
  return src(`dist/**/*.css`, {
    base: "./"
  })
    .pipe(replace("url(../../../assets", "url(./assets"))
    .pipe(dest("./"));
}

// Watch task: watch SCSS and JS files for changes
// If any change, run scss and js tasks simultaneously
function watchTask() {
  watch(
    [files.scssPath, files.htmlPath, files.jsPath],
    series(parallel(scssTask, copyHtml, jsTask), repHtmlUrl, repJsUrl, repCssUrl)
  );
}

// Export the default Gulp task so it can be run
// Runs the scss and js tasks simultaneously
// then runs cacheBust, then watch task
exports.default = series(
  parallel(scssTask, jsTask, copyHtml, copyAssets),
  cacheBustTask,
  repHtmlUrl,
  repJsUrl,
  repCssUrl,
  watchTask
);
