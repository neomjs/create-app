<p align="center">
  <a href="https://npmcharts.com/compare/neo-app?minimal=true"><img src="https://img.shields.io/npm/dm/neo-app.svg" alt="Downloads"></a>
  <a href="https://www.npmjs.com/package/neo-app"><img src="https://img.shields.io/npm/v/neo-app.svg" alt="Version"></a>
  <a href="https://www.npmjs.com/package/neo-app"><img src="https://img.shields.io/npm/l/neo-app.svg" alt="License"></a>
  <a href="https://discord.gg/6p8paPq"><img src="https://img.shields.io/discord/656620537514164249?label=discord%20chat" alt="Chat"></a>
  <a href="./CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-green.svg" alt="PRs Welcome"></a>
</p>

# neo.mjs create-app
Create a new <a href="https://github.com/neomjs/neo">neo.mjs</a> app (workspace) using the 1-liner:
> npx neo-app

npx neo-app works on macOS, Linux and Windows 10.<br>
If errors occur for your local environment, please <a href="https://github.com/neomjs/create-app/issues/new">file an issue</a>.<br>

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
11.  <a href="#alternative-options-to-create-an-app">Alternative options to create an App</a>
12.  <a href="#kudos">Kudos</a>

## Quick Overview
> npx neo-app

Running the script will prompt 3 questions:
1. Choose a workspace folder name. This folder will get created inside the terminal / CMD folder you are in.<br>
    You can rename it later on if needed.<br>
    <img width="500px" src="https://raw.githubusercontent.com/neomjs/pages/master/resources_pub/images/createApp/workspace.png">
2. Choose an app name (Pascal Case)<br>
    <img width="500px" src="https://raw.githubusercontent.com/neomjs/pages/master/resources_pub/images/createApp/appname.png">
3. Choose the themes you want to use (you can change this later on inside the neo-config.json)<br>
    <img width="500px" src="https://raw.githubusercontent.com/neomjs/pages/master/resources_pub/images/createApp/themes.png">

## Script Options
You can pass additional params to the script:<br>
<img src="https://raw.githubusercontent.com/neomjs/pages/master/resources_pub/images/createApp/scriptOptions.png">

Choose a workspace folder name:
> npx neo-app -w workspace

Choose an app name:
> npx neo-app -n MyApp

Choose the themes:
> npx neo-app -t both

Of course, you can combine the options, e.g.:
> npx neo-app -w workspace -n MyApp -t both

## Starting a local web-server
By default, npx neo-app will start a webpack dev-server right after the build.

A new browser tab should open right away:<br>
<img width="700px" src="https://raw.githubusercontent.com/neomjs/pages/master/resources_pub/images/createApp/serverStart.png">

In case you do not want to start the dev-server automatically, you can use the -s option:
> npx neo-app -s false

You can use a different web-server of your choice (e.g. webstorm) or you can start the default one manually later:
> cd workspace
>
> npm run server-start

## Viewing your app in development mode
The dev mode works in all major browsers (Chromium, Firefox & Safari).

To view your new app, you can navigate to:
> http://localhost:8096/apps/myapp/

<img width="1100px" src="https://raw.githubusercontent.com/neomjs/pages/master/resources_pub/images/createApp/serverMyApp.png">

The beauty inside this screen is:
1.  You can see 4 threads inside the bottom left edge of the console
2.  Your app as well as most parts of neo.mjs run within the App thread
3.  You get the real JS modules directly into your browser
    1.  No need to transpile JS code in this mode
    2.  No need for source-maps

## Viewing your app in dist modes
dist/development is using webpack based builds (source-maps, not minified)
> http://localhost:8096/dist/development/apps/myapp/

<img width="700px" src="https://raw.githubusercontent.com/neomjs/pages/master/resources_pub/images/createApp/Safari.png">

dist/production is using webpack based builds (no source-maps, minified)
> http://localhost:8096/dist/production/apps/myapp/

<img width="700px" src="https://raw.githubusercontent.com/neomjs/pages/master/resources_pub/images/createApp/Firefox.png">

## Workspace Content
Using the script will create the following content:<br>
<img width="800px" src="https://raw.githubusercontent.com/neomjs/pages/master/resources_pub/images/createApp/workspaceContent.png">

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
"server-start": "webpack-dev-server --open",
"build-all": "node ./node_modules/neo.mjs/buildScripts/buildAll.js -n",
"build-all-questions": "node ./buildScripts/buildAll.js",
"build-my-apps": "node ./node_modules/neo.mjs/buildScripts/webpack/buildMyApps.js",
"build-themes": "node ./node_modules/neo.mjs/buildScripts/webpack/buildThemes.js",
"build-threads": "node ./node_modules/neo.mjs/buildScripts/webpack/buildThreads.js",
"create-app": "node ./node_modules/neo.mjs/buildScripts/createApp.js",
"generate-docs-json": "node ./node_modules/neo.mjs/buildScripts/docs/jsdocx.js",
"test": "echo \"Error: no test specified\" && exit 1"
```

You need to enter the workspace folder inside your terminal / CMD.
> cd workspace

You can run each script via
> npm run \<script-name\>

Some IDEs like webstorm can show npm scripts as a toolbox, so you can just click on them instead.

1. server-start: Starts the webpack dev-server
2. build-all: npm install & builds literally everything.
3. build-all-questions: same as build all, but you can choose what to build using the inquirer interface.
4. build-themes: builds the themes for dev and / or prod and lets you choose if want to use CSS variables.
5. build-threads: builds main, data & vdom (or any combinations) for dev and / or prod.
6. create-app: add an additional app to your project. You can also trigger npx neo-app multiple times.
7. generate-docs-json: When you change your app code (e.g. adding new files) and want to see those changes inside the
Docs app, you need to run this script to update the content.

## Working on your new neo.mjs App
It is recommended to use the development mode (non dist version) for developing your App(s).
This way you can just reload the App page whenever you change the code base.
No need for source-maps and a very smooth debugging experience.

You ideally want to start with changing the view/MainContainer.mjs file.

Once you get to a point where you want to test your changes inside the dist versions, take a look at:
<a href="#packagejson-scripts">package.json Scripts</a>.

## Learning neo.mjs
Take a look into the new <a href="https://neomjs.com/dist/production/apps/portal/#/learn">Learning Section</a>

## Feedback and Questions
Feel free to use one of these options (or both):<br>
<a href="https://join.slack.com/t/neotericjs/shared_invite/enQtNDk2NjEwMTIxODQ2LWRjNGQ3ZTMzODRmZGM2NDM2NzZmZTMzZmE2YjEwNDM4NDhjZDllNWY2ZDkwOWQ5N2JmZWViYjYzZTg5YjdiMDc">Slack Channel Invite Link</a><br>
<a href="https://discord.gg/6p8paPq">Discord Chat Invite Link</a>

## Alternative options to create an App
1. Use <a href="https://github.com/neomjs/create-app">npx neo-app</a>
2. Clone or fork the <a href="https://github.com/neomjs/workspace">neo.mjs workspace</a> (if there are any issues with npx neo-app)
3. In case you want to get the <a href="https://github.com/neomjs/neo">neomjs/neo</a> repository running locally, please take a look at
   the <a href="https://github.com/neomjs/neo/blob/dev/.github/GETTING_STARTED.md">neo.mjs Getting Started Guide</a>.
   Step 6 creates a new App inside neo/apps

## Kudos
The npx neo-app script is deeply inspired by <a href="https://github.com/facebook/create-react-app">Create React App</a>.

<br><br>
Copyright (c) 2019 - today, Tobias Uhlig
