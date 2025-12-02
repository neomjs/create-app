---
id: 16
title: 'README.md update:  do changes in neo-config.json  not index.html'
state: CLOSED
labels:
  - bug
assignees: []
createdAt: '2025-02-09T05:18:09Z'
updatedAt: '2025-02-10T01:06:33Z'
githubUrl: 'https://github.com/neomjs/create-app/issues/16'
author: gplanansky
commentsCount: 3
parentIssue: null
subIssues: []
subIssuesCompleted: 0
subIssuesTotal: 0
blockedBy: []
blocking: []
closedAt: '2025-02-09T12:33:11Z'
---
# README.md update:  do changes in neo-config.json  not index.html

README.md 
update lines 46, 48 to refer to `neo-config.json`  instead of `index.html`

you can change this later on inside the _index.html_     -->
you can change this later on in the _neo-config.json_ file



## Comments

### @tobiu - 2025-02-09 12:28

Hi George,

I did not touch the repo readme in a very long time :)

The change-request makes sense, I will change it.

Fun fact: It was correct before the micro-loader got created. In early neo versions, index files looked like this:

```
<!DOCTYPE HTML>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta charset="UTF-8">
    <title>Covid</title>
</head>
<body>
    <script>
        Neo = self.Neo || {}; Neo.config = Neo.config || {};

        Object.assign(Neo.config, {
            appPath       : 'apps/covid/app.mjs',
            basePath      : '../../',
            environment   : 'development',
            isExperimental: true
        });
    </script>

    <script src="../../src/Main.mjs" type="module"></script>
</body>
</html>
```

### @tobiu - 2025-02-09 12:33

done. i will create a follow-up ticket for removing section 4.

### @gplanansky - 2025-02-10 01:06

I could tell :-).

Btw, I like the pre-microloader approach, because  one file ... index.html
... had all the config stull in one place.    The microloader approach
splits that into three files, which is a pain.

Worse, the paths we specify do not make sense.  In fact,  *worker/Aps.mjs
importApp(path)*  cryptically changes the path from the one specified
developer ...  no way a developer can understand the meaning or mutual
relationships of the paths in neo-config  and app.mjs.   I rely on copying
the examples.

Another pet peeve.  If I git clone Neo, ... the paths   apps/myapp   and
examples/myapp   are ok, but neo cryptically does not allow   gp/myapp .
However, I want to try stuff out in parallel with apps and examples, so
being able to specify  a different directory than just apps and examples is
important to me.


*main/addon/ServiceWorker.mjs27:                folder          =
window.location.pathname.includes('/examples/') ? 'examples/' : 'apps/',*


*Is that the only cause of breakage?  Perhaps the above, instead of being
hard-wired, could interrogate a DefaultConfig.mjs  array value, to which
one could add a "nondist" value.*


On Sun, Feb 9, 2025 at 7:28 AM Tobias Uhlig ***@***.***>
wrote:

> Hi George,
>
> I did not touch the repo readme in a very long time :)
>
> The change-request makes sense, I will change it.
>
> Fun fact: It was correct before the micro-loader got created. In early neo
> versions, index files looked like this:
>
> <!DOCTYPE HTML>
> <html>
> <head>
>     <meta name="viewport" content="width=device-width, initial-scale=1">
>     <meta charset="UTF-8">
>     <title>Covid</title>
> </head>
> <body>
>     <script>
>         Neo = self.Neo || {}; Neo.config = Neo.config || {};
>
>         Object.assign(Neo.config, {
>             appPath       : 'apps/covid/app.mjs',
>             basePath      : '../../',
>             environment   : 'development',
>             isExperimental: true
>         });
>     </script>
>
>     <script src="../../src/Main.mjs" type="module"></script>
> </body>
> </html>
>
> —
> Reply to this email directly, view it on GitHub
> <https://github.com/neomjs/create-app/issues/16#issuecomment-2646208203>,
> or unsubscribe
> <https://github.com/notifications/unsubscribe-auth/ADSPIRPM6QTDRB346BQN54T2O5CYDAVCNFSM6AAAAABWYN6432VHI2DSMVQWIX3LMV43OSLTON2WKQ3PNVWWK3TUHMZDMNBWGIYDQMRQGM>
> .
> You are receiving this because you authored the thread.Message ID:
> ***@***.***>
>


## Activity Log

- 2025-02-09 @gplanansky added the `bug` label
- 2025-02-09 @tobiu referenced in commit `365ae68` - "README.md update: do changes in neo-config.json not index.html #16"
- 2025-02-09 @tobiu closed this issue

