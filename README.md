<p align="center">
  <a href="https://npmcharts.com/compare/neo-app?minimal=true"><img src="https://img.shields.io/npm/dm/neo-app.svg" alt="Downloads"></a>
  <a href="https://www.npmjs.com/package/neo-app"><img src="https://img.shields.io/npm/v/neo-app.svg" alt="Version"></a>
  <a href="https://www.npmjs.com/package/neo-app"><img src="https://img.shields.io/npm/l/neo-app.svg" alt="License"></a>
  <a href="https://discord.gg/6p8paPq"><img src="https://img.shields.io/discord/656620537514164249?label=discord%20chat" alt="Chat"></a>
  <a href="./CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-green.svg" alt="PRs Welcome"></a>
</p>

# neo.mjs create-app
Create a new neo.mjs app using the 1-liner:
> npx neo-app

npx neo-app works on macOS, Linux and Windows 10.<br>
If something does not work, please <a href="https://github.com/neomjs/create-app/issues/new">file an issue</a>.<br>

Please ensure you have node & npm installed (npx is available for npm 5.2+).

You ***do not*** need to clone this repository or globally install the neo-app npm package.

Please take a couple of minutes to read this <a href="https://github.com/neomjs/create-app/blob/master/README.md">README.md</a> file first.

## Content
1.  <a href="#quick-overview">Quick Overview</a>
2.  <a href="#script-options">Script Options</a>
3.  <a href="#starting-a-local-web-server">Starting a local web-server</a>
4.  <a href="#viewing-your-app-in-development-mode">Viewing your app in development mode</a>
5.  <a href="#viewing-your-app-in-dist-modes">Viewing your app in dist modes</a>
6.  <a href="#workspace-content">Workspace Content</a>
7.  <a href="#packagejson-scripts">package.json Scripts</a>
8.  <a href="#working-on-your-new-neomjs-app">Working on your new neo.mjs App</a>
9.  <a href="#learning-neomjs">Learning neo.mjs</a>
10.  <a href="#feedback-and-questions">Feedback and Questions</a>
11.  <a href="#kudos">Kudos</a>

## Quick Overview
> npx neo-app

Running the script will prompt 3 questions:
1. Choose a workspace folder name. This folder will get created inside the terminal / CMD folder you are in.<br>
    You can rename it later on if needed.<br>
    <img width="500px" src="https://raw.githubusercontent.com/neomjs/pages/master/resources/images/createApp/workspace.png">
2. Choose an app name (Pascal Case)<br>
    <img width="500px" src="https://raw.githubusercontent.com/neomjs/pages/master/resources/images/createApp/appname.png">
3. Choose the themes you want to use (you can change this later on inside the index.html)<br>
    <img width="500px" src="https://raw.githubusercontent.com/neomjs/pages/master/resources/images/createApp/themes.png">

## Script Options
You can pass additional params to the script:<br>
<img width="700px" src="https://raw.githubusercontent.com/neomjs/pages/master/resources/images/createApp/scriptOptions.png">

Choose a workspace folder name:
> npx neo-app -w workspace

Choose an app name:
> npx neo-app -n MyApp

Choose the themes:
> npx neo-app -t both

Of course you can combine the options, e.g.:
> npx neo-app -w workspace -n MyApp -t both

## Starting a local web-server
By default, npx neo-app will start a webpack dev-server right after the build.<br>
***Important:*** The server-script will throw 2 errors.<br>
<img width="700px" src="https://raw.githubusercontent.com/neomjs/pages/master/resources/images/createApp/serverErrors.png">

You can ***ignore*** those. The reason is that the webpack dev-server is supposed to serve the dist folders.
Inside the neo.mjs context, we do want to use the non dist versions as well.

A new browser tab should open right away:<br>
<img width="700px" src="https://raw.githubusercontent.com/neomjs/pages/master/resources/images/createApp/serverStart.png">

In case you do not want to start the dev-server automatically, you can use the -s option:
> npx neo-app -s false

You can use a different web-server of your choice (e.g. webstorm) or you can start the default one manually later:
> cd workspace
>
> npm run server-start

## Viewing your app in development mode
At this point, the dev-mode only works in Google Chrome, since other browsers do not support JS modules inside the
worker scope yet. For more infos, take a look at the <a href="https://github.com/neomjs/neo/issues">pinned neo.mjs issues</a>.

Chrome v80 will support this out of the box, until then you need to set a custom flag:
> chrome://flags/#enable-experimental-web-platform-features

Chrome Canary does no longer need the flag, so it should not take too long until the update goes live.

To view your new app, you can navigate to:
> http://localhost:8096/apps/myapp/

<img width="1100px" src="https://raw.githubusercontent.com/neomjs/pages/master/resources/images/createApp/serverMyApp.png">

The beauty inside this screen is:
1.  You can see 4 threads inside the bottom left edge of the console
2.  Your app as well as most parts of neo.mjs run within the App thread
3.  You get the real JS modules directly into your browser
    1.  No need to transpile JS code in this mode
    2.  No need for source-maps

## Viewing your app in dist modes
For the dist versions you do ***not*** need a Chrome flag and they can run in Firefox & Safari.

Dist development is using webpack based builds (source-maps, not minified)
> http://localhost:8096/dist/development/apps/myapp/
<img width="700px" src="https://raw.githubusercontent.com/neomjs/pages/master/resources/images/createApp/Safari.png">

Dist development is using webpack based builds (no source-maps, minified)
> http://localhost:8096/dist/production/apps/myapp/
<img width="700px" src="https://raw.githubusercontent.com/neomjs/pages/master/resources/images/createApp/Firefox.png">

## Workspace Content
Using the script will create the following content:<br>
<img width="800px" src="https://raw.githubusercontent.com/neomjs/pages/master/resources/images/createApp/workspaceContent.png">

1.  .gitignore has a basic setup excluding IDE related files, the dist folder & the package-lock.json
2.  apps contains the source files of your new app. You can create multiple apps as needed.
3.  buildScripts contains meta-infos (in theory this could get stored inside the neo.mjs node_module, but then every
framework version update would require to re-create it)
4.  dist contains the development & production builds of your app, as well as the docs app
5.  docs contains a copy of the neo.mjs non dist version of the docs app. This version does show documentation views of
your app as well as all neo.mjs examples
6.  node_modules => all related dependencies which are required for the build scripts & the dev-server
7.  package.json => a dummy version; feel free to change it

## package.json Scripts
```
"server-start"            : "webpack-dev-server --open",
"generate-docs-json"      : "node ./node_modules/neo.mjs/buildScripts/docs/jsdocx.js",
"dev-build-all-my-apps"   : "webpack --config ./node_modules/neo.mjs/buildScripts/webpack/development/webpack.config.myapps.js --env.build_all=true",
"prod-build-all-my-apps"  : "webpack --config ./node_modules/neo.mjs/buildScripts/webpack/production/webpack.config.myapps.js --env.build_all=true",
"dev-build-my-apps"       : "webpack --config ./node_modules/neo.mjs/buildScripts/webpack/development/webpack.config.myapps.js",
"prod-build-my-apps"      : "webpack --config ./node_modules/neo.mjs/buildScripts/webpack/production/webpack.config.myapps.js",
"dev-css-structure"       : "webpack --config ./node_modules/neo.mjs/buildScripts/webpack/development/webpack.scss.config.js --env.json_file=neo.structure.json",
"dev-theme-dark"          : "webpack --config ./node_modules/neo.mjs/buildScripts/webpack/development/webpack.scss.config.js --env.json_file=theme.dark.json",
"dev-theme-light"         : "webpack --config ./node_modules/neo.mjs/buildScripts/webpack/development/webpack.scss.config.js --env.json_file=theme.light.json",
"prod-css-structure"      : "webpack --config ./node_modules/neo.mjs/buildScripts/webpack/production/webpack.scss.config.js --env.json_file=neo.structure.json",
"prod-theme-dark"         : "webpack --config ./node_modules/neo.mjs/buildScripts/webpack/production/webpack.scss.config.js --env.json_file=theme.dark.json",
"prod-theme-light"        : "webpack --config ./node_modules/neo.mjs/buildScripts/webpack/production/webpack.scss.config.js --env.json_file=theme.light.json",
"dev-theme-dark-no-css4"  : "webpack --config ./node_modules/neo.mjs/buildScripts/webpack/development/webpack.scss.config.js --env.json_file=theme.dark.noCss4.json",
"dev-theme-light-no-css4" : "webpack --config ./node_modules/neo.mjs/buildScripts/webpack/development/webpack.scss.config.js --env.json_file=theme.light.noCss4.json",
"prod-theme-dark-no-css4" : "webpack --config ./node_modules/neo.mjs/buildScripts/webpack/production/webpack.scss.config.js --env.json_file=theme.dark.noCss4.json",
"prod-theme-light-no-css4": "webpack --config ./node_modules/neo.mjs/buildScripts/webpack/production/webpack.scss.config.js --env.json_file=theme.light.noCss4.json",
"test"                    : "echo \"Error: no test specified\" && exit 1"
```

You need to enter the workspace folder inside your terminal / CMD.
> cd workspace

You can run each script via
> npm run \<script-name\>

Some IDEs like webstorm can show npm scripts as a toolbox, so you can just click on them instead.

1.  server-start: As mentioned in <a href="#starting-a-local-web-server">Starting a local web-server</a>, this will throw
2 errors which you can ignore.
2.  generate-docs-json: When you change your app code (e.g. adding new files) and want to see those changes inside the
Docs app, you need to run this script to update the content.
3.  dev-build-all-my-apps: creates the dist/development versions for your app(s) as well as the Docs app
4.  prod-build-all-my-apps: creates the dist/production versions for your app(s) as well as the Docs app
5.  dev-build-my-apps: creates the dist/development versions for your app(s) as well as the Docs app.
You can choose which apps you want to build. Might not work on Windows 10 (issues with the deasync npm package)
6.  prod-build-my-apps: creates the dist/production versions for your app(s) as well as the Docs app.
You can choose which apps you want to build. Might not work on Windows 10 (issues with the deasync npm package)
7.  theme related builds. You should run those when upgrading to a newer neo.mjs version, in case there were changes
inside the scss files.

## Working on your new neo.mjs App
It is recommended to use the non dist version for development (Chrome with flag). This way you can just reload the App page whenever you
change the code base. No need for source-maps and a very smooth debugging experience.

You ideally want to start with changing the view/MainContainer.mjs file.

Once you get to a point where you want to test your changes inside the dist versions, take a look at:
<a href="#packagejson-scripts">package.json Scripts</a>.

## Learning neo.mjs
To be fair, neo.mjs just got released to the public on November 23, 2019.

At this point getting up to speed is not as easy as it could be. There are a couple of guides inside the Docs app,
but on the long term we definitely need more (help on this one is greatly appreciated!).

I recommend to take a look at the code base of the <a href="https://github.com/neomjs/neo/tree/dev/docs/app/view">Docs app source</a> (which is a neo.mjs App).

The <a href="https://github.com/neomjs/neo/tree/dev/apps/realworld">Real World App</a> is also worth a look.
This one is not using a neo.mjs theme, since a given Bootstrap theme was a requirement, but it can help you to get
the idea of how to craft custom components and work with Controllers.

The <a href="https://github.com/neomjs/neo/tree/dev/apps/realworld2">Real World App v2</a> is intended to fill this gap
and will be my next major focus.

In general it does make a lot of sense to dive into the neo.mjs code base. Some starting points:<br>
<a href="https://github.com/neomjs/neo/blob/dev/src/Neo.mjs">Neo.mjs</a> (class system enhancements)<br>
<a href="https://github.com/neomjs/neo/blob/dev/src/Main.mjs">Main.mjs</a> (main thread starting point)<br>
<a href="https://github.com/neomjs/neo/blob/dev/src/worker/Manager.mjs">worker.Manager</a> (Creates the 3 workers)<br>
<a href="https://github.com/neomjs/neo/blob/dev/src/core/Base.mjs">core.Base</a> (Base class for almost everything)<br>

## Feedback and Questions
Feel free to use one of these options (or all):<br>
<a href="https://join.slack.com/t/neotericjs/shared_invite/enQtNDk2NjEwMTIxODQ2LWRjNGQ3ZTMzODRmZGM2NDM2NzZmZTMzZmE2YjEwNDM4NDhjZDllNWY2ZDkwOWQ5N2JmZWViYjYzZTg5YjdiMDc">Slack Channel Invite Link</a><br>
<a href="https://discord.gg/6p8paPq">Discord Chat Invite Link</a>

## Kudos
The npx neo-app script is deeply inspired by <a href="https://github.com/facebook/create-react-app">Create React App</a>.

<br><br>
Copyright (c) 2019 - today, Tobias Uhlig