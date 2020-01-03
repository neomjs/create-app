<p align="center">
  <a href="https://npmcharts.com/compare/neo-app?minimal=true"><img src="https://img.shields.io/npm/dm/neo-app.svg" alt="Downloads"></a>
  <a href="https://www.npmjs.com/package/neo-app"><img src="https://img.shields.io/npm/v/neo-app.svg" alt="Version"></a>
  <a href="https://www.npmjs.com/package/neo-app"><img src="https://img.shields.io/npm/l/neo-app.svg" alt="License"></a>
  <a href="https://discordapp.com/channels/656620537514164249"><img src="https://img.shields.io/discord/656620537514164249?label=discord%20chat" alt="Chat"></a>
  <a href="./CONTRIBUTING.md"><img src="https://img.shields.io/badge/PRs-welcome-green.svg" alt="PRs Welcome"></a>
</p>

# neo.mjs create-app
Create a new neo.mjs app using the 1-liner:
> npx neo-app

npx neo-app works on macOS, Linux and Windows 10.<br>
If something does not work, please <a href="https://github.com/neomjs/create-app/issues/new">file an issue</a>.<br>

Please ensure you have node & npm installed (npx is available for npm 5.2+).

You ***do not*** need to clone this repository or globally install the neo-app npm package.

### Quick Overview
> npx neo-app

Running the script will prompt 3 questions:
1. Choose a workspace folder name. This folder will get created inside the terminal / CMD folder you are in.<br>
    You can rename it later on if needed.<br>
    <img width="550px" src="https://raw.githubusercontent.com/neomjs/pages/master/resources/images/createApp/workspace.png">
2. Choose an app name (Pascal Case)<br>
    <img width="550px" src="https://raw.githubusercontent.com/neomjs/pages/master/resources/images/createApp/appname.png">
3. Choose the themes you want to use (you can change this later on inside the index.html)<br>
    <img width="550px" src="https://raw.githubusercontent.com/neomjs/pages/master/resources/images/createApp/themes.png">

### Script Options
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

### Starting a local web-server
By default, npx neo-app will start a webpack dev-server right after the build.<br>
***Important:*** The server-script will throw 2 errors.<br>
<img width="700px" src="https://raw.githubusercontent.com/neomjs/pages/master/resources/images/createApp/serverErrors.png">

You can ***ignore*** those. The reason is, that the webpack dev-server is supposed to serve the dist folders.
Inside the neo.mjs context, we do want to use the non dist versions as well.

A new browser tab should open right away:<br>
<img width="700px" src="https://raw.githubusercontent.com/neomjs/pages/master/resources/images/createApp/serverStart.png">

Deeply inspired by <a href="https://github.com/facebook/create-react-app">Create React App</a>.

Copyright (c) 2019 - today, Tobias Uhlig